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
  momentum?: number;
  trend?: string;
  attackStrength?: number;
  defenseStrength?: number;
}

interface H2HData {
  homeWins: number;
  awayWins: number;
  draws: number;
  totalMatches: number;
}

interface MatchContext {
  isDerby?: boolean;
  derbyName?: string;
  matchImportance?: string;
  seasonPhase?: string;
  matchBadges?: string[];
}

interface PoissonData {
  homeExpected?: number;
  awayExpected?: number;
  homeWinProb?: number;
  drawProb?: number;
  awayWinProb?: number;
  over2_5Prob?: number;
  bttsProb?: number;
}

interface RequestBody {
  homeTeam: TeamFeatures;
  awayTeam: TeamFeatures;
  h2h: H2HData;
  league: string;
  context?: MatchContext;
  poisson?: PoissonData;
  historicalAccuracy?: {
    matchResult: number;
    totalGoals: number;
    bothTeamsScore: number;
    correctScore: number;
    firstHalf: number;
  };
  leagueOver25Pct?: number;
}

interface AIPrediction {
  matchResult: { prediction: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN'; confidence: number; reasoning: string; };
  totalGoals: { prediction: 'OVER_2_5' | 'UNDER_2_5'; confidence: number; reasoning: string; };
  bothTeamsScore: { prediction: 'YES' | 'NO'; confidence: number; reasoning: string; };
  correctScore: { prediction: string; confidence: number; reasoning: string; };
  firstHalf: { prediction: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN'; confidence: number; reasoning: string; };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const body: RequestBody = await req.json();
    const { homeTeam, awayTeam, h2h, league, context, poisson, historicalAccuracy, leagueOver25Pct } = body;

    // Enhanced system prompt
    let systemPrompt = `Sen profesyonel bir futbol analiz uzmanısın. Kapsamlı veri analizi yaparak maç tahmini üretiyorsun.

DETAYLI ANALİZ KRİTERLERİ:

1. FORM ANALİZİ
   - Genel form skoru ve trend (yükseliş/düşüş/stabil)
   - Momentum: Son maçlardaki performans eğilimi
   - Galibiyet/Mağlubiyet serileri

2. GÜÇ ENDEKSLERİ
   - Hücum Güç Endeksi: >1 = lig ortalamasının üzerinde
   - Savunma Güç Endeksi: <1 = lig ortalamasından az gol yiyor
   - Genel güç = Hücum / Savunma

3. POİSSON MODELİ (varsa)
   - Beklenen gol dağılımı matematiksel hesaplama
   - Maç sonucu olasılıkları
   - Alt/Üst ve KG olasılıkları

4. BAĞLAMSAL FAKTÖRLER
   - Derbi maçlarında formun etkisi azalır, belirsizlik artar
   - Kritik maçlarda (şampiyonluk, düşme hattı) temkinli ol
   - Sezon fazı: Final haftaları daha öngörülmez

5. H2H TARİHÇESİ
   - Psikolojik üstünlük
   - Son karşılaşma trendi

GÜVEN SEVİYESİ HESAPLAMA:
- Tüm faktörler aynı yönde + net istatistik: 0.75-0.90
- Çoğu faktör aynı yönde: 0.60-0.75
- Karışık sinyaller: 0.45-0.60
- Derbi/kritik maç: Güveni %10-15 düşür
- Belirsiz durum: 0.35-0.50

DOĞRU SKOR: En zor tahmin, daima düşük güven (0.25-0.40)`;

    if (historicalAccuracy) {
      systemPrompt += `

GEÇMİŞ PERFORMANS:
- Maç Sonucu: %${(historicalAccuracy.matchResult * 100).toFixed(0)}
- Alt/Üst: %${(historicalAccuracy.totalGoals * 100).toFixed(0)}
- KG: %${(historicalAccuracy.bothTeamsScore * 100).toFixed(0)}
Düşük doğruluk kategorilerinde daha temkinli ol.`;

      // Özel Alt/Üst uyarısı
      if (historicalAccuracy.totalGoals < 0.55) {
        systemPrompt += `

⚠️ KRİTİK UYARI - TOPLAM GOL ALT/ÜST:
Bu kategoride geçmiş başarı oranın sadece %${(historicalAccuracy.totalGoals * 100).toFixed(0)}.
- Poisson over2.5 olasılığı %45-55 arasındaysa bu SINIR BÖLGEDİR. Güven seviyesini 0.40-0.50 arasında tut.
- Beklenen gol 2.0-2.5 arasındayken "Alt" tahmin etme eğiliminden kaçın - bu aralıkta maçlar genellikle 3+ golle bitiyor.
- Poisson modelinin hesapladığı kesin olasılığa güven, sezgisel yargıya değil.`;
      }
    }

    // Enhanced user prompt
    let userPrompt = `MAÇA ANALİZİ - ${league}

EV SAHİBİ: ${homeTeam.name}
- Sıra: ${homeTeam.position}. (${homeTeam.points} puan)
- Form: ${homeTeam.form} (Skor: ${homeTeam.formScore}/100)
- Gol Ort: ${homeTeam.goalAverage.toFixed(2)} (${homeTeam.goalsScored} attı, ${homeTeam.goalsConceded} yedi)
- Performans: ${homeTeam.wins}G ${homeTeam.draws}B ${homeTeam.losses}M`;

    if (homeTeam.momentum !== undefined) {
      userPrompt += `\n- Momentum: ${homeTeam.momentum} (${homeTeam.trend})`;
    }
    if (homeTeam.attackStrength !== undefined) {
      userPrompt += `\n- Hücum Gücü: ${homeTeam.attackStrength.toFixed(2)}x | Savunma: ${homeTeam.defenseStrength?.toFixed(2)}x`;
    }

    userPrompt += `

DEPLASMAN: ${awayTeam.name}
- Sıra: ${awayTeam.position}. (${awayTeam.points} puan)
- Form: ${awayTeam.form} (Skor: ${awayTeam.formScore}/100)
- Gol Ort: ${awayTeam.goalAverage.toFixed(2)} (${awayTeam.goalsScored} attı, ${awayTeam.goalsConceded} yedi)
- Performans: ${awayTeam.wins}G ${awayTeam.draws}B ${awayTeam.losses}M`;

    if (awayTeam.momentum !== undefined) {
      userPrompt += `\n- Momentum: ${awayTeam.momentum} (${awayTeam.trend})`;
    }
    if (awayTeam.attackStrength !== undefined) {
      userPrompt += `\n- Hücum Gücü: ${awayTeam.attackStrength.toFixed(2)}x | Savunma: ${awayTeam.defenseStrength?.toFixed(2)}x`;
    }

    userPrompt += `

H2H (Son ${h2h.totalMatches} maç): ${homeTeam.name} ${h2h.homeWins}G - ${h2h.draws}B - ${h2h.awayWins}G ${awayTeam.name}`;

    if (context?.isDerby) {
      userPrompt += `\n\n⚔️ DERBİ MAÇI: ${context.derbyName || 'Yerel Derbi'}`;
    }
    if (context?.matchImportance && context.matchImportance !== 'normal') {
      userPrompt += `\n🏆 MAÇ ÖNEMİ: ${context.matchImportance.toUpperCase()}`;
    }
    if (context?.matchBadges && context.matchBadges.length > 0) {
      userPrompt += `\n📌 Özel Durumlar: ${context.matchBadges.join(', ')}`;
    }

    if (poisson) {
      userPrompt += `

📊 POİSSON MATEMATİKSEL MODEL:
- Beklenen Gol: ${homeTeam.name} ${poisson.homeExpected?.toFixed(2)} - ${poisson.awayExpected?.toFixed(2)} ${awayTeam.name}
- Olasılıklar: Ev %${poisson.homeWinProb?.toFixed(0)} | Beraberlik %${poisson.drawProb?.toFixed(0)} | Dep %${poisson.awayWinProb?.toFixed(0)}
- 2.5 Üst: %${poisson.over2_5Prob?.toFixed(0)} | KG Var: %${poisson.bttsProb?.toFixed(0)}`;

      if (leagueOver25Pct) {
        userPrompt += `\n- Lig Ortalaması 2.5 Üst: %${leagueOver25Pct.toFixed(0)}`;
      }

      const over25 = poisson.over2_5Prob || 0;
      if (over25 >= 45 && over25 <= 55) {
        userPrompt += `\n\n⚠️ SINIR BÖLGESİ: Poisson over2.5 olasılığı %${over25.toFixed(0)} - bu belirsiz bölge! Güven seviyesini düşük tut (0.40-0.50).`;
      }
    }

    userPrompt += `\n\nTüm verileri analiz ederek kapsamlı tahmin yap.`;

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
        tools: [{
          type: 'function',
          function: {
            name: 'generate_predictions',
            description: 'Futbol maçı için detaylı tahminler üret',
            parameters: {
              type: 'object',
              properties: {
                matchResult: { type: 'object', properties: { prediction: { type: 'string', enum: ['HOME_WIN', 'DRAW', 'AWAY_WIN'] }, confidence: { type: 'number' }, reasoning: { type: 'string' } }, required: ['prediction', 'confidence', 'reasoning'] },
                totalGoals: { type: 'object', properties: { prediction: { type: 'string', enum: ['OVER_2_5', 'UNDER_2_5'] }, confidence: { type: 'number' }, reasoning: { type: 'string' } }, required: ['prediction', 'confidence', 'reasoning'] },
                bothTeamsScore: { type: 'object', properties: { prediction: { type: 'string', enum: ['YES', 'NO'] }, confidence: { type: 'number' }, reasoning: { type: 'string' } }, required: ['prediction', 'confidence', 'reasoning'] },
                correctScore: { type: 'object', properties: { prediction: { type: 'string' }, confidence: { type: 'number' }, reasoning: { type: 'string' } }, required: ['prediction', 'confidence', 'reasoning'] },
                firstHalf: { type: 'object', properties: { prediction: { type: 'string', enum: ['HOME_WIN', 'DRAW', 'AWAY_WIN'] }, confidence: { type: 'number' }, reasoning: { type: 'string' } }, required: ['prediction', 'confidence', 'reasoning'] },
              },
              required: ['matchResult', 'totalGoals', 'bothTeamsScore', 'correctScore', 'firstHalf'],
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'generate_predictions' } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('Invalid AI response');

    const predictions: AIPrediction = JSON.parse(toolCall.function.arguments);
    console.log('AI Predictions:', JSON.stringify(predictions, null, 2));

    return new Response(JSON.stringify({ success: true, predictions, homeTeam: homeTeam.name, awayTeam: awayTeam.name }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ML Prediction error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
