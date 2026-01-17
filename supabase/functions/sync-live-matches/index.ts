import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FOOTBALL_API_KEY = Deno.env.get('FOOTBALL_DATA_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Supported competitions
const SUPPORTED_LEAGUES = ['PL', 'BL1', 'PD', 'SA', 'FL1', 'CL'];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!FOOTBALL_API_KEY) {
      throw new Error('FOOTBALL_DATA_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('Starting live matches sync...');
    
    // Fetch live matches from Football-Data.org
    const response = await fetch(
      'https://api.football-data.org/v4/matches?status=LIVE,IN_PLAY,PAUSED',
      {
        headers: {
          'X-Auth-Token': FOOTBALL_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', response.status, errorText);
      throw new Error(`Football API error: ${response.status}`);
    }

    const data = await response.json();
    const allMatches = data.matches || [];
    
    // Filter only supported competitions
    const liveMatches = allMatches.filter((m: any) => 
      SUPPORTED_LEAGUES.includes(m.competition?.code)
    );
    
    console.log(`Found ${liveMatches.length} live matches in supported leagues`);

    // First, delete old live matches that are no longer live
    // Keep matches from last 3 hours to allow for recently finished matches
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    
    const { error: deleteError } = await supabase
      .from('cached_live_matches')
      .delete()
      .lt('updated_at', threeHoursAgo);

    if (deleteError) {
      console.error('Error cleaning old matches:', deleteError);
    }

    // Upsert current live matches
    if (liveMatches.length > 0) {
      const matchesToUpsert = liveMatches.map((match: any) => ({
        match_id: match.id,
        competition_code: match.competition?.code || 'UNKNOWN',
        competition_name: match.competition?.name || null,
        home_team_id: match.homeTeam?.id || null,
        home_team_name: match.homeTeam?.name || 'TBD',
        home_team_crest: match.homeTeam?.crest || null,
        away_team_id: match.awayTeam?.id || null,
        away_team_name: match.awayTeam?.name || 'TBD',
        away_team_crest: match.awayTeam?.crest || null,
        home_score: match.score?.fullTime?.home ?? match.score?.halfTime?.home ?? null,
        away_score: match.score?.fullTime?.away ?? match.score?.halfTime?.away ?? null,
        status: match.status,
        matchday: match.matchday || null,
        utc_date: match.utcDate,
        minute: match.minute?.toString() || null,
        half_time_home: match.score?.halfTime?.home ?? null,
        half_time_away: match.score?.halfTime?.away ?? null,
        raw_data: match,
        updated_at: new Date().toISOString(),
      }));

      const { error: upsertError } = await supabase
        .from('cached_live_matches')
        .upsert(matchesToUpsert, { 
          onConflict: 'match_id',
          ignoreDuplicates: false 
        });

      if (upsertError) {
        console.error('Error upserting live matches:', upsertError);
        throw upsertError;
      }

      console.log(`Successfully synced ${matchesToUpsert.length} live matches`);
    } else {
      // No live matches - clear old data
      const { error: clearError } = await supabase
        .from('cached_live_matches')
        .delete()
        .neq('match_id', 0); // Delete all

      if (clearError) {
        console.error('Error clearing live matches:', clearError);
      }
      console.log('No live matches currently, cleared cache');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: liveMatches.length,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

