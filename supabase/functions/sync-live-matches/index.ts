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

// In-memory cache to prevent rate limiting
let lastApiCallTime = 0;
let cachedResponse: { matches: unknown[]; timestamp: number } | null = null;
const MIN_API_INTERVAL = 60000; // 60 seconds minimum between API calls
const CACHE_TTL = 45000; // 45 seconds cache validity

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
    const now = Date.now();
    
    console.log('Starting live matches sync...');
    
    // Check if we can use cached data
    const timeSinceLastCall = now - lastApiCallTime;
    if (cachedResponse && timeSinceLastCall < CACHE_TTL) {
      console.log(`Using cached data (${Math.round(timeSinceLastCall / 1000)}s old)`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          synced: cachedResponse.matches.length,
          cached: true,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }
    
    // Rate limit protection
    if (timeSinceLastCall < MIN_API_INTERVAL) {
      const waitTime = Math.ceil((MIN_API_INTERVAL - timeSinceLastCall) / 1000);
      console.log(`Rate limit protection: must wait ${waitTime}s before next API call`);
      
      // Return success with cached data if available, otherwise just acknowledge
      if (cachedResponse) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            synced: cachedResponse.matches.length,
            cached: true,
            rateLimited: true,
            timestamp: new Date().toISOString()
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          synced: 0,
          rateLimited: true,
          waitSeconds: waitTime,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }
    
    // Fetch live matches from Football-Data.org
    const response = await fetch(
      'https://api.football-data.org/v4/matches?status=LIVE,IN_PLAY,PAUSED',
      {
        headers: {
          'X-Auth-Token': FOOTBALL_API_KEY,
        },
      }
    );

    // Update last call time AFTER the request
    lastApiCallTime = Date.now();

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', response.status, errorText);
      
      // On 429, return success with existing database cache
      if (response.status === 429) {
        console.log('429 received, checking database cache...');
        
        // Try to get existing data from database cache
        const { data: existingCache, error: cacheError } = await supabase
          .from('cached_live_matches')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(50);
        
        if (!cacheError && existingCache) {
          console.log(`Returning ${existingCache.length} matches from database cache`);
          return new Response(
            JSON.stringify({ 
              success: true, 
              synced: existingCache.length,
              cached: true,
              rateLimitHit: true,
              source: 'database',
              timestamp: new Date().toISOString()
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          );
        }
        
        // No database cache, return empty success
        console.log('No database cache available, returning empty success');
        return new Response(
          JSON.stringify({ 
            success: true, 
            synced: 0,
            cached: true,
            rateLimitHit: true,
            timestamp: new Date().toISOString()
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
      
      // For other errors, still try database cache before failing
      const { data: fallbackCache } = await supabase
        .from('cached_live_matches')
        .select('*')
        .limit(50);
      
      if (fallbackCache && fallbackCache.length > 0) {
        console.log(`API error ${response.status}, using database fallback with ${fallbackCache.length} matches`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            synced: fallbackCache.length,
            cached: true,
            apiError: response.status,
            timestamp: new Date().toISOString()
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
      
      throw new Error(`Football API error: ${response.status}`);
    }

    const data = await response.json();
    const allMatches = data.matches || [];
    
    // Filter only supported competitions
    const liveMatches = allMatches.filter((m: unknown) => {
      const match = m as { competition?: { code?: string } };
      return SUPPORTED_LEAGUES.includes(match.competition?.code || '');
    });
    
    // Cache the response
    cachedResponse = { matches: liveMatches, timestamp: now };
    
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
      const matchesToUpsert = liveMatches.map((match: unknown) => {
        const m = match as {
          id: number;
          competition?: { code?: string; name?: string };
          homeTeam?: { id?: number; name?: string; crest?: string };
          awayTeam?: { id?: number; name?: string; crest?: string };
          score?: {
            fullTime?: { home?: number; away?: number };
            halfTime?: { home?: number; away?: number };
          };
          status?: string;
          matchday?: number;
          utcDate?: string;
          minute?: string | number;
        };
        return {
          match_id: m.id,
          competition_code: m.competition?.code || 'UNKNOWN',
          competition_name: m.competition?.name || null,
          home_team_id: m.homeTeam?.id || null,
          home_team_name: m.homeTeam?.name || 'TBD',
          home_team_crest: m.homeTeam?.crest || null,
          away_team_id: m.awayTeam?.id || null,
          away_team_name: m.awayTeam?.name || 'TBD',
          away_team_crest: m.awayTeam?.crest || null,
          home_score: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? null,
          away_score: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? null,
          status: m.status,
          matchday: m.matchday || null,
          utc_date: m.utcDate,
          minute: m.minute?.toString() || null,
          half_time_home: m.score?.halfTime?.home ?? null,
          half_time_away: m.score?.halfTime?.away ?? null,
          raw_data: match,
          updated_at: new Date().toISOString(),
        };
      });

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
        cached: false,
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
