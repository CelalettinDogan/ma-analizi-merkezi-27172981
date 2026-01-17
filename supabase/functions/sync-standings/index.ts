import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4';
const SUPPORTED_LEAGUES = ['PL', 'BL1', 'PD', 'SA', 'FL1'];

// Rate limit: wait between requests (CL excluded - no traditional standings)
const DELAY_BETWEEN_REQUESTS = 7000; // 7 seconds

serve(async (req) => {
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

    console.log('[sync-standings] Starting standings sync...');

    let totalUpserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < SUPPORTED_LEAGUES.length; i++) {
      const league = SUPPORTED_LEAGUES[i];

      try {
        const url = `${FOOTBALL_DATA_BASE_URL}/competitions/${league}/standings`;
        console.log(`[sync-standings] Fetching ${league}...`);

        const response = await fetch(url, {
          headers: { 'X-Auth-Token': apiKey },
        });

        if (response.status === 429) {
          console.warn(`[sync-standings] Rate limited on ${league}`);
          errors.push(`${league}: Rate limited`);
          continue;
        }

        if (response.ok) {
          const data = await response.json();
          const standings = data.standings?.[0]?.table || [];
          const competitionName = data.competition?.name || league;

          console.log(`[sync-standings] ${league}: ${standings.length} teams`);

          for (const entry of standings) {
            const { error } = await supabase.from('cached_standings').upsert({
              competition_code: league,
              competition_name: competitionName,
              position: entry.position,
              team_id: entry.team?.id,
              team_name: entry.team?.name || 'Unknown',
              team_short_name: entry.team?.shortName,
              team_tla: entry.team?.tla,
              team_crest: entry.team?.crest,
              played_games: entry.playedGames,
              form: entry.form,
              won: entry.won,
              draw: entry.draw,
              lost: entry.lost,
              points: entry.points,
              goals_for: entry.goalsFor,
              goals_against: entry.goalsAgainst,
              goal_difference: entry.goalDifference,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'competition_code,team_id' });

            if (!error) totalUpserted++;
          }
        } else {
          const errorText = await response.text();
          console.error(`[sync-standings] ${league} error: ${response.status}`);
          errors.push(`${league}: ${response.status}`);
        }

        if (i < SUPPORTED_LEAGUES.length - 1) {
          console.log(`[sync-standings] Waiting ${DELAY_BETWEEN_REQUESTS}ms...`);
          await new Promise(r => setTimeout(r, DELAY_BETWEEN_REQUESTS));
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        console.error(`[sync-standings] Error fetching ${league}:`, e);
        errors.push(`${league}: ${errorMessage}`);
      }
    }

    const result = {
      success: true,
      synced: totalUpserted,
      fetch_errors: errors,
      timestamp: new Date().toISOString(),
    };

    console.log('[sync-standings] Sync complete:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[sync-standings] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
