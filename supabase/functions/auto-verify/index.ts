import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4';

interface Match {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: { id: number; name: string; shortName?: string };
  awayTeam: { id: number; name: string; shortName?: string };
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime?: { home: number | null; away: number | null };
  };
}

interface PredictionRecord {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;
  league: string;
  prediction_type: string;
  prediction_value: string;
  is_correct: boolean | null;
}

// League to competition code mapping
const LEAGUE_MAP: Record<string, string> = {
  // English names
  'Premier League': 'PL',
  'Bundesliga': 'BL1',
  'La Liga': 'PD',
  'Serie A': 'SA',
  'Ligue 1': 'FL1',
  'UEFA Champions League': 'CL',
  'Champions League': 'CL',
  // Turkish names
  'İngiltere Premier Ligi': 'PL',
  'Almanya Bundesliga': 'BL1',
  'İspanya La Liga': 'PD',
  'İtalya Serie A': 'SA',
  'Fransa Ligue 1': 'FL1',
  'UEFA Şampiyonlar Ligi': 'CL',
  // Short codes (for backwards compatibility)
  'PL': 'PL',
  'BL1': 'BL1',
  'PD': 'PD',
  'SA': 'SA',
  'FL1': 'FL1',
  'CL': 'CL',
};

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
  
  if (normalized1 === normalized2) return true;
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return true;
  
  const words1 = normalized1.split(' ');
  const words2 = normalized2.split(' ');
  if (words1[0] === words2[0] && words1[0].length > 3) return true;
  
  return false;
}

// Check if prediction is correct
function checkPredictionCorrect(
  type: string,
  prediction: string,
  homeScore: number,
  awayScore: number,
  homeTeam: string,
  awayTeam: string
): boolean | null {
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
      // Cannot verify without half-time data
      return null;
    }

    default:
      return null;
  }
}

// Fetch finished matches for a competition
async function fetchFinishedMatches(
  competitionCode: string, 
  apiKey: string, 
  days: number = 14
): Promise<Match[]> {
  const dateTo = new Date().toISOString().split('T')[0];
  const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const url = `${FOOTBALL_DATA_BASE_URL}/competitions/${competitionCode}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}&status=FINISHED`;
  
  console.log(`Fetching finished matches from: ${url}`);
  
  const response = await fetch(url, {
    headers: { 'X-Auth-Token': apiKey },
  });
  
  if (response.status === 429) {
    console.warn('Rate limited, skipping this competition');
    return [];
  }
  
  if (!response.ok) {
    console.error(`API error for ${competitionCode}: ${response.status}`);
    return [];
  }
  
  const data = await response.json();
  return data.matches || [];
}

// Find matching API match for a prediction
function findMatchingApiMatch(
  prediction: PredictionRecord,
  finishedMatches: Match[]
): Match | null {
  const predDate = new Date(prediction.match_date).toISOString().split('T')[0];
  
  for (const match of finishedMatches) {
    const matchDate = match.utcDate.split('T')[0];
    
    const dateDiff = Math.abs(new Date(predDate).getTime() - new Date(matchDate).getTime());
    const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 1) continue;
    
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== Auto-verify cron job started ===');
  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const footballApiKey = Deno.env.get('FOOTBALL_DATA_API_KEY');
    
    if (!footballApiKey) {
      throw new Error('FOOTBALL_DATA_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get pending predictions
    const { data: pendingPredictions, error: fetchError } = await supabase
      .from('predictions')
      .select('*')
      .is('is_correct', null)
      .order('match_date', { ascending: false })
      .limit(100); // Process max 100 at a time

    if (fetchError) {
      throw new Error(`Failed to fetch predictions: ${fetchError.message}`);
    }

    console.log(`Found ${pendingPredictions?.length || 0} pending predictions`);

    if (!pendingPredictions || pendingPredictions.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No pending predictions to verify',
        verified: 0,
        notFound: 0,
        duration: Date.now() - startTime,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Group by league
    const predictionsByLeague = pendingPredictions.reduce((acc, pred) => {
      if (!acc[pred.league]) acc[pred.league] = [];
      acc[pred.league].push(pred);
      return acc;
    }, {} as Record<string, PredictionRecord[]>);

    let totalVerified = 0;
    let totalNotFound = 0;
    let totalSkipped = 0;
    const errors: string[] = [];

    // Process each league with rate limiting (6.5s between requests)
    for (const [league, leaguePredictions] of Object.entries(predictionsByLeague)) {
      const predictions = leaguePredictions as PredictionRecord[];
      const competitionCode = LEAGUE_MAP[league];
      
      if (!competitionCode) {
        console.warn(`Unsupported league: ${league}`);
        errors.push(`Unsupported league: ${league}`);
        totalNotFound += predictions.length;
        continue;
      }

      console.log(`Processing ${predictions.length} predictions for ${league} (${competitionCode})`);

      try {
        // Fetch finished matches
        const finishedMatches = await fetchFinishedMatches(competitionCode, footballApiKey);
        console.log(`Found ${finishedMatches.length} finished matches for ${competitionCode}`);

        for (const prediction of predictions) {
          const matchingMatch = findMatchingApiMatch(prediction, finishedMatches);
          
          if (matchingMatch && matchingMatch.score?.fullTime?.home !== null) {
            const homeScore = matchingMatch.score.fullTime.home ?? 0;
            const awayScore = matchingMatch.score.fullTime.away ?? 0;
            
            const isCorrect = checkPredictionCorrect(
              prediction.prediction_type,
              prediction.prediction_value,
              homeScore,
              awayScore,
              prediction.home_team,
              prediction.away_team
            );

            if (isCorrect === null) {
              // Cannot verify this prediction type
              totalSkipped++;
              continue;
            }

            const actualResult = `${homeScore}-${awayScore}`;

            // Update prediction
            const { error: updateError } = await supabase
              .from('predictions')
              .update({
                home_score: homeScore,
                away_score: awayScore,
                actual_result: actualResult,
                is_correct: isCorrect,
                verified_at: new Date().toISOString(),
              })
              .eq('id', prediction.id);

            if (updateError) {
              console.error(`Error updating prediction ${prediction.id}:`, updateError);
              errors.push(`Update error: ${prediction.id}`);
              continue;
            }

            // Update ML model stats
            const { error: mlError } = await supabase.rpc('increment_ml_stats', {
              p_prediction_type: prediction.prediction_type,
              p_is_correct: isCorrect,
            });

            if (mlError) {
              // Try upsert manually
              const { data: existing } = await supabase
                .from('ml_model_stats')
                .select('*')
                .eq('prediction_type', prediction.prediction_type)
                .single();

              if (existing) {
                const newTotal = (existing.total_predictions || 0) + 1;
                const newCorrect = (existing.correct_predictions || 0) + (isCorrect ? 1 : 0);
                const newAccuracy = (newCorrect / newTotal) * 100;

                await supabase
                  .from('ml_model_stats')
                  .update({
                    total_predictions: newTotal,
                    correct_predictions: newCorrect,
                    accuracy_percentage: newAccuracy,
                    last_updated: new Date().toISOString(),
                  })
                  .eq('prediction_type', prediction.prediction_type);
              } else {
                await supabase
                  .from('ml_model_stats')
                  .insert({
                    prediction_type: prediction.prediction_type,
                    total_predictions: 1,
                    correct_predictions: isCorrect ? 1 : 0,
                    accuracy_percentage: isCorrect ? 100 : 0,
                    last_updated: new Date().toISOString(),
                  });
              }
            }

            // Update prediction_features table
            await supabase
              .from('prediction_features')
              .update({
                was_correct: isCorrect,
                actual_result: actualResult,
              })
              .eq('prediction_id', prediction.id);

            totalVerified++;
            console.log(`Verified: ${prediction.home_team} vs ${prediction.away_team} = ${isCorrect ? '✓' : '✗'}`);
          } else {
            // Match not found or not finished yet
            const matchDate = new Date(prediction.match_date);
            if (matchDate < new Date()) {
              totalNotFound++;
            }
          }
        }

        // Wait between league requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 6500));
        
      } catch (leagueError) {
        const errorMsg = leagueError instanceof Error ? leagueError.message : 'Unknown error';
        console.error(`Error processing ${league}:`, errorMsg);
        errors.push(`${league}: ${errorMsg}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`=== Auto-verify completed in ${duration}ms ===`);
    console.log(`Verified: ${totalVerified}, Not found: ${totalNotFound}, Skipped: ${totalSkipped}`);

    return new Response(JSON.stringify({
      success: true,
      verified: totalVerified,
      notFound: totalNotFound,
      skipped: totalSkipped,
      errors: errors.length > 0 ? errors : undefined,
      duration,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Auto-verify error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      duration: Date.now() - startTime,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});