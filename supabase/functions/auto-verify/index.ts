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
  is_premium?: boolean;
  hybrid_confidence?: number;
}

// League to competition code mapping - EXTENDED with all variations
const LEAGUE_MAP: Record<string, string> = {
  // Short codes (primary - used in database)
  'PL': 'PL',
  'BL1': 'BL1',
  'PD': 'PD',
  'SA': 'SA',
  'FL1': 'FL1',
  'CL': 'CL',
  
  // English names
  'Premier League': 'PL',
  'Bundesliga': 'BL1',
  'La Liga': 'PD',
  'LaLiga': 'PD',
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
};

// Normalize league name for flexible matching
function normalizeLeagueName(league: string): string | null {
  // Direct match first
  if (LEAGUE_MAP[league]) {
    return LEAGUE_MAP[league];
  }
  
  // Case-insensitive match
  const lowerLeague = league.toLowerCase();
  for (const [key, value] of Object.entries(LEAGUE_MAP)) {
    if (key.toLowerCase() === lowerLeague) {
      return value;
    }
  }
  
  // Partial match
  if (lowerLeague.includes('la liga') || lowerLeague.includes('laliga')) return 'PD';
  if (lowerLeague.includes('premier')) return 'PL';
  if (lowerLeague.includes('serie a')) return 'SA';
  if (lowerLeague.includes('bundesliga')) return 'BL1';
  if (lowerLeague.includes('ligue 1')) return 'FL1';
  if (lowerLeague.includes('champions')) return 'CL';
  
  return null;
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
  awayTeam: string,
  halfTimeHome?: number | null,
  halfTimeAway?: number | null
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
      if (prediction.includes('1.5 Üst') && totalGoals > 1.5) return true;
      if (prediction.includes('1.5 Alt') && totalGoals < 1.5) return true;
      if (prediction.includes('3.5 Üst') && totalGoals > 3.5) return true;
      if (prediction.includes('3.5 Alt') && totalGoals < 3.5) return true;
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

    case 'İlk Yarı Sonucu': {
      if (halfTimeHome === null || halfTimeHome === undefined || 
          halfTimeAway === null || halfTimeAway === undefined) {
        return null; // Cannot verify without HT data
      }
      if (halfTimeHome > halfTimeAway && prediction.includes(homeTeam)) return true;
      if (halfTimeAway > halfTimeHome && prediction.includes(awayTeam)) return true;
      if (halfTimeHome === halfTimeAway && prediction.includes('Beraberlik')) return true;
      return false;
    }

    case 'İlk Yarı / Maç Sonucu': {
      if (halfTimeHome === null || halfTimeHome === undefined || 
          halfTimeAway === null || halfTimeAway === undefined) {
        return null;
      }
      const [htPrediction, ftPrediction] = prediction.split(' / ');
      
      let htCorrect = false;
      if (halfTimeHome > halfTimeAway && htPrediction.includes('Ev')) htCorrect = true;
      if (halfTimeAway > halfTimeHome && htPrediction.includes('Dep')) htCorrect = true;
      if (halfTimeHome === halfTimeAway && htPrediction.includes('Ber')) htCorrect = true;
      
      let ftCorrect = false;
      if (homeScore > awayScore && ftPrediction.includes('Ev')) ftCorrect = true;
      if (awayScore > homeScore && ftPrediction.includes('Dep')) ftCorrect = true;
      if (homeScore === awayScore && ftPrediction.includes('Ber')) ftCorrect = true;
      
      return htCorrect && ftCorrect;
    }

    case 'İki Yarıda da Gol': {
      if (halfTimeHome === null || halfTimeHome === undefined || 
          halfTimeAway === null || halfTimeAway === undefined) {
        return null;
      }
      const firstHalfGoals = halfTimeHome + halfTimeAway;
      const secondHalfGoals = totalGoals - firstHalfGoals;
      const bothHalvesGoal = firstHalfGoals > 0 && secondHalfGoals > 0;
      
      if (prediction === 'Evet' && bothHalvesGoal) return true;
      if (prediction === 'Hayır' && !bothHalvesGoal) return true;
      return false;
    }

    default:
      return null;
  }
}

// Update bet slip status based on all items
async function updateBetSlipStatus(supabase: any, slipId: string) {
  // Get all items for this slip
  const { data: items, error } = await supabase
    .from('bet_slip_items')
    .select('is_correct')
    .eq('slip_id', slipId);
  
  if (error || !items || items.length === 0) return;
  
  const total = items.length;
  const verified = items.filter((i: any) => i.is_correct !== null).length;
  const correct = items.filter((i: any) => i.is_correct === true).length;
  const wrong = items.filter((i: any) => i.is_correct === false).length;
  
  // Only update status when all items are verified
  if (verified === total) {
    let status: 'won' | 'lost' | 'partial';
    
    if (correct === total) {
      status = 'won';  // All correct
    } else if (wrong === total) {
      status = 'lost'; // All wrong
    } else {
      status = 'partial'; // Mixed results
    }
    
    await supabase
      .from('bet_slips')
      .update({ 
        status, 
        is_verified: true 
      })
      .eq('id', slipId);
    
    console.log(`[auto-verify] Updated bet slip ${slipId}: status=${status}, verified=true`);
  } else {
    console.log(`[auto-verify] Bet slip ${slipId}: ${verified}/${total} items verified, waiting for more`);
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
  
  console.log(`[auto-verify] Fetching: ${url}`);
  
  const response = await fetch(url, {
    headers: { 'X-Auth-Token': apiKey },
  });
  
  if (response.status === 429) {
    console.warn(`[auto-verify] Rate limited for ${competitionCode}`);
    return [];
  }
  
  if (!response.ok) {
    console.error(`[auto-verify] API error for ${competitionCode}: ${response.status}`);
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

  console.log('=== [auto-verify] Started ===');
  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const footballApiKey = Deno.env.get('FOOTBALL_DATA_API_KEY');
    
    if (!footballApiKey) {
      throw new Error('FOOTBALL_DATA_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get pending PRIMARY predictions only
    const { data: pendingPredictions, error: fetchError } = await supabase
      .from('predictions')
      .select('*')
      .is('is_correct', null)
      .eq('is_primary', true) // Only verify primary predictions
      .order('match_date', { ascending: false })
      .limit(100);

    if (fetchError) {
      throw new Error(`Failed to fetch predictions: ${fetchError.message}`);
    }

    console.log(`[auto-verify] Found ${pendingPredictions?.length || 0} pending primary predictions`);

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

    // Group by league and log details
    const predictionsByLeague = pendingPredictions.reduce((acc, pred) => {
      if (!acc[pred.league]) acc[pred.league] = [];
      acc[pred.league].push(pred);
      return acc;
    }, {} as Record<string, PredictionRecord[]>);

    console.log(`[auto-verify] Leagues to process:`, Object.keys(predictionsByLeague));

    let totalVerified = 0;
    let totalNotFound = 0;
    let totalSkipped = 0;
    const errors: string[] = [];
    const verifiedDetails: { match: string; result: string; correct: boolean }[] = [];

    // Process each league with rate limiting
    for (const [league, leaguePredictions] of Object.entries(predictionsByLeague)) {
      const predictions = leaguePredictions as PredictionRecord[];
      
      // Use flexible league normalization
      const competitionCode = normalizeLeagueName(league);
      
      if (!competitionCode) {
        console.error(`[auto-verify] ❌ Unsupported league: "${league}"`);
        console.error(`[auto-verify] Available mappings:`, Object.keys(LEAGUE_MAP));
        errors.push(`Unsupported league: ${league}`);
        totalNotFound += predictions.length;
        continue;
      }

      console.log(`[auto-verify] Processing ${predictions.length} predictions for "${league}" → ${competitionCode}`);

      try {
        const finishedMatches = await fetchFinishedMatches(competitionCode, footballApiKey);
        console.log(`[auto-verify] Found ${finishedMatches.length} finished matches for ${competitionCode}`);

        for (const prediction of predictions) {
          console.log(`[auto-verify] Checking: ${prediction.home_team} vs ${prediction.away_team} (${prediction.match_date})`);
          
          const matchingMatch = findMatchingApiMatch(prediction, finishedMatches);
          
          if (matchingMatch && matchingMatch.score?.fullTime?.home !== null) {
            const homeScore = matchingMatch.score.fullTime.home ?? 0;
            const awayScore = matchingMatch.score.fullTime.away ?? 0;
            const halfTimeHome = matchingMatch.score.halfTime?.home ?? null;
            const halfTimeAway = matchingMatch.score.halfTime?.away ?? null;
            
            console.log(`[auto-verify] ✓ Match found: ${matchingMatch.homeTeam.name} vs ${matchingMatch.awayTeam.name} (${homeScore}-${awayScore})`);
            
            const isCorrect = checkPredictionCorrect(
              prediction.prediction_type,
              prediction.prediction_value,
              homeScore,
              awayScore,
              prediction.home_team,
              prediction.away_team,
              halfTimeHome,
              halfTimeAway
            );

            if (isCorrect === null) {
              console.log(`[auto-verify] ⏭ Skipped (needs HT data): ${prediction.prediction_type}`);
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
              console.error(`[auto-verify] Error updating prediction ${prediction.id}:`, updateError);
              errors.push(`Update error: ${prediction.id}`);
              continue;
            }

            // Update ML model stats
            const isPremium = prediction.is_premium === true;
            
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
                
                const premiumTotal = isPremium ? (existing.premium_total || 0) + 1 : (existing.premium_total || 0);
                const premiumCorrect = isPremium ? (existing.premium_correct || 0) + (isCorrect ? 1 : 0) : (existing.premium_correct || 0);
                const premiumAccuracy = premiumTotal > 0 ? (premiumCorrect / premiumTotal) * 100 : 0;

                await supabase
                  .from('ml_model_stats')
                  .update({
                    total_predictions: newTotal,
                    correct_predictions: newCorrect,
                    accuracy_percentage: newAccuracy,
                    premium_total: premiumTotal,
                    premium_correct: premiumCorrect,
                    premium_accuracy: premiumAccuracy,
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
                    premium_total: isPremium ? 1 : 0,
                    premium_correct: isPremium && isCorrect ? 1 : 0,
                    premium_accuracy: isPremium ? (isCorrect ? 100 : 0) : 0,
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

            // === BET SLIP ITEMS VERIFICATION ===
            // Find ALL pending bet slip items (not matched by exact team names)
            const { data: allPendingSlipItems } = await supabase
              .from('bet_slip_items')
              .select('id, slip_id, prediction_type, prediction_value, home_team, away_team')
              .is('is_correct', null);

            if (allPendingSlipItems && allPendingSlipItems.length > 0) {
              // Filter items that match this prediction using normalized team names
              const matchingSlipItems = allPendingSlipItems.filter(item => {
                const homeMatches = teamsMatch(item.home_team, prediction.home_team);
                const awayMatches = teamsMatch(item.away_team, prediction.away_team);
                return homeMatches && awayMatches;
              });
              
              if (matchingSlipItems.length > 0) {
                console.log(`[auto-verify] Found ${matchingSlipItems.length} bet slip items for this match (normalized matching)`);
                
                for (const slipItem of matchingSlipItems) {
                  const itemCorrect = checkPredictionCorrect(
                    slipItem.prediction_type,
                    slipItem.prediction_value,
                    homeScore,
                    awayScore,
                    prediction.home_team,
                    prediction.away_team,
                    halfTimeHome,
                    halfTimeAway
                  );
                  
                  if (itemCorrect !== null) {
                    // Update the bet slip item
                    await supabase
                      .from('bet_slip_items')
                      .update({
                        is_correct: itemCorrect,
                        home_score: homeScore,
                        away_score: awayScore,
                      })
                      .eq('id', slipItem.id);
                    
                    console.log(`[auto-verify] Updated slip item ${slipItem.id}: ${itemCorrect ? 'CORRECT' : 'WRONG'}`);
                    
                    // Update the parent bet slip status
                    await updateBetSlipStatus(supabase, slipItem.slip_id);
                  }
                }
              }
            }

            totalVerified++;
            verifiedDetails.push({
              match: `${prediction.home_team} vs ${prediction.away_team}`,
              result: actualResult,
              correct: isCorrect,
            });
            console.log(`[auto-verify] ✅ Verified: ${prediction.home_team} vs ${prediction.away_team} = ${isCorrect ? 'CORRECT' : 'WRONG'}`);
          } else {
            console.log(`[auto-verify] ⚠ No match found for: ${prediction.home_team} vs ${prediction.away_team}`);
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
        console.error(`[auto-verify] Error processing ${league}:`, errorMsg);
        errors.push(`${league}: ${errorMsg}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`=== [auto-verify] Completed in ${duration}ms ===`);
    console.log(`[auto-verify] Summary: Verified=${totalVerified}, NotFound=${totalNotFound}, Skipped=${totalSkipped}`);

    return new Response(JSON.stringify({
      success: true,
      verified: totalVerified,
      notFound: totalNotFound,
      skipped: totalSkipped,
      verifiedDetails: verifiedDetails.slice(0, 10), // Return first 10 details
      errors: errors.length > 0 ? errors : undefined,
      duration,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[auto-verify] Fatal error:', error);
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
