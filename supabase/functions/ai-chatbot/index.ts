import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAILY_LIMIT = 3;

// Supported leagues for context info
const SUPPORTED_LEAGUES = ["Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1", "Champions League"];
const SUPPORTED_LEAGUE_CODES = ["PL", "PD", "SA", "BL1", "FL1", "CL"];

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

// Known team name mappings (common variations to standard names)
const TEAM_ALIASES: Record<string, string[]> = {
  // Premier League
  "Manchester United": ["man utd", "man united", "manchester utd", "mu", "united", "manu"],
  "Manchester City": ["man city", "manchester city", "city", "mc", "citizens"],
  "Liverpool": ["liverpool", "lfc", "reds"],
  "Chelsea": ["chelsea", "cfc", "blues"],
  "Arsenal": ["arsenal", "afc", "gunners", "arsene"],
  "Tottenham": ["tottenham", "spurs", "thfc", "hotspur"],
  "Newcastle United": ["newcastle", "nufc", "magpies", "newcastle united"],
  "Aston Villa": ["aston villa", "villa", "avfc"],
  "West Ham": ["west ham", "hammers", "whu", "west ham united"],
  "Brighton": ["brighton", "seagulls", "bhafc", "brighton hove"],
  "Wolverhampton": ["wolves", "wolverhampton", "wanderers"],
  "Everton": ["everton", "toffees", "efc"],
  "Fulham": ["fulham", "cottagers", "ffc"],
  "Crystal Palace": ["crystal palace", "palace", "cpfc", "eagles"],
  "Brentford": ["brentford", "bees", "bfc"],
  "Nottingham Forest": ["nottingham forest", "forest", "nffc"],
  "Bournemouth": ["bournemouth", "cherries", "afcb"],
  "Leicester": ["leicester", "lcfc", "foxes", "leicester city"],
  
  // La Liga
  "Real Madrid": ["real madrid", "real", "madrid", "rm", "los blancos", "merengues"],
  "Barcelona": ["barcelona", "barca", "fcb", "blaugrana"],
  "Atletico Madrid": ["atletico", "atletico madrid", "atleti", "colchoneros"],
  "Real Sociedad": ["sociedad", "real sociedad", "txuri urdin"],
  "Athletic Bilbao": ["athletic", "bilbao", "athletic bilbao", "lions"],
  "Real Betis": ["betis", "real betis", "verdiblancos"],
  "Villarreal": ["villarreal", "yellow submarine", "submarino amarillo"],
  "Valencia": ["valencia", "los che", "vcf"],
  "Sevilla": ["sevilla", "sevillistas"],
  "Girona": ["girona", "gfc"],
  
  // Serie A
  "Juventus": ["juventus", "juve", "vecchia signora", "bianconeri"],
  "Inter Milan": ["inter", "inter milan", "internazionale", "nerazzurri"],
  "AC Milan": ["milan", "ac milan", "rossoneri", "diavolo"],
  "Napoli": ["napoli", "partenopei", "azzurri napoli"],
  "Roma": ["roma", "as roma", "giallorossi", "lupi"],
  "Lazio": ["lazio", "ss lazio", "biancocelesti", "aquile"],
  "Atalanta": ["atalanta", "dea", "bergamo", "bergamaschi"],
  "Fiorentina": ["fiorentina", "viola", "acf fiorentina"],
  "Bologna": ["bologna", "felsinei", "rossoblu"],
  "Torino": ["torino", "toro", "granata"],
  
  // Bundesliga
  "Bayern Munich": ["bayern", "bayern munich", "bayern munchen", "fcb bayern", "bavarians"],
  "Borussia Dortmund": ["dortmund", "bvb", "borussia dortmund", "schwarzgelben"],
  "RB Leipzig": ["leipzig", "rb leipzig", "red bull leipzig", "rbl"],
  "Bayer Leverkusen": ["leverkusen", "bayer", "werkself", "bayer leverkusen"],
  "Eintracht Frankfurt": ["frankfurt", "eintracht", "sge", "eintracht frankfurt"],
  "Union Berlin": ["union berlin", "union", "eiserne"],
  "Freiburg": ["freiburg", "sc freiburg", "breisgau"],
  "Wolfsburg": ["wolfsburg", "wolves de", "vfl wolfsburg"],
  "Borussia Monchengladbach": ["gladbach", "monchengladbach", "borussia monchengladbach", "fohlen"],
  "Hoffenheim": ["hoffenheim", "tsg", "tsg hoffenheim"],
  
  // Ligue 1
  "Paris Saint-Germain": ["psg", "paris", "paris saint germain", "parisiens"],
  "Marseille": ["marseille", "om", "olympique marseille", "phocéens"],
  "Monaco": ["monaco", "as monaco", "asm"],
  "Lyon": ["lyon", "ol", "olympique lyon", "gones"],
  "Lille": ["lille", "losc", "dogues"],
  "Nice": ["nice", "ogc nice", "aiglons"],
  "Lens": ["lens", "rc lens", "sang et or"],
  "Rennes": ["rennes", "stade rennais", "rouge et noir"],
  "Strasbourg": ["strasbourg", "racing", "rcsa"],
  "Nantes": ["nantes", "fc nantes", "canaris"],
};

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

🏆 UZUN VADELİ TAHMİN SORULARI (ŞAMPİYONLUK, SEZON SONU SIRALAMASI):

Kullanıcı lig şampiyonu, sezon sonu sıralamayı veya uzun vadeli sonuçları sorarsa:

⚠️ YAPMAMAN GEREKENLER:
- Kesin cevap verme ("X takımı şampiyon olacak" deme)
- Güncel haber veya resmi sonuç gibi konuşma
- "Yanıt oluşturulamadı" veya "Bu konuda bilgi veremem" deme

✅ YAPMAN GEREKENLER:
- OLASILIK ve FAVORİ dili kullan
- Mevcut istatistiklere dayalı analiz yap:
  • Güncel puan durumu
  • Son 5-10 maç formu
  • Gol averajı
  • Kalan fikstür zorluğu (varsa)
  • Tarihsel performans
- Örnek ifadeler:
  "📊 Mevcut verilere göre X takımı en güçlü şampiyonluk adayı görünüyor..."
  "🎯 Güncel form ve puan durumuna bakıldığında favori..."
  "📈 İstatistiksel olarak %X olasılıkla ilk 4'e girme potansiyeli..."
  "⚽ Şu anki performans trendi devam ederse..."

- Context yoksa lig bazlı genel verilerle analiz yap:
  "📊 [Lig Adı] için güncel puan durumu ve form verilerine göre şampiyonluk favorileri..."

- Her zaman belirsizlik vurgula:
  "Ancak futbolda her şey olabilir, sezon sonu farklı gelişebilir."

---

✅ SADECE BU KONULARDA KONUŞ:
1. Maç istatistikleri (gol, şut, korner, pas, topa sahip olma)
2. Takım formu (son 5 maç performansı - veritabanından)
3. H2H (kafa kafaya) geçmiş istatistikleri
4. Lig sıralaması ve puan durumu
5. Gol beklentisi (xG) ve ML tahmin metrikleri
6. Maç sonucu olasılıkları (istatistiksel model çıktıları)
7. Over/Under ve BTTS (her iki takım da gol atar) analizleri
8. Şampiyonluk/sezon sonu olasılık analizleri (OLASILIK diliyle)

---

📐 VERİ ODAKLI YAKLAŞIM:
- YALNIZCA sana verilen [BAĞLAM VERİSİ] ile konuş
- Veri yoksa genel lig ortalamaları ve bilinen istatistiklerle analiz yap
- Tahminlerin istatistiksel modellere dayandığını vurgula
- Hiçbir zaman "duyduğuma göre", "haberlere göre", "söylentilere göre" deme
- "Mevcut verilere göre...", "İstatistiksel olarak..." şeklinde konuş

---

📊 VERİ DURUMU KONTROLÜ:
Eğer [VERİ DURUMU] bölümünde "hasData: false" veya "limitedData: true" görürsen:
1. ASLA "yanıt oluşturulamadı" deme
2. Eldeki verilerle (puan durumu, genel lig istatistikleri) analiz yap
3. Eksik veriyi belirt ama yine de yardımcı ol:
   "Bu takım için detaylı maç verisi sınırlı, ancak lig sıralamasına göre..."
4. ASLA uydurma istatistik verme, ama OLASILIK diliyle analiz yap

---

YANITLARIN KAYNAĞI:
Veri (API / DB) → ML Modeli → Tahmin + Metrikler → Sen (sadece anlatırsın)

Senin görevin bu verileri YORUMLAMAK ve OLASILIK DİLİYLE sunmak.

---

YANIT KURALLARI:
- Her zaman Türkçe yanıt ver
- Kısa ve öz (maksimum 200 kelime)
- İstatistik varsa sayılarla destekle
- Emoji kullan: ⚽📊📈🎯🏆
- Güven seviyesi göster: 🟢 Yüksek | 🟡 Orta | 🔴 Düşük
- Kesin sonuç garantisi ASLA verme
- "Kesinlikle kazanır", "Garantili", "Risk yok" gibi ifadeler KULLANMA
- Uzun vadeli tahminlerde her zaman FAVORİ ve OLASILIK dili kullan`;

// Check if user is asking for news/rumors
function isNewsRequest(message: string): boolean {
  return NEWS_PATTERNS.some(pattern => pattern.test(message));
}

// Normalize team name for searching
function normalizeTeamName(name: string): string {
  return name.toLowerCase().trim();
}

// Try to find team in aliases
function findTeamByAlias(query: string): string | null {
  const normalized = normalizeTeamName(query);
  
  for (const [teamName, aliases] of Object.entries(TEAM_ALIASES)) {
    if (aliases.some(alias => normalized.includes(alias) || alias.includes(normalized))) {
      return teamName;
    }
    if (normalizeTeamName(teamName).includes(normalized)) {
      return teamName;
    }
  }
  
  return null;
}

// Extract team names from message with improved detection
function extractTeamNames(message: string): string[] {
  const teams: string[] = [];
  const lowerMessage = message.toLowerCase();
  
  // Check for known team aliases first
  for (const [teamName, aliases] of Object.entries(TEAM_ALIASES)) {
    for (const alias of aliases) {
      if (lowerMessage.includes(alias)) {
        if (!teams.includes(teamName)) {
          teams.push(teamName);
        }
        break;
      }
    }
    if (lowerMessage.includes(normalizeTeamName(teamName))) {
      if (!teams.includes(teamName)) {
        teams.push(teamName);
      }
    }
  }
  
  // Try to extract from vs patterns
  const vsPatterns = [
    /(\w+(?:\s+\w+)?)\s*(?:vs?\.?|[-–]|karşı|maçı)\s*(\w+(?:\s+\w+)?)/gi,
  ];
  
  for (const pattern of vsPatterns) {
    const matches = message.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && !teams.some(t => normalizeTeamName(t) === normalizeTeamName(match[1]))) {
        const foundTeam = findTeamByAlias(match[1]);
        if (foundTeam && !teams.includes(foundTeam)) {
          teams.push(foundTeam);
        } else if (!foundTeam && match[1].length > 2) {
          teams.push(match[1].trim());
        }
      }
      if (match[2] && !teams.some(t => normalizeTeamName(t) === normalizeTeamName(match[2]))) {
        const foundTeam = findTeamByAlias(match[2]);
        if (foundTeam && !teams.includes(foundTeam)) {
          teams.push(foundTeam);
        } else if (!foundTeam && match[2].length > 2) {
          teams.push(match[2].trim());
        }
      }
    }
  }
  
  return teams.slice(0, 2); // Max 2 teams
}

// Parse user intent to detect match analysis requests
function parseUserIntent(message: string): { type: string; teams: string[]; isNewsRequest: boolean } {
  const matchKeywords = ['maç', 'analiz', 'karşılaşma', 'oyun', 'tahmin', 'skor', 'form', 'istatistik', 'bugün', 'yarın'];
  const hasMatchIntent = matchKeywords.some(k => message.toLowerCase().includes(k));
  
  // Check if this is a news/rumor request
  const isNews = isNewsRequest(message);
  
  // Extract team names with improved detection
  const teams = extractTeamNames(message);
  
  return {
    type: hasMatchIntent || teams.length > 0 ? 'match_analysis' : 'general',
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

// Data availability status interface
interface DataAvailability {
  hasData: boolean;
  hasUpcoming: boolean;
  hasRecent: boolean;
  hasStandings: boolean;
  hasLeagueContext: boolean;
  limitedData: boolean;
  reason: string;
  searchedTeams: string[];
}

// Fetch match data from cached_matches table with extended date range
async function fetchMatchData(supabaseAdmin: any, teams: string[]): Promise<{ upcoming: any[]; recent: any[]; leagueCode: string | null }> {
  if (teams.length === 0) return { upcoming: [], recent: [], leagueCode: null };
  
  const today = new Date();
  
  // Upcoming matches: today to 14 days ahead
  const futureEnd = new Date(today);
  futureEnd.setDate(futureEnd.getDate() + 14);
  
  // Recent matches: 7 days ago to today
  const pastStart = new Date(today);
  pastStart.setDate(pastStart.getDate() - 7);
  
  const todayStr = today.toISOString();
  const futureStr = futureEnd.toISOString();
  const pastStr = pastStart.toISOString();
  
  console.log(`Searching for teams: ${teams.join(", ")} | Range: ${pastStr.split('T')[0]} to ${futureStr.split('T')[0]}`);
  
  try {
    // Parallel fetch: upcoming and recent matches
    const [upcomingResult, recentResult] = await Promise.all([
      // Upcoming matches (TIMED, SCHEDULED)
      supabaseAdmin
        .from("cached_matches")
        .select("*")
        .gte("utc_date", todayStr)
        .lte("utc_date", futureStr)
        .in("status", ["TIMED", "SCHEDULED"])
        .order("utc_date", { ascending: true }),
      
      // Recent finished matches
      supabaseAdmin
        .from("cached_matches")
        .select("*")
        .gte("utc_date", pastStr)
        .lt("utc_date", todayStr)
        .eq("status", "FINISHED")
        .order("utc_date", { ascending: false })
    ]);
    
    const allUpcoming = upcomingResult.data || [];
    const allRecent = recentResult.data || [];
    
    // Filter by team names
    const filterByTeam = (matches: any[]) => matches.filter((m: any) => {
      const homeTeam = normalizeTeamName(m.home_team_name);
      const awayTeam = normalizeTeamName(m.away_team_name);
      
      return teams.some(team => {
        const normalizedTeam = normalizeTeamName(team);
        return homeTeam.includes(normalizedTeam) || 
               awayTeam.includes(normalizedTeam) ||
               normalizedTeam.includes(homeTeam) ||
               normalizedTeam.includes(awayTeam);
      });
    });
    
    const upcoming = filterByTeam(allUpcoming);
    const recent = filterByTeam(allRecent);
    
    // Get league code from the first match found
    const firstMatch = upcoming[0] || recent[0];
    const leagueCode = firstMatch?.competition_code || null;
    
    console.log(`Found ${upcoming.length} upcoming, ${recent.length} recent matches for teams. League: ${leagueCode}`);
    
    return { upcoming, recent, leagueCode };
  } catch (error) {
    console.error("Error fetching match data:", error);
    return { upcoming: [], recent: [], leagueCode: null };
  }
}

// Fetch league context (other matches in the same league)
async function fetchLeagueContext(supabaseAdmin: any, leagueCode: string): Promise<any[]> {
  if (!leagueCode) return [];
  
  const today = new Date();
  const weekAhead = new Date(today);
  weekAhead.setDate(weekAhead.getDate() + 7);
  
  try {
    const { data, error } = await supabaseAdmin
      .from("cached_matches")
      .select("home_team_name, away_team_name, utc_date, status, matchday")
      .eq("competition_code", leagueCode)
      .gte("utc_date", today.toISOString())
      .lte("utc_date", weekAhead.toISOString())
      .in("status", ["TIMED", "SCHEDULED"])
      .order("utc_date", { ascending: true })
      .limit(5);
    
    if (error) {
      console.error("Error fetching league context:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in fetchLeagueContext:", error);
    return [];
  }
}

// Fetch standings data for teams
async function fetchStandingsData(supabaseAdmin: any, teams: string[]): Promise<any[]> {
  if (teams.length === 0) return [];
  
  const { data: standings, error } = await supabaseAdmin
    .from("cached_standings")
    .select("*")
    .order("position", { ascending: true });
  
  if (error || !standings) {
    console.error("Error fetching standings:", error);
    return [];
  }
  
  // Find standings for mentioned teams
  const relevantStandings = standings.filter((s: any) => {
    const teamName = normalizeTeamName(s.team_name);
    return teams.some(team => {
      const normalizedTeam = normalizeTeamName(team);
      return teamName.includes(normalizedTeam) || normalizedTeam.includes(teamName);
    });
  });
  
  return relevantStandings;
}

// Fetch today's matches if no specific team mentioned
async function fetchTodaysMatches(supabaseAdmin: any): Promise<any[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: matches, error } = await supabaseAdmin
    .from("cached_matches")
    .select("*")
    .gte("utc_date", today)
    .lte("utc_date", today + "T23:59:59Z")
    .order("utc_date", { ascending: true })
    .limit(10);
  
  if (error) {
    console.error("Error fetching today's matches:", error);
    return [];
  }
  
  return matches || [];
}

// Build context from database data with data availability info
function buildContextFromData(
  upcoming: any[], 
  recent: any[], 
  standings: any[], 
  leagueContext: any[],
  searchedTeams: string[]
): { context: any; dataAvailability: DataAvailability } {
  
  const dataAvailability: DataAvailability = {
    hasData: false,
    hasUpcoming: upcoming.length > 0,
    hasRecent: recent.length > 0,
    hasStandings: standings.length > 0,
    hasLeagueContext: leagueContext.length > 0,
    limitedData: false,
    reason: "",
    searchedTeams
  };
  
  // Check if we have any useful data
  if (!dataAvailability.hasUpcoming && !dataAvailability.hasRecent && !dataAvailability.hasStandings) {
    dataAvailability.limitedData = true;
    dataAvailability.reason = `"${searchedTeams.join(', ')}" için veritabanında maç veya sıralama verisi bulunamadı. Bu takım desteklenen liglerde (${SUPPORTED_LEAGUES.join(', ')}) olmayabilir veya yakın tarihli maç bulunmuyor olabilir.`;
  } else if (!dataAvailability.hasUpcoming && !dataAvailability.hasRecent) {
    dataAvailability.limitedData = true;
    dataAvailability.reason = "Yaklaşan veya son oynanan maç verisi bulunamadı. Sadece lig sıralaması bilgisi mevcut.";
    dataAvailability.hasData = true;
  } else {
    dataAvailability.hasData = true;
  }
  
  const context: any = {
    source: "database",
    fetchedAt: new Date().toISOString(),
  };
  
  // Add upcoming matches
  if (upcoming.length > 0) {
    context.upcomingMatches = upcoming.map((m: any) => ({
      homeTeam: m.home_team_name,
      awayTeam: m.away_team_name,
      date: m.utc_date,
      status: m.status,
      competition: m.competition_name || m.competition_code,
      matchday: m.matchday
    }));
  }
  
  // Add recent matches (for form analysis)
  if (recent.length > 0) {
    context.recentMatches = recent.map((m: any) => ({
      homeTeam: m.home_team_name,
      awayTeam: m.away_team_name,
      date: m.utc_date,
      competition: m.competition_name || m.competition_code,
      score: {
        home: m.home_score,
        away: m.away_score,
        winner: m.winner
      }
    }));
  }
  
  // Add standings
  if (standings.length > 0) {
    context.standings = standings.map((s: any) => ({
      team: s.team_name,
      position: s.position,
      points: s.points,
      played: s.played_games,
      won: s.won,
      draw: s.draw,
      lost: s.lost,
      goalsFor: s.goals_for,
      goalsAgainst: s.goals_against,
      goalDifference: s.goal_difference,
      form: s.form,
      competition: s.competition_name || s.competition_code
    }));
  }
  
  // Add league context (other matches in same league)
  if (leagueContext.length > 0) {
    context.leagueFixtures = leagueContext.map((m: any) => ({
      match: `${m.home_team_name} vs ${m.away_team_name}`,
      date: m.utc_date,
      matchday: m.matchday
    }));
  }
  
  return { context, dataAvailability };
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

    // Check if user is admin (bypass all limits)
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!adminRole;
    
    if (isAdmin) {
      console.log(`Admin user ${userId} - bypassing all limits`);
    }

    // Check premium status
    const { data: premiumData } = await supabaseAdmin
      .from("premium_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .gte("expires_at", new Date().toISOString())
      .limit(1);

    const isPremium = premiumData && premiumData.length > 0;

    // Admins bypass premium check
    if (!isPremium && !isAdmin) {
      console.log(`User ${userId} is not premium and not admin`);
      return new Response(
        JSON.stringify({ 
          error: "Bu özellik sadece Premium üyelere açıktır", 
          code: "PREMIUM_REQUIRED",
          isPremium: false 
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check daily usage limit (admins bypass this)
    const { data: usageData } = await supabaseAdmin
      .from("chatbot_usage")
      .select("usage_count")
      .eq("user_id", userId)
      .eq("usage_date", new Date().toISOString().split('T')[0])
      .single();

    const currentUsage = usageData?.usage_count ?? 0;

    // Admins bypass daily limit
    if (currentUsage >= DAILY_LIMIT && !isAdmin) {
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
    const { message, context: providedContext } = await req.json();

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
    if (intent.isNewsRequest && !providedContext) {
      const redirectResponse = getNewsRedirectResponse(intent.teams);
      
      // Only increment usage for non-admin users
      if (!isAdmin) {
        await supabaseAdmin.rpc("increment_chatbot_usage", { p_user_id: userId });
      }
      
      await supabaseAdmin.from("chat_history").insert([
        { user_id: userId, role: "user", content: message, metadata: { intent: "news_redirect" } },
        { user_id: userId, role: "assistant", content: redirectResponse, metadata: { type: "redirect" } }
      ]);

      console.log(`User ${userId} asked for news, redirecting to stats`);

      return new Response(
        JSON.stringify({
          message: redirectResponse,
          usage: {
            current: isAdmin ? 0 : currentUsage + 1,
            limit: isAdmin ? "∞" : DAILY_LIMIT,
            remaining: isAdmin ? "∞" : DAILY_LIMIT - currentUsage - 1
          },
          isPremium: true,
          isAdmin,
          isRedirect: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context from database if not provided
    let context = providedContext;
    let dataSource = "provided";
    let dataAvailability: DataAvailability | null = null;
    
    if (!context && intent.type === "match_analysis") {
      console.log("No context provided, fetching from database...");
      
      if (intent.teams.length > 0) {
        // Fetch match data with extended date range
        const { upcoming, recent, leagueCode } = await fetchMatchData(supabaseAdmin, intent.teams);
        
        // Fetch standings and league context in parallel
        const [standingsData, leagueContextData] = await Promise.all([
          fetchStandingsData(supabaseAdmin, intent.teams),
          leagueCode ? fetchLeagueContext(supabaseAdmin, leagueCode) : Promise.resolve([])
        ]);
        
        const result = buildContextFromData(upcoming, recent, standingsData, leagueContextData, intent.teams);
        context = result.context;
        dataAvailability = result.dataAvailability;
        dataSource = "database";
        
        console.log(`Built context from database: ${upcoming.length} upcoming, ${recent.length} recent, ${standingsData.length} standings`);
      } else {
        // No specific team, fetch today's matches
        const todaysMatches = await fetchTodaysMatches(supabaseAdmin);
        
        if (todaysMatches.length > 0) {
          context = {
            source: "database",
            fetchedAt: new Date().toISOString(),
            todaysMatches: todaysMatches.map((m: any) => ({
              homeTeam: m.home_team_name,
              awayTeam: m.away_team_name,
              date: m.utc_date,
              competition: m.competition_name || m.competition_code,
              status: m.status
            }))
          };
          dataSource = "database";
        }
      }
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

    // Add context if available (from provided or database)
    if (context) {
      let contextMessage = `\n\n[BAĞLAM VERİSİ - Yalnızca bu verilere dayanarak yanıt ver]\nKaynak: ${dataSource === "database" ? "Veritabanı (cached_matches, cached_standings)" : "Kullanıcı tarafından sağlandı"}\n${JSON.stringify(context, null, 2)}`;
      
      // Add data availability info if we fetched from database
      if (dataAvailability) {
        contextMessage += `\n\n[VERİ DURUMU]\n${JSON.stringify(dataAvailability, null, 2)}`;
      }
      
      messages[messages.length - 1].content += contextMessage;
    } else if (intent.teams.length > 0) {
      // No context found for requested teams - inform AI
      const noDataInfo: DataAvailability = {
        hasData: false,
        hasUpcoming: false,
        hasRecent: false,
        hasStandings: false,
        hasLeagueContext: false,
        limitedData: true,
        reason: `"${intent.teams.join(', ')}" için veritabanında hiçbir veri bulunamadı. Bu takım desteklenen liglerde (${SUPPORTED_LEAGUES.join(', ')}) olmayabilir.`,
        searchedTeams: intent.teams
      };
      
      messages[messages.length - 1].content += `\n\n[VERİ DURUMU - KRİTİK]\n${JSON.stringify(noDataInfo, null, 2)}\n\nBu takım için veri YOK. Lütfen kullanıcıya bunu açıkça belirt ve ASLA uydurma bilgi verme.`;
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

    // Increment usage count (skip for admin users)
    let newUsageCount = currentUsage;
    if (!isAdmin) {
      const { data: newUsageData } = await supabaseAdmin.rpc("increment_chatbot_usage", {
        p_user_id: userId
      });
      newUsageCount = newUsageData ?? currentUsage + 1;
    }
    
    console.log(`User ${userId} new usage: ${isAdmin ? "∞ (admin)" : `${newUsageCount}/${DAILY_LIMIT}`}`);

    // Save messages to chat history
    await supabaseAdmin.from("chat_history").insert([
      { user_id: userId, role: "user", content: message, metadata: { intent: intent.type, teams: intent.teams, hasContext: !!context, dataSource } },
      { user_id: userId, role: "assistant", content: assistantMessage, metadata: { tokens: aiData.usage, dataAvailability } }
    ]);

    // Return response
    return new Response(
      JSON.stringify({
        message: assistantMessage,
        usage: {
          current: isAdmin ? 0 : newUsageCount,
          limit: isAdmin ? "∞" : DAILY_LIMIT,
          remaining: isAdmin ? "∞" : DAILY_LIMIT - newUsageCount
        },
        isPremium: true,
        isAdmin,
        dataSource: context ? dataSource : null,
        dataAvailability
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
