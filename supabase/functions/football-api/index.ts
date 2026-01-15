import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4';

interface RequestBody {
  action: 'competitions' | 'matches' | 'standings' | 'teams' | 'head2head';
  competitionCode?: string;
  matchId?: number;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
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
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error: ${response.status} - ${errorText}`);
      throw new Error(`Football-Data.org API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
