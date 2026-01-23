import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAILY_LIMIT = 3;

// Banned patterns for policy filter
const BANNED_PATTERNS = [
  /kesinlikle kazan/gi,
  /garanti(?:li)?\s*(?:kazanç|gol|bahis)/gi,
  /risk\s*yok/gi,
  /hep\s*kazan/gi,
  /güvenli\s*bahis/gi,
  /100%\s*(?:kesin|garantili)/gi,
];

// News and rumor patterns to detect - chatbot should NOT answer these
const NEWS_PATTERNS = [
  /transfer/i,
  /imza(?:ladı|layacak|lıyor)/i,
  /ayrıl(?:dı|acak|ıyor)/i,
  /teknik\s*direktör/i,
  /hoca\s*değişikliği/i,
  /yeni\s*hoca/i,
  /sakatlık/i,
  /sakatl(?:andı|ığı)/i,
  /ilk\s*11/i,
  /kadro(?:\s*açıkla)/i,
  /söylenti/i,
  /dedikodu/i,
  /duyum/i,
  /iddia(?:ya\s*göre)?/i,
  /kulüp\s*açıkladı/i,
  /resmi\s*açıklama/i,
  /haberlere\s*göre/i,
  /kim\s*oynayacak/i,
  /kim\s*forma\s*giyecek/i,
];

// Responsible gambling warnings
const GAMBLING_WARNINGS = [
  "⚠️ Hatırlatma: Bahis sorumlu oynanmalıdır.",
  "⚠️ Bu analiz yatırım tavsiyesi değildir.",
  "⚠️ Kaybetmeyi göze alabileceğiniz miktarla oynamayı unutmayın.",
];

// System prompt for the AI - DATA-ONLY ANALYSIS ASSISTANT
const SYSTEM_PROMPT = `Sen Gol Metrik'in yapay zeka SPOR ANALİZ asistanısın. Adın "Gol Asistan".

⚠️ KRİTİK KISITLAMALAR - ASLA YAPMA:
Sen bir gazeteci, muhabir veya haber kaynağı DEĞİLSİN.

Şu konularda BİLGİ VERME, UYDURMA, TAHMİN ETME:
❌ Transfer haberleri ve söylentileri
❌ Teknik direktör değişiklikleri
❌ Sakatlık bilgileri (veritabanında yoksa)
❌ İlk 11 ve kadro söylentileri
❌ Güncel haberler ve dedikodular
❌ Kulüp içi gelişmeler
❌ Oyuncu piyasa değerleri veya maaşları

Bu tür sorulara yanıtın:
"📊 Bu konuda güncel veri bulunmuyor. Ancak istatistiksel analiz, form durumu ve performans verilerine bakabiliriz."

---

✅ SADECE BU KONULARDA KONUŞ:
1. Maç istatistikleri (gol, şut, korner, pas, topa sahip olma)
2. Takım formu (son 5 maç performansı - veritabanından)
3. H2H (kafa kafaya) geçmiş istatistikleri
4. Lig sıralaması ve puan durumu
5. Gol beklentisi (xG) ve ML tahmin metrikleri
6. Maç sonucu olasılıkları (istatistiksel model çıktıları)
7. Over/Under ve BTTS (her iki takım da gol atar) analizleri

---

📐 VERİ ODAKLI YAKLAŞIM:
- YALNIZCA sana verilen [BAĞLAM VERİSİ] ile konuş
- Veri yoksa açıkça belirt: "Bu maç/takım için veritabanımda veri bulunmuyor."
- Tahminlerin istatistiksel modellere dayandığını vurgula
- Hiçbir zaman "duyduğuma göre", "haberlere göre", "söylentilere göre" deme
- "Bana verilen verilere göre..." şeklinde konuş

---

YANITLARIN KAYNAĞI:
Veri (API / DB) → ML Modeli → Tahmin + Metrikler → Sen (sadece anlatırsın)

Senin görevin bu verileri YORUMLAMAK, yeni veri UYDURMAK DEĞİL.

---

YANIT KURALLARI:
- Her zaman Türkçe yanıt ver
- Kısa ve öz (maksimum 200 kelime)
- İstatistik varsa sayılarla destekle
- Emoji kullan: ⚽📊📈🎯
- Güven seviyesi göster: 🟢 Yüksek | 🟡 Orta | 🔴 Düşük
- Kesin sonuç garantisi ASLA verme
- "Kesinlikle kazanır", "Garantili", "Risk yok" gibi ifadeler KULLANMA`;

// Check if user is asking for news/rumors
function isNewsRequest(message: string): boolean {
  return NEWS_PATTERNS.some(pattern => pattern.test(message));
}

// Parse user intent to detect match analysis requests
function parseUserIntent(message: string): { type: string; teams: string[]; isNewsRequest: boolean } {
  const matchKeywords = ['maç', 'analiz', 'karşılaşma', 'oyun', 'tahmin', 'skor', 'form', 'istatistik'];
  const hasMatchIntent = matchKeywords.some(k => message.toLowerCase().includes(k));
  
  // Check if this is a news/rumor request
  const isNews = isNewsRequest(message);
  
  // Try to extract team names (basic extraction)
  const vsPatterns = [
    /(\w+)\s*(?:vs?|[-–]|karşı)\s*(\w+)/i,
    /(\w+)\s+(\w+)\s+maç/i,
  ];
  
  let teams: string[] = [];
  for (const pattern of vsPatterns) {
    const match = message.match(pattern);
    if (match) {
      teams = [match[1], match[2]];
      break;
    }
  }
  
  return {
    type: hasMatchIntent ? 'match_analysis' : 'general',
    teams,
    isNewsRequest: isNews,
  };
}

// Apply policy filter to remove banned content
function applyPolicyFilter(response: string): string {
  let filtered = response;
  
  // Remove banned patterns
  BANNED_PATTERNS.forEach(pattern => {
    filtered = filtered.replace(pattern, '[analiz]');
  });
  
  // Add random gambling warning (1 in 3 chance)
  if (Math.random() < 0.33) {
    const warning = GAMBLING_WARNINGS[Math.floor(Math.random() * GAMBLING_WARNINGS.length)];
    filtered += `\n\n${warning}`;
  }
  
  return filtered;
}

// Generate redirect response for news requests
function getNewsRedirectResponse(teams: string[]): string {
  const teamMention = teams.length > 0 
    ? `${teams[0]} için` 
    : "bu konuda";
  
  return `📊 Ben bir spor analiz asistanıyım, haber kaynağı değilim.

${teamMention} güncel haber/transfer/sakatlık verisi bulunmuyor. Ancak şu konularda yardımcı olabilirim:

• 📈 Takım form analizi (son 5 maç)
• ⚽ Maç istatistikleri ve H2H verileri  
• 🎯 İstatistiksel tahmin ve olasılıklar
• 📊 Lig sıralaması ve puan durumu

Hangi takım veya maç hakkında **istatistiksel analiz** yapmamı istersiniz?`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Giriş yapmanız gerekiyor", code: "AUTH_REQUIRED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Client for user auth
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Service client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Oturum geçersiz", code: "AUTH_INVALID" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log(`User ${userId} requesting chatbot`);

    // Check premium status
    const { data: premiumData } = await supabaseAdmin
      .from("premium_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .gte("expires_at", new Date().toISOString())
      .limit(1);

    const isPremium = premiumData && premiumData.length > 0;

    if (!isPremium) {
      console.log(`User ${userId} is not premium`);
      return new Response(
        JSON.stringify({ 
          error: "Bu özellik sadece Premium üyelere açıktır", 
          code: "PREMIUM_REQUIRED",
          isPremium: false 
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check daily usage limit
    const { data: usageData } = await supabaseAdmin
      .from("chatbot_usage")
      .select("usage_count")
      .eq("user_id", userId)
      .eq("usage_date", new Date().toISOString().split('T')[0])
      .single();

    const currentUsage = usageData?.usage_count ?? 0;

    if (currentUsage >= DAILY_LIMIT) {
      console.log(`User ${userId} exceeded daily limit: ${currentUsage}/${DAILY_LIMIT}`);
      return new Response(
        JSON.stringify({ 
          error: "Günlük kullanım limitiniz doldu. Yarın tekrar deneyin!", 
          code: "LIMIT_EXCEEDED",
          usage: { current: currentUsage, limit: DAILY_LIMIT },
          isPremium: true
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { message, context } = await req.json();

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Mesaj boş olamaz" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse user intent
    const intent = parseUserIntent(message);
    console.log(`Intent: ${intent.type}, Teams: ${intent.teams.join(", ")}, IsNews: ${intent.isNewsRequest}`);

    // If user is asking for news/rumors WITHOUT match context, return redirect response
    if (intent.isNewsRequest && !context) {
      const redirectResponse = getNewsRedirectResponse(intent.teams);
      
      // Increment usage and save to history
      await supabaseAdmin.rpc("increment_chatbot_usage", { p_user_id: userId });
      await supabaseAdmin.from("chat_history").insert([
        { user_id: userId, role: "user", content: message, metadata: { intent: "news_redirect" } },
        { user_id: userId, role: "assistant", content: redirectResponse, metadata: { type: "redirect" } }
      ]);

      console.log(`User ${userId} asked for news, redirecting to stats`);

      return new Response(
        JSON.stringify({
          message: redirectResponse,
          usage: {
            current: currentUsage + 1,
            limit: DAILY_LIMIT,
            remaining: DAILY_LIMIT - currentUsage - 1
          },
          isPremium: true,
          isRedirect: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get recent chat history for context (last 10 messages)
    const { data: historyData } = await supabaseAdmin
      .from("chat_history")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    const chatHistory = (historyData || []).reverse().map(h => ({
      role: h.role as "user" | "assistant",
      content: h.content
    }));

    // Build messages array for AI
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...chatHistory,
      { role: "user", content: message }
    ];

    // Add context if provided (match data, stats, etc.)
    if (context) {
      const contextMessage = `\n\n[BAĞLAM VERİSİ - Yalnızca bu verilere dayanarak yanıt ver]\n${JSON.stringify(context, null, 2)}`;
      messages[messages.length - 1].content += contextMessage;
    }

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Calling Lovable AI Gateway...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        max_tokens: 800,
        temperature: 0.5, // Lower temperature for more factual responses
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI servisi şu anda yoğun. Lütfen biraz bekleyin.", code: "AI_RATE_LIMIT" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI servisi geçici olarak kullanılamıyor.", code: "AI_PAYMENT" }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let assistantMessage = aiData.choices?.[0]?.message?.content || "Üzgünüm, bir yanıt oluşturamadım.";

    // Apply policy filter
    assistantMessage = applyPolicyFilter(assistantMessage);

    // Increment usage count
    const { data: newUsageData } = await supabaseAdmin.rpc("increment_chatbot_usage", {
      p_user_id: userId
    });

    const newUsageCount = newUsageData ?? currentUsage + 1;
    console.log(`User ${userId} new usage: ${newUsageCount}/${DAILY_LIMIT}`);

    // Save messages to chat history
    await supabaseAdmin.from("chat_history").insert([
      { user_id: userId, role: "user", content: message, metadata: { intent: intent.type, hasContext: !!context } },
      { user_id: userId, role: "assistant", content: assistantMessage, metadata: { tokens: aiData.usage } }
    ]);

    // Return response
    return new Response(
      JSON.stringify({
        message: assistantMessage,
        usage: {
          current: newUsageCount,
          limit: DAILY_LIMIT,
          remaining: DAILY_LIMIT - newUsageCount
        },
        isPremium: true
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Chatbot error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu",
        code: "INTERNAL_ERROR"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
