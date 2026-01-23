import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SmartPrompt {
  text: string;
  icon: string;
  type: 'match' | 'standings' | 'general';
  isPopular?: boolean;
}

// Popüler takımlar için ağırlık skoru
const POPULAR_TEAMS: Record<string, number> = {
  // Premier League Big 6
  'manchester city': 10,
  'man city': 10,
  'arsenal': 10,
  'liverpool': 10,
  'chelsea': 9,
  'manchester united': 9,
  'man united': 9,
  'tottenham': 8,
  // La Liga
  'real madrid': 10,
  'barcelona': 10,
  'atletico': 8,
  'sevilla': 7,
  'villarreal': 7,
  // Serie A
  'juventus': 9,
  'inter': 9,
  'milan': 9,
  'napoli': 8,
  'roma': 7,
  // Bundesliga
  'bayern': 10,
  'dortmund': 9,
  'leverkusen': 8,
  // Ligue 1
  'paris': 10,
  'psg': 10,
  'marseille': 7,
  'monaco': 7,
};

// Uzun takım adlarını kısa versiyonlara çevir
const TEAM_SHORT_NAMES: Record<string, string> = {
  'fc internazionale milano': 'Inter',
  'inter milan': 'Inter',
  'paris saint-germain fc': 'PSG',
  'paris saint-germain': 'PSG',
  'fc bayern münchen': 'Bayern',
  'bayern munich': 'Bayern',
  'manchester city fc': 'Man City',
  'manchester united fc': 'Man United',
  'borussia dortmund': 'Dortmund',
  'real madrid cf': 'Real Madrid',
  'fc barcelona': 'Barcelona',
  'wolverhampton wanderers fc': 'Wolves',
  'wolverhampton': 'Wolves',
  'tottenham hotspur fc': 'Tottenham',
  'atletico madrid': 'Atletico',
  'club atlético de madrid': 'Atletico',
  'ac milan': 'Milan',
  'ssc napoli': 'Napoli',
  'juventus fc': 'Juventus',
  'as roma': 'Roma',
  'ss lazio': 'Lazio',
  'rb leipzig': 'Leipzig',
  'bayer 04 leverkusen': 'Leverkusen',
  'olympique de marseille': 'Marseille',
  'olympique lyonnais': 'Lyon',
  'newcastle united fc': 'Newcastle',
  'aston villa fc': 'Aston Villa',
  'west ham united fc': 'West Ham',
  'brighton & hove albion fc': 'Brighton',
  'crystal palace fc': 'Crystal Palace',
  'nottingham forest fc': 'Forest',
  'everton fc': 'Everton',
  'fulham fc': 'Fulham',
  'brentford fc': 'Brentford',
  'ipswich town fc': 'Ipswich',
  'leicester city fc': 'Leicester',
  'southampton fc': 'Southampton',
  'real sociedad de fútbol': 'Real Sociedad',
  'real betis balompié': 'Real Betis',
  'villarreal cf': 'Villarreal',
  'sevilla fc': 'Sevilla',
  'valencia cf': 'Valencia',
  'athletic club': 'Athletic Bilbao',
  'rcd espanyol de barcelona': 'Espanyol',
  'getafe cf': 'Getafe',
  'celta de vigo': 'Celta Vigo',
  'rayo vallecano de madrid': 'Rayo Vallecano',
  'ud las palmas': 'Las Palmas',
  'deportivo alavés': 'Alaves',
  'real valladolid cf': 'Valladolid',
  'ca osasuna': 'Osasuna',
  'cd leganés': 'Leganes',
  'girona fc': 'Girona',
  'rcd mallorca': 'Mallorca',
  'atalanta bc': 'Atalanta',
  'acf fiorentina': 'Fiorentina',
  'torino fc': 'Torino',
  'bologna fc 1909': 'Bologna',
  'udinese calcio': 'Udinese',
  'hellas verona fc': 'Verona',
  'us lecce': 'Lecce',
  'genoa cfc': 'Genoa',
  'empoli fc': 'Empoli',
  'parma calcio 1913': 'Parma',
  'cagliari calcio': 'Cagliari',
  'como 1907': 'Como',
  'venezia fc': 'Venezia',
  'ac monza': 'Monza',
  'sc freiburg': 'Freiburg',
  'vfb stuttgart': 'Stuttgart',
  'eintracht frankfurt': 'Frankfurt',
  'vfl wolfsburg': 'Wolfsburg',
  '1. fc union berlin': 'Union Berlin',
  'tsg 1899 hoffenheim': 'Hoffenheim',
  'fc augsburg': 'Augsburg',
  'sv werder bremen': 'Werder Bremen',
  'vfl bochum 1848': 'Bochum',
  '1. fc heidenheim 1846': 'Heidenheim',
  '1. fsv mainz 05': 'Mainz',
  'fc st. pauli 1910': 'St. Pauli',
  'holstein kiel': 'Holstein Kiel',
  'borussia mönchengladbach': 'Gladbach',
  'as monaco fc': 'Monaco',
  'losc lille': 'Lille',
  'stade brestois 29': 'Brest',
  'rc lens': 'Lens',
  'stade rennais fc 1901': 'Rennes',
  'ogc nice': 'Nice',
  'rc strasbourg alsace': 'Strasbourg',
  'fc nantes': 'Nantes',
  'toulouse fc': 'Toulouse',
  'montpellier hsc': 'Montpellier',
  'angers sco': 'Angers',
  'aj auxerre': 'Auxerre',
  'stade de reims': 'Reims',
  'le havre ac': 'Le Havre',
  'as saint-étienne': 'Saint-Etienne',
};

// Takım adını kısalt
const getShortName = (fullName: string): string => {
  const lower = fullName.toLowerCase().trim();
  
  // Önce tam eşleşme ara
  if (TEAM_SHORT_NAMES[lower]) {
    return TEAM_SHORT_NAMES[lower];
  }
  
  // Partial match dene
  for (const [key, value] of Object.entries(TEAM_SHORT_NAMES)) {
    if (lower.includes(key) || key.includes(lower)) {
      return value;
    }
  }
  
  // Fallback: FC/AC gibi prefixleri kaldır ve ilk 2 kelimeyi al
  const cleaned = fullName
    .replace(/^(FC|AC|SS|SSC|SC|AS|US|RC|RCD|UD|CD|CA|CF|AFC|SV|VfL|VfB|TSG|1\.|OGC|LOSC)\s*/i, '')
    .trim();
  
  const words = cleaned.split(' ');
  if (words.length <= 2) return cleaned;
  return words.slice(0, 2).join(' ');
};

// Takım popülerlik skoru hesapla
const getMatchPopularity = (homeTeam: string, awayTeam: string): number => {
  const homeLower = homeTeam.toLowerCase();
  const awayLower = awayTeam.toLowerCase();
  
  let score = 0;
  let homePopular = false;
  let awayPopular = false;
  
  Object.entries(POPULAR_TEAMS).forEach(([team, weight]) => {
    if (homeLower.includes(team) || team.includes(homeLower.split(' ')[0])) {
      score += weight;
      homePopular = true;
    }
    if (awayLower.includes(team) || team.includes(awayLower.split(' ')[0])) {
      score += weight;
      awayPopular = true;
    }
  });
  
  // İki popüler takım karşılaşması = bonus puan
  if (homePopular && awayPopular) {
    score += 5;
  }
  
  return score;
};

// Format match day (Bugün/Yarın + saat)
const formatMatchDay = (utcDate: string): string => {
  const matchDate = new Date(utcDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Saat formatı (Türkiye saati)
  const time = matchDate.toLocaleTimeString('tr-TR', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Europe/Istanbul'
  });
  
  // Tarih karşılaştırma (sadece gün)
  const isToday = matchDate.toDateString() === today.toDateString();
  const isTomorrow = matchDate.toDateString() === tomorrow.toDateString();
  
  if (isToday) return `Bugün ${time}`;
  if (isTomorrow) return `Yarın ${time}`;
  
  // Hafta içi gün adı
  const dayName = matchDate.toLocaleDateString('tr-TR', { weekday: 'short' });
  return `${dayName} ${time}`;
};

// Fallback promptlar (her zaman geçerli)
const FALLBACK_PROMPTS: SmartPrompt[] = [
  { text: "Premier Lig puan durumu", icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", type: 'standings' },
  { text: "La Liga puan durumu", icon: "🇪🇸", type: 'standings' },
  { text: "Bu hafta en güvenli tahminler", icon: "🎯", type: 'general' },
  { text: "Bugün maç var mı?", icon: "📅", type: 'general' },
];

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

interface CacheData {
  prompts: SmartPrompt[];
  timestamp: number;
  maxPrompts: number;
}

interface UseSmartPromptsReturn {
  prompts: SmartPrompt[];
  isLoading: boolean;
  error: string | null;
}

export function useSmartPrompts(maxPrompts: number = 4): UseSmartPromptsReturn {
  const [prompts, setPrompts] = useState<SmartPrompt[]>(FALLBACK_PROMPTS.slice(0, maxPrompts));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cache ref to persist between renders
  const cacheRef = useRef<CacheData | null>(null);

  useEffect(() => {
    // Check cache first
    const now = Date.now();
    if (
      cacheRef.current && 
      now - cacheRef.current.timestamp < CACHE_DURATION &&
      cacheRef.current.maxPrompts === maxPrompts &&
      cacheRef.current.prompts.length > 0
    ) {
      setPrompts(cacheRef.current.prompts);
      setIsLoading(false);
      return;
    }

    const fetchSmartPrompts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const today = new Date();
        const dayAfter = new Date(today);
        dayAfter.setDate(dayAfter.getDate() + 2);

        // Bugün ve yarının maçlarını çek
        const { data: matches, error: fetchError } = await supabase
          .from("cached_matches")
          .select("home_team_name, away_team_name, utc_date, competition_name")
          .gte("utc_date", today.toISOString().split('T')[0])
          .lte("utc_date", dayAfter.toISOString().split('T')[0])
          .in("status", ["TIMED", "SCHEDULED"])
          .order("utc_date", { ascending: true })
          .limit(50);

        if (fetchError) {
          throw fetchError;
        }

        if (!matches || matches.length === 0) {
          // Maç yoksa fallback kullan
          setPrompts(FALLBACK_PROMPTS.slice(0, maxPrompts));
          setIsLoading(false);
          return;
        }

        // Maçları popülerliğe göre sırala
        const scoredMatches = matches.map(match => ({
          ...match,
          popularity: getMatchPopularity(match.home_team_name, match.away_team_name)
        })).sort((a, b) => b.popularity - a.popularity);

        // En popüler 2 maçı prompt olarak ekle (kısaltılmış isimlerle + gün bilgisi)
        const matchPrompts: SmartPrompt[] = scoredMatches
          .slice(0, 2)
          .map(match => {
            const shortHome = getShortName(match.home_team_name);
            const shortAway = getShortName(match.away_team_name);
            const dayLabel = formatMatchDay(match.utc_date);
            
            return {
              text: `${shortHome} vs ${shortAway} (${dayLabel})`,
              icon: match.popularity >= 15 ? "🔥" : "⚽",
              type: 'match' as const,
              isPopular: match.popularity >= 15
            };
          });

        // Dinamik + fallback karışımı oluştur
        const dynamicPrompts: SmartPrompt[] = [
          ...matchPrompts,
          { text: "Bugünkü maçlar", icon: "📅", type: 'general' as const },
          { text: "Premier Lig puan durumu", icon: "🏆", type: 'standings' as const },
        ].slice(0, maxPrompts);

        // Cache'e kaydet
        cacheRef.current = {
          prompts: dynamicPrompts,
          timestamp: Date.now(),
          maxPrompts
        };

        setPrompts(dynamicPrompts);
      } catch (err) {
        console.error("Smart prompts error:", err);
        setError("Öneriler yüklenemedi");
        setPrompts(FALLBACK_PROMPTS.slice(0, maxPrompts));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSmartPrompts();
  }, [maxPrompts]);

  return { prompts, isLoading, error };
}
