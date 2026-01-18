import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4';
const SUPPORTED_LEAGUES = ['PL', 'BL1', 'PD', 'SA', 'FL1', 'CL'];

// Rate limit: wait between requests to respect API limits
const DELAY_BETWEEN_REQUESTS = 7000; // 7 seconds (safe for 10 req/min)

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

    // === STEP 1: Clean up old finished matches BEFORE syncing ===
    const now = new Date();
    const todayStart = now.toISOString().split('T')[0];
    
    console.log(`[sync-matches] Cleaning up old FINISHED matches...`);
    const { error: cleanupError, count: cleanupCount } = await supabase
      .from('cached_matches')
      .delete()
      .eq('status', 'FINISHED')
      .lt('utc_date', todayStart);
    
    if (cleanupError) {
      console.warn('[sync-matches] Cleanup warning:', cleanupError);
    } else {
      console.log(`[sync-matches] Cleaned up ${cleanupCount || 0} old finished matches`);
    }

    // === STEP 2: Get date range (today + 3 days) ===
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    
    const dateFrom = today.toISOString().split('T')[0];
    const dateTo = threeDaysLater.toISOString().split('T')[0];

    console.log(`[sync-matches] Starting sync for ${dateFrom} to ${dateTo}`);

    const allMatches: any[] = [];
    const errors: string[] = [];

    // === STEP 3: Fetch matches for each league with rate limiting ===
    for (let i = 0; i < SUPPORTED_LEAGUES.length; i++) {
      const league = SUPPORTED_LEAGUES[i];
      
      try {
        const url = `${FOOTBALL_DATA_BASE_URL}/competitions/${league}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
        console.log(`[sync-matches] Fetching ${league}...`);
        
        const response = await fetch(url, {
          headers: { 'X-Auth-Token': apiKey },
        });

        if (response.status === 429) {
          const retryAfter = response.headers.get('X-RequestCounter-Reset') || '60';
          console.warn(`[sync-matches] Rate limited on ${league}, retry after ${retryAfter}s`);
          errors.push(`${league}: Rate limited`);
          continue;
        }

        if (response.ok) {
          const data = await response.json();
          const matches = data.matches || [];
          console.log(`[sync-matches] ${league}: ${matches.length} matches found`);
          allMatches.push(...matches);
        } else {
          const errorText = await response.text();
          console.error(`[sync-matches] ${league} error: ${response.status} - ${errorText}`);
          errors.push(`${league}: ${response.status}`);
        }

        // Wait before next request (except for last one)
        if (i < SUPPORTED_LEAGUES.length - 1) {
          console.log(`[sync-matches] Waiting ${DELAY_BETWEEN_REQUESTS}ms before next request...`);
          await new Promise(r => setTimeout(r, DELAY_BETWEEN_REQUESTS));
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        console.error(`[sync-matches] Error fetching ${league}:`, e);
        errors.push(`${league}: ${errorMessage}`);
      }
    }

    console.log(`[sync-matches] Total matches fetched: ${allMatches.length}`);

    // === STEP 4: Upsert matches to database ===
    let upsertedCount = 0;
    let upsertErrors = 0;

    for (const match of allMatches) {
      try {
        const { error } = await supabase.from('cached_matches').upsert({
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

        if (error) {
          console.error(`[sync-matches] Upsert error for match ${match.id}:`, error);
          upsertErrors++;
        } else {
          upsertedCount++;
        }
      } catch (e) {
        console.error(`[sync-matches] Exception upserting match ${match.id}:`, e);
        upsertErrors++;
      }
    }

    const result = {
      success: true,
      synced: upsertedCount,
      total_fetched: allMatches.length,
      upsert_errors: upsertErrors,
      fetch_errors: errors,
      cleaned_up: cleanupCount || 0,
      timestamp: new Date().toISOString(),
      date_range: { from: dateFrom, to: dateTo },
    };

    console.log(`[sync-matches] Sync complete:`, result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[sync-matches] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});