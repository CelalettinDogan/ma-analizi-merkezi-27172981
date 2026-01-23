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

// Responsible gambling warnings
const GAMBLING_WARNINGS = [
  "⚠️ Hatırlatma: Bahis sorumlu oynanmalıdır.",
  "⚠️ Bu analiz yatırım tavsiyesi değildir.",
  "⚠️ Kaybetmeyi göze alabileceğiniz miktarla oynamayı unutmayın.",
];

// System prompt for the AI
const SYSTEM_PROMPT = `Sen Gol Metrik'in yapay zeka futbol danışmanısın. Adın "Gol Asistan".

GÖREVLERIN:
1. Futbol maçı analizi ve tahmin desteği sağla
2. Takım istatistikleri hakkında bilgi ver
3. Form, H2H ve lig durumu yorumla
4. Kullanıcının bahis kararlarında yardımcı ol (teşvik etmeden)

KURALLAR:
- Her zaman Türkçe yanıt ver
- İstatistikleri kullanarak açıklama yap
- Kesin sonuç garantisi ASLA verme
- "Kesinlikle kazanır", "Garantili", "Risk yok" gibi ifadeler KULLANMA
- Sorumlu oyun hatırlat
- Bahis teşvik etme, sadece analiz sun
- Kısa ve öz yanıtlar ver (maksimum 250 kelime)

YANIT FORMATI:
- Kısa paragraflar kullan
- Önemli noktaları vurgula
- Emoji ile zenginleştir (⚽🥅📊)
- Güven seviyesini belirt: 🟢 Yüksek | 🟡 Orta | 🔴 Düşük

ÖNEMLİ: Kullanıcı sana maç verisi gönderirse, bu veriyi analiz et ve yorumla.`;

// Parse user intent to detect match analysis requests
function parseUserIntent(message: string): { type: string; teams: string[] } {
  const matchKeywords = ['maç', 'analiz', 'karşılaşma', 'oyun', 'tahmin', 'skor'];
  const hasMatchIntent = matchKeywords.some(k => message.toLowerCase().includes(k));
  
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
    console.log(`Intent: ${intent.type}, Teams: ${intent.teams.join(", ")}`);

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
      const contextMessage = `\n\n[BAĞLAM VERİSİ]\n${JSON.stringify(context, null, 2)}`;
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
        max_tokens: 1000,
        temperature: 0.7,
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
      { user_id: userId, role: "user", content: message, metadata: { intent: intent.type } },
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
