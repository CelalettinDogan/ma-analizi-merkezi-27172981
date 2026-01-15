import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TeamFeatures {
  name: string;
  position: number;
  points: number;
  formScore: number;
  form: string;
  goalsScored: number;
  goalsConceded: number;
  goalAverage: number;
  wins: number;
  draws: number;
  losses: number;
}

interface H2HData {
  homeWins: number;
  awayWins: number;
  draws: number;
  totalMatches: number;
}

interface RequestBody {
  homeTeam: TeamFeatures;
  awayTeam: TeamFeatures;
  h2h: H2HData;
  league: string;
  historicalAccuracy?: {
    matchResult: number;
    totalGoals: number;
    bothTeamsScore: number;
    correctScore: number;
    firstHalf: number;
  };
}

interface AIPrediction {
  matchResult: {
    prediction: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
    confidence: number;
    reasoning: string;
  };
  totalGoals: {
    prediction: 'OVER_2_5' | 'UNDER_2_5';
    confidence: number;
    reasoning: string;
  };
  bothTeamsScore: {
    prediction: 'YES' | 'NO';
    confidence: number;
    reasoning: string;
  };
  correctScore: {
    prediction: string;
    confidence: number;
    reasoning: string;
  };
  firstHalf: {
    prediction: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
    confidence: number;
    reasoning: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const body: RequestBody = await req.json();
    const { homeTeam, awayTeam, h2h, league, historicalAccuracy } = body;

    // Build system prompt with historical performance feedback
    let systemPrompt = `Sen profesyonel bir futbol analiz uzmanısın. Verilen takım istatistiklerini detaylı analiz ederek maç tahmini yapıyorsun.

Analiz kriterlerin:
1. Form Durumu: Son 5 maçın ağırlıklı ortalaması (son maçlar daha önemli)
2. Ev/Deplasman Performansı: Ev sahibi avantajı genelde %10-15 etki yapar
3. Gol Ortalamaları: Atılan ve yenilen gol oranları
4. H2H Geçmişi: Takımlar arası tarihsel üstünlük
5. Lig Pozisyonu: Puan farkı ve hedefler

Güven seviyeleri:
- 0.3-0.5: Düşük güven, veriler belirsiz
- 0.5-0.7: Orta güven, hafif eğilim var
- 0.7-0.9: Yüksek güven, net veriler

ÖNEMLİ: Doğru skor tahmini en zor tahmindir, düşük güven ver.`;

    // Add historical accuracy feedback if available
    if (historicalAccuracy) {
      systemPrompt += `

Geçmiş Performans (dikkate al):
- Maç Sonucu tahminleri: %${(historicalAccuracy.matchResult * 100).toFixed(0)} doğruluk
- Alt/Üst tahminleri: %${(historicalAccuracy.totalGoals * 100).toFixed(0)} doğruluk
- KG Var/Yok tahminleri: %${(historicalAccuracy.bothTeamsScore * 100).toFixed(0)} doğruluk
- İlk Yarı tahminleri: %${(historicalAccuracy.firstHalf * 100).toFixed(0)} doğruluk

Düşük doğruluk olan kategorilerde daha temkinli ol ve orta güven kullan.`;
    }

    const userPrompt = `Maç Analizi:

LİG: ${league}

EV SAHİBİ: ${homeTeam.name}
- Lig Sırası: ${homeTeam.position}. (${homeTeam.points} puan)
- Son Form: ${homeTeam.form} (Form Skoru: ${homeTeam.formScore}/100)
- Gol Ortalaması: ${homeTeam.goalAverage.toFixed(2)} (Attı: ${homeTeam.goalsScored}, Yedi: ${homeTeam.goalsConceded})
- Performans: ${homeTeam.wins}G ${homeTeam.draws}B ${homeTeam.losses}M

DEPLASMAN: ${awayTeam.name}
- Lig Sırası: ${awayTeam.position}. (${awayTeam.points} puan)
- Son Form: ${awayTeam.form} (Form Skoru: ${awayTeam.formScore}/100)
- Gol Ortalaması: ${awayTeam.goalAverage.toFixed(2)} (Attı: ${awayTeam.goalsScored}, Yedi: ${awayTeam.goalsConceded})
- Performans: ${awayTeam.wins}G ${awayTeam.draws}B ${awayTeam.losses}M

H2H GEÇMİŞİ: (Son ${h2h.totalMatches} maç)
- ${homeTeam.name} galibiyetleri: ${h2h.homeWins}
- ${awayTeam.name} galibiyetleri: ${h2h.awayWins}
- Beraberlikler: ${h2h.draws}

Bu verilere dayanarak kapsamlı maç tahmini yap.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_predictions',
              description: 'Futbol maçı için detaylı tahminler üret',
              parameters: {
                type: 'object',
                properties: {
                  matchResult: {
                    type: 'object',
                    properties: {
                      prediction: { type: 'string', enum: ['HOME_WIN', 'DRAW', 'AWAY_WIN'] },
                      confidence: { type: 'number', minimum: 0, maximum: 1 },
                      reasoning: { type: 'string' },
                    },
                    required: ['prediction', 'confidence', 'reasoning'],
                  },
                  totalGoals: {
                    type: 'object',
                    properties: {
                      prediction: { type: 'string', enum: ['OVER_2_5', 'UNDER_2_5'] },
                      confidence: { type: 'number', minimum: 0, maximum: 1 },
                      reasoning: { type: 'string' },
                    },
                    required: ['prediction', 'confidence', 'reasoning'],
                  },
                  bothTeamsScore: {
                    type: 'object',
                    properties: {
                      prediction: { type: 'string', enum: ['YES', 'NO'] },
                      confidence: { type: 'number', minimum: 0, maximum: 1 },
                      reasoning: { type: 'string' },
                    },
                    required: ['prediction', 'confidence', 'reasoning'],
                  },
                  correctScore: {
                    type: 'object',
                    properties: {
                      prediction: { type: 'string', description: 'Format: X-Y (örn: 2-1)' },
                      confidence: { type: 'number', minimum: 0, maximum: 1 },
                      reasoning: { type: 'string' },
                    },
                    required: ['prediction', 'confidence', 'reasoning'],
                  },
                  firstHalf: {
                    type: 'object',
                    properties: {
                      prediction: { type: 'string', enum: ['HOME_WIN', 'DRAW', 'AWAY_WIN'] },
                      confidence: { type: 'number', minimum: 0, maximum: 1 },
                      reasoning: { type: 'string' },
                    },
                    required: ['prediction', 'confidence', 'reasoning'],
                  },
                },
                required: ['matchResult', 'totalGoals', 'bothTeamsScore', 'correctScore', 'firstHalf'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'generate_predictions' } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    
    // Extract the tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'generate_predictions') {
      console.error('Unexpected AI response:', JSON.stringify(aiResponse));
      throw new Error('Invalid AI response structure');
    }

    const predictions: AIPrediction = JSON.parse(toolCall.function.arguments);

    console.log('AI Predictions generated:', JSON.stringify(predictions, null, 2));

    return new Response(JSON.stringify({ 
      success: true, 
      predictions,
      homeTeam: homeTeam.name,
      awayTeam: awayTeam.name,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ML Prediction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
