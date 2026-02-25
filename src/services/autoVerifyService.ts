import { supabase } from '@/integrations/supabase/client';
import { getFinishedMatches } from './footballApiService';
import { PredictionRecord } from '@/types/prediction';
import { Match, SUPPORTED_COMPETITIONS, CompetitionCode } from '@/types/footballApi';
import { updateMLModelStats } from './mlPredictionService';

interface VerificationResult {
  predictionId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  wasCorrect: boolean;
  predictionType: string;
  predictionValue: string;
}

// Normalize team names for matching
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/fc\s*/gi, '')
    .replace(/\s*fc/gi, '')
    .replace(/afc\s*/gi, '')
    .replace(/\s*afc/gi, '')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check if two team names match
function teamsMatch(dbTeam: string, apiTeam: string): boolean {
  const normalized1 = normalizeTeamName(dbTeam);
  const normalized2 = normalizeTeamName(apiTeam);
  
  // Exact match
  if (normalized1 === normalized2) return true;
  
  // One contains the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return true;
  
  // Check if first word matches (for cases like "Bayern" vs "Bayern München")
  const words1 = normalized1.split(' ');
  const words2 = normalized2.split(' ');
  if (words1[0] === words2[0] && words1[0].length > 3) return true;
  
  return false;
}

function checkPredictionCorrect(
  type: string,
  prediction: string,
  homeScore: number,
  awayScore: number,
  homeTeam: string,
  awayTeam: string
): boolean {
  const totalGoals = homeScore + awayScore;

  switch (type) {
    case 'Maç Sonucu': {
      if (homeScore > awayScore && prediction.includes(homeTeam)) return true;
      if (awayScore > homeScore && prediction.includes(awayTeam)) return true;
      if (homeScore === awayScore && prediction.includes('Beraberlik')) return true;
      return false;
    }

    case 'Toplam Gol Alt/Üst': {
      if (prediction.includes('2.5 Üst') && totalGoals > 2.5) return true;
      if (prediction.includes('2.5 Alt') && totalGoals < 2.5) return true;
      return false;
    }

    case 'Karşılıklı Gol': {
      const bothScored = homeScore > 0 && awayScore > 0;
      if (prediction === 'Evet' && bothScored) return true;
      if (prediction === 'Hayır' && !bothScored) return true;
      return false;
    }

    case 'Doğru Skor': {
      return prediction === `${homeScore}-${awayScore}`;
    }

    case 'İlk Yarı Sonucu':
    case 'İlk Yarı / Maç Sonucu':
    case 'İki Yarıda da Gol': {
      // Cannot verify these without half-time score data
      // Return false to skip verification (will remain as pending)
      console.log(`Skipping verification for ${type} - requires half-time data`);
      return false;
    }

    default:
      return false;
  }
}

// Get pending predictions that haven't been verified yet (only primary predictions)
export async function getPendingPredictions(): Promise<PredictionRecord[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .is('is_correct', null)
    .eq('is_primary', true) // Only verify primary predictions
    .order('match_date', { ascending: false });

  if (error) {
    console.error('Error fetching pending predictions:', error);
    throw error;
  }

  return data as PredictionRecord[];
}

// Find matching API match for a prediction
function findMatchingApiMatch(
  prediction: PredictionRecord,
  finishedMatches: Match[]
): Match | null {
  const predDate = new Date(prediction.match_date).toISOString().split('T')[0];
  
  for (const match of finishedMatches) {
    const matchDate = match.utcDate.split('T')[0];
    
    // Check if dates match (allow 1 day difference for timezone issues)
    const dateDiff = Math.abs(new Date(predDate).getTime() - new Date(matchDate).getTime());
    const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 1) continue;
    
    // Check if teams match
    const homeMatches = teamsMatch(prediction.home_team, match.homeTeam.name) ||
                       teamsMatch(prediction.home_team, match.homeTeam.shortName || '');
    const awayMatches = teamsMatch(prediction.away_team, match.awayTeam.name) ||
                       teamsMatch(prediction.away_team, match.awayTeam.shortName || '');
    
    if (homeMatches && awayMatches) {
      return match;
    }
  }
  
  return null;
}

// Update prediction features with verification result
async function updatePredictionFeatures(
  predictionId: string,
  wasCorrect: boolean,
  actualResult: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('prediction_features')
      .update({
        was_correct: wasCorrect,
        actual_result: actualResult,
      })
      .eq('prediction_id', predictionId);

    if (error) {
      console.error('Error updating prediction features:', error);
    }
  } catch (error) {
    console.error('Error in updatePredictionFeatures:', error);
  }
}

// Verify a single prediction with match data
async function verifyPredictionWithMatch(
  prediction: PredictionRecord,
  match: Match
): Promise<VerificationResult | null> {
  if (!match.score?.fullTime?.home === undefined || match.score?.fullTime?.away === undefined) {
    return null;
  }
  
  const homeScore = match.score.fullTime.home ?? 0;
  const awayScore = match.score.fullTime.away ?? 0;
  
  const isCorrect = checkPredictionCorrect(
    prediction.prediction_type,
    prediction.prediction_value,
    homeScore,
    awayScore,
    prediction.home_team,
    prediction.away_team
  );

  const actualResult = `${homeScore}-${awayScore}`;

  // Update the prediction in database
  const { error } = await supabase
    .from('predictions')
    .update({
      home_score: homeScore,
      away_score: awayScore,
      actual_result: actualResult,
      is_correct: isCorrect,
      verified_at: new Date().toISOString(),
    })
    .eq('id', prediction.id);

  if (error) {
    console.error('Error updating prediction:', error);
    return null;
  }

  // Check AI and Math predictions separately from prediction_features
  let aiWasCorrect: boolean | null = null;
  let mathWasCorrect: boolean | null = null;

  try {
    const { data: features } = await supabase
      .from('prediction_features')
      .select('ai_prediction_value, math_prediction_value')
      .eq('prediction_id', prediction.id)
      .single();

    if (features) {
      const aiPredValue = (features as any).ai_prediction_value;
      const mathPredValue = (features as any).math_prediction_value;

      if (aiPredValue) {
        aiWasCorrect = checkPredictionCorrect(
          prediction.prediction_type, aiPredValue, homeScore, awayScore, prediction.home_team, prediction.away_team
        );
      }
      if (mathPredValue) {
        mathWasCorrect = checkPredictionCorrect(
          prediction.prediction_type, mathPredValue, homeScore, awayScore, prediction.home_team, prediction.away_team
        );
      }

      // Update ai_was_correct and math_was_correct
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        was_correct: isCorrect,
        actual_result: actualResult,
      };
      if (aiWasCorrect !== null) updateData.ai_was_correct = aiWasCorrect;
      if (mathWasCorrect !== null) updateData.math_was_correct = mathWasCorrect;

      await supabase
        .from('prediction_features')
        .update(updateData)
        .eq('prediction_id', prediction.id);
    }
  } catch (featError) {
    console.error('Error checking AI/Math individual correctness:', featError);
  }

  // Update ML model stats for learning loop (with AI/Math separate tracking)
  try {
    await updateMLModelStats(prediction.prediction_type, isCorrect, aiWasCorrect, mathWasCorrect);
    console.log(`ML stats updated for ${prediction.prediction_type}: hybrid=${isCorrect}, ai=${aiWasCorrect}, math=${mathWasCorrect}`);
  } catch (mlError) {
    console.error('Error updating ML stats:', mlError);
  }

  return {
    predictionId: prediction.id,
    homeTeam: prediction.home_team,
    awayTeam: prediction.away_team,
    homeScore,
    awayScore,
    wasCorrect: isCorrect,
    predictionType: prediction.prediction_type,
    predictionValue: prediction.prediction_value,
  };
}

// Map league name to competition code
function getCompetitionCode(league: string): CompetitionCode | null {
  const leagueMap: Record<string, CompetitionCode> = {
    'Premier League': 'PL',
    'Bundesliga': 'BL1',
    'La Liga': 'PD',
    'Serie A': 'SA',
    'Ligue 1': 'FL1',
    'UEFA Champions League': 'CL',
    'Champions League': 'CL',
  };
  
  return leagueMap[league] || null;
}

// Main auto-verification function
export async function autoVerifyPredictions(): Promise<{
  verified: VerificationResult[];
  notFound: PredictionRecord[];
  errors: string[];
  mlStatsUpdated: number;
}> {
  const results: VerificationResult[] = [];
  const notFound: PredictionRecord[] = [];
  const errors: string[] = [];
  let mlStatsUpdated = 0;

  try {
    // Get pending predictions
    const pendingPredictions = await getPendingPredictions();
    
    if (pendingPredictions.length === 0) {
      return { verified: results, notFound, errors, mlStatsUpdated };
    }

    // Group predictions by league
    const predictionsByLeague = pendingPredictions.reduce((acc, pred) => {
      if (!acc[pred.league]) {
        acc[pred.league] = [];
      }
      acc[pred.league].push(pred);
      return acc;
    }, {} as Record<string, PredictionRecord[]>);

    // Fetch finished matches for each league
    for (const [league, predictions] of Object.entries(predictionsByLeague)) {
      const competitionCode = getCompetitionCode(league);
      
      if (!competitionCode) {
        errors.push(`Desteklenmeyen lig: ${league}`);
        notFound.push(...predictions);
        continue;
      }

      try {
        // Fetch last 14 days of finished matches
        const finishedMatches = await getFinishedMatches(competitionCode, 14);
        
        for (const prediction of predictions) {
          const matchingMatch = findMatchingApiMatch(prediction, finishedMatches);
          
          if (matchingMatch) {
            const result = await verifyPredictionWithMatch(prediction, matchingMatch);
            if (result) {
              results.push(result);
              mlStatsUpdated++;
            }
          } else {
            // Check if match date is in the past (should have a result)
            const matchDate = new Date(prediction.match_date);
            const now = new Date();
            if (matchDate < now) {
              notFound.push(prediction);
            }
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Bilinmeyen hata';
        errors.push(`${league} için maç verileri alınamadı: ${errorMsg}`);
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Bilinmeyen hata';
    errors.push(`Genel hata: ${errorMsg}`);
  }

  console.log(`Auto-verify complete: ${results.length} verified, ${mlStatsUpdated} ML stats updated`);
  return { verified: results, notFound, errors, mlStatsUpdated };
}

// Get ML model performance summary
export async function getMLModelPerformance(): Promise<{
  predictionType: string;
  accuracy: number;
  total: number;
  correct: number;
}[]> {
  try {
    const { data, error } = await supabase
      .from('ml_model_stats')
      .select('prediction_type, accuracy_percentage, total_predictions, correct_predictions')
      .order('accuracy_percentage', { ascending: false });

    if (error) {
      console.error('Error fetching ML model performance:', error);
      return [];
    }

    return (data || []).map(stat => ({
      predictionType: stat.prediction_type,
      accuracy: stat.accuracy_percentage || 0,
      total: stat.total_predictions || 0,
      correct: stat.correct_predictions || 0,
    }));
  } catch (error) {
    console.error('Error in getMLModelPerformance:', error);
    return [];
  }
}
