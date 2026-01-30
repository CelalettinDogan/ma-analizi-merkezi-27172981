import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4';
const SUPPORTED_LEAGUES = ['PL', 'BL1', 'PD', 'SA', 'FL1', 'CL'];

// Rate limit: 7 seconds between requests (safe for 10 req/min)
const DELAY_BETWEEN_REQUESTS = 7000;

// Calculate form score from recent results (0-100)
function calculateFormScore(form: string | null): number {
  if (!form) return 50;
  const results = form.split(',').slice(-5);
  let score = 0;
  results.forEach((result, index) => {
    const weight = 1 + (index * 0.2);
    switch (result) {
      case 'W': score += 3 * weight; break;
      case 'D': score += 1 * weight; break;
      case 'L': score += 0; break;
    }
  });
  const maxScore = results.length * 3 * 1.8;
  return Math.round((score / maxScore) * 100);
}

// Determine match result classification
function classifyMatchResult(homeScore: number, awayScore: number): string {
  if (homeScore > awayScore) return 'HOME_WIN';
  if (awayScore > homeScore) return 'AWAY_WIN';
  return 'DRAW';
}

// Determine first half result
function classifyFirstHalfResult(htHome: number | null, htAway: number | null): string | null {
  if (htHome === null || htAway === null) return null;
  if (htHome > htAway) return 'HOME_WIN';
  if (htAway > htHome) return 'AWAY_WIN';
  return 'DRAW';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apiKey = Deno.env.get('FOOTBALL_DATA_API_KEY');

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'FOOTBALL_DATA_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate date range: 90 days ago to yesterday
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const dateFrom = ninetyDaysAgo.toISOString().split('T')[0];
    const dateTo = yesterday.toISOString().split('T')[0];

    console.log(`[sync-match-history] Starting sync for ${dateFrom} to ${dateTo}`);

    // Fetch current standings for all leagues (for pre-match stats)
    const standingsMap: Record<string, any[]> = {};
    
    for (let i = 0; i < SUPPORTED_LEAGUES.length; i++) {
      const league = SUPPORTED_LEAGUES[i];
      try {
        const url = `${FOOTBALL_DATA_BASE_URL}/competitions/${league}/standings`;
        console.log(`[sync-match-history] Fetching ${league} standings...`);
        
        const response = await fetch(url, {
          headers: { 'X-Auth-Token': apiKey },
        });

        if (response.ok) {
          const data = await response.json();
          const standings = data.standings?.[0]?.table || [];
          standingsMap[league] = standings;
          console.log(`[sync-match-history] ${league}: ${standings.length} teams in standings`);
        } else if (response.status === 429) {
          console.warn(`[sync-match-history] Rate limited on ${league} standings`);
        }

        if (i < SUPPORTED_LEAGUES.length - 1) {
          await new Promise(r => setTimeout(r, DELAY_BETWEEN_REQUESTS));
        }
      } catch (e) {
        console.error(`[sync-match-history] Error fetching ${league} standings:`, e);
      }
    }

    const allMatches: any[] = [];
    const errors: string[] = [];

    // Fetch finished matches for each league with rate limiting
    for (let i = 0; i < SUPPORTED_LEAGUES.length; i++) {
      const league = SUPPORTED_LEAGUES[i];
      
      try {
        // Only fetch FINISHED matches
        const url = `${FOOTBALL_DATA_BASE_URL}/competitions/${league}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}&status=FINISHED`;
        console.log(`[sync-match-history] Fetching ${league} history...`);
        
        const response = await fetch(url, {
          headers: { 'X-Auth-Token': apiKey },
        });

        if (response.status === 429) {
          const retryAfter = response.headers.get('X-RequestCounter-Reset') || '60';
          console.warn(`[sync-match-history] Rate limited on ${league}, retry after ${retryAfter}s`);
          errors.push(`${league}: Rate limited`);
          continue;
        }

        if (response.ok) {
          const data = await response.json();
          const matches = data.matches || [];
          console.log(`[sync-match-history] ${league}: ${matches.length} finished matches found`);
          allMatches.push(...matches.map((m: any) => ({ ...m, leagueCode: league })));
        } else {
          const errorText = await response.text();
          console.error(`[sync-match-history] ${league} error: ${response.status} - ${errorText}`);
          errors.push(`${league}: ${response.status}`);
        }

        // Wait before next request (except for last one)
        if (i < SUPPORTED_LEAGUES.length - 1) {
          console.log(`[sync-match-history] Waiting ${DELAY_BETWEEN_REQUESTS}ms...`);
          await new Promise(r => setTimeout(r, DELAY_BETWEEN_REQUESTS));
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        console.error(`[sync-match-history] Error fetching ${league}:`, e);
        errors.push(`${league}: ${errorMessage}`);
      }
    }

    console.log(`[sync-match-history] Total finished matches fetched: ${allMatches.length}`);

    // Upsert matches to both cached_matches and match_history
    let cachedUpsertCount = 0;
    let historyUpsertCount = 0;
    let upsertErrors = 0;

    for (const match of allMatches) {
      try {
        // 1. Upsert to cached_matches (existing behavior)
        const { error: cacheError } = await supabase.from('cached_matches').upsert({
          match_id: match.id,
          competition_code: match.competition?.code,
          competition_name: match.competition?.name,
          home_team_id: match.homeTeam?.id,
          home_team_name: match.homeTeam?.name || 'Unknown',
          home_team_crest: match.homeTeam?.crest,
          away_team_id: match.awayTeam?.id,
          away_team_name: match.awayTeam?.name || 'Unknown',
          away_team_crest: match.awayTeam?.crest,
          utc_date: match.utcDate,
          status: match.status,
          matchday: match.matchday,
          home_score: match.score?.fullTime?.home,
          away_score: match.score?.fullTime?.away,
          winner: match.score?.winner,
          raw_data: match,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'match_id' });

        if (cacheError) {
          console.error(`[sync-match-history] Cache upsert error for match ${match.id}:`, cacheError);
          upsertErrors++;
          continue;
        }
        cachedUpsertCount++;

        // 2. Upsert to match_history with calculated features
        const homeScore = match.score?.fullTime?.home ?? 0;
        const awayScore = match.score?.fullTime?.away ?? 0;
        const htHome = match.score?.halfTime?.home ?? null;
        const htAway = match.score?.halfTime?.away ?? null;
        const leagueCode = match.leagueCode || match.competition?.code;
        
        // Get standings for this league
        const standings = standingsMap[leagueCode] || [];
        
        // Find team standings
        const homeTeamStanding = standings.find((s: any) => 
          s.team?.id === match.homeTeam?.id || 
          s.team?.name?.toLowerCase().includes(match.homeTeam?.name?.toLowerCase()) ||
          match.homeTeam?.name?.toLowerCase().includes(s.team?.name?.toLowerCase())
        );
        const awayTeamStanding = standings.find((s: any) => 
          s.team?.id === match.awayTeam?.id ||
          s.team?.name?.toLowerCase().includes(match.awayTeam?.name?.toLowerCase()) ||
          match.awayTeam?.name?.toLowerCase().includes(s.team?.name?.toLowerCase())
        );

        // Calculate features
        const homeFormScore = calculateFormScore(homeTeamStanding?.form);
        const awayFormScore = calculateFormScore(awayTeamStanding?.form);
        const homeGames = homeTeamStanding?.playedGames || 1;
        const awayGames = awayTeamStanding?.playedGames || 1;

        const historyRecord = {
          league: leagueCode,
          home_team: match.homeTeam?.name || 'Unknown',
          away_team: match.awayTeam?.name || 'Unknown',
          match_date: match.utcDate?.split('T')[0],
          home_score: homeScore,
          away_score: awayScore,
          // Pre-match statistics
          home_form: homeTeamStanding?.form || null,
          away_form: awayTeamStanding?.form || null,
          home_position: homeTeamStanding?.position || null,
          away_position: awayTeamStanding?.position || null,
          home_points: homeTeamStanding?.points || null,
          away_points: awayTeamStanding?.points || null,
          home_goals_scored: homeTeamStanding?.goalsFor || null,
          home_goals_conceded: homeTeamStanding?.goalsAgainst || null,
          away_goals_scored: awayTeamStanding?.goalsFor || null,
          away_goals_conceded: awayTeamStanding?.goalsAgainst || null,
          home_wins: homeTeamStanding?.won || null,
          home_draws: homeTeamStanding?.draw || null,
          home_losses: homeTeamStanding?.lost || null,
          away_wins: awayTeamStanding?.won || null,
          away_draws: awayTeamStanding?.draw || null,
          away_losses: awayTeamStanding?.lost || null,
          // Calculated ML features
          home_form_score: homeFormScore,
          away_form_score: awayFormScore,
          home_goal_avg: homeTeamStanding ? Math.round((homeTeamStanding.goalsFor / homeGames) * 100) / 100 : null,
          away_goal_avg: awayTeamStanding ? Math.round((awayTeamStanding.goalsFor / awayGames) * 100) / 100 : null,
          position_diff: (homeTeamStanding?.position && awayTeamStanding?.position) 
            ? homeTeamStanding.position - awayTeamStanding.position 
            : null,
          // Match outcome classifications
          match_result: classifyMatchResult(homeScore, awayScore),
          total_goals: homeScore + awayScore,
          both_teams_scored: homeScore > 0 && awayScore > 0,
          first_half_result: classifyFirstHalfResult(htHome, htAway),
          first_half_home_score: htHome,
          first_half_away_score: htAway,
        };

        // Check if match already exists in history
        const { data: existingHistory } = await supabase
          .from('match_history')
          .select('id')
          .eq('home_team', historyRecord.home_team)
          .eq('away_team', historyRecord.away_team)
          .eq('match_date', historyRecord.match_date)
          .maybeSingle();

        if (existingHistory?.id) {
          // Update existing record
          const { error: historyError } = await supabase
            .from('match_history')
            .update(historyRecord)
            .eq('id', existingHistory.id);

          if (historyError) {
            console.error(`[sync-match-history] History update error for match ${match.id}:`, historyError);
          } else {
            historyUpsertCount++;
          }
        } else {
          // Insert new record
          const { error: historyError } = await supabase
            .from('match_history')
            .insert(historyRecord);

          if (historyError) {
            console.error(`[sync-match-history] History insert error for match ${match.id}:`, historyError);
          } else {
            historyUpsertCount++;
          }
        }

      } catch (e) {
        console.error(`[sync-match-history] Exception processing match ${match.id}:`, e);
        upsertErrors++;
      }
    }

    const result = {
      success: true,
      cached_matches_synced: cachedUpsertCount,
      match_history_synced: historyUpsertCount,
      total_fetched: allMatches.length,
      upsert_errors: upsertErrors,
      fetch_errors: errors,
      timestamp: new Date().toISOString(),
      date_range: { from: dateFrom, to: dateTo },
    };

    console.log(`[sync-match-history] Sync complete:`, result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[sync-match-history] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
