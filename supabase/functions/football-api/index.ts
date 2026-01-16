import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4';

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = {
  matches: 2 * 60 * 1000,     // 2 minutes for live matches
  standings: 60 * 60 * 1000,  // 1 hour for standings
  teams: 24 * 60 * 60 * 1000, // 24 hours for teams
  default: 5 * 60 * 1000,     // 5 minutes default
};

interface RequestBody {
  action: 'competitions' | 'matches' | 'standings' | 'teams' | 'head2head' | 'live';
  competitionCode?: string;
  matchId?: number;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}

function getCacheTTL(action: string, status?: string): number {
  if (action === 'matches' && status === 'LIVE') {
    return CACHE_TTL.matches;
  }
  return CACHE_TTL[action as keyof typeof CACHE_TTL] || CACHE_TTL.default;
}

function getCacheKey(body: RequestBody): string {
  return JSON.stringify(body);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('FOOTBALL_DATA_API_KEY');
    
    if (!apiKey) {
      throw new Error('FOOTBALL_DATA_API_KEY is not configured');
    }

    const body: RequestBody = await req.json();
    const { action, competitionCode, matchId, dateFrom, dateTo, status } = body;

    // Check cache first
    const cacheKey = getCacheKey(body);
    const cached = cache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < getCacheTTL(action, status)) {
      console.log(`Cache hit for: ${cacheKey}`);
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
      });
    }

    let url: string;
    
    switch (action) {
      case 'competitions':
        url = `${FOOTBALL_DATA_BASE_URL}/competitions`;
        break;
        
      case 'matches':
        if (competitionCode) {
          url = `${FOOTBALL_DATA_BASE_URL}/competitions/${competitionCode}/matches`;
          const params = new URLSearchParams();
          if (dateFrom) params.append('dateFrom', dateFrom);
          if (dateTo) params.append('dateTo', dateTo);
          if (status) params.append('status', status);
          if (params.toString()) url += `?${params.toString()}`;
        } else {
          url = `${FOOTBALL_DATA_BASE_URL}/matches`;
        }
        break;
        
      case 'standings':
        if (!competitionCode) {
          throw new Error('competitionCode is required for standings');
        }
        url = `${FOOTBALL_DATA_BASE_URL}/competitions/${competitionCode}/standings`;
        break;
        
      case 'teams':
        if (!competitionCode) {
          throw new Error('competitionCode is required for teams');
        }
        url = `${FOOTBALL_DATA_BASE_URL}/competitions/${competitionCode}/teams`;
        break;
        
      case 'head2head':
        if (!matchId) {
          throw new Error('matchId is required for head2head');
        }
        url = `${FOOTBALL_DATA_BASE_URL}/matches/${matchId}/head2head`;
        break;
      
      case 'live':
        // Fetch all live matches across all competitions
        url = `${FOOTBALL_DATA_BASE_URL}/matches?status=LIVE,IN_PLAY,PAUSED`;
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': apiKey,
      },
    });

    // Handle rate limiting with retry-after
    if (response.status === 429) {
      const retryAfter = response.headers.get('X-RequestCounter-Reset') || '60';
      console.warn(`Rate limited. Retry after: ${retryAfter}s`);
      
      // Return cached data if available, even if stale
      if (cached) {
        console.log('Returning stale cache due to rate limit');
        return new Response(JSON.stringify(cached.data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'STALE' },
        });
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded', 
          retryAfter: parseInt(retryAfter),
          message: 'API rate limit aşıldı. Lütfen biraz bekleyin.'
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': retryAfter },
        }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error: ${response.status} - ${errorText}`);
      throw new Error(`Football-Data.org API error: ${response.status}`);
    }

    const data = await response.json();

    // Store in cache
    cache.set(cacheKey, { data, timestamp: now });
    console.log(`Cached: ${cacheKey}`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
