import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SmartPrompt {
  text: string;
  icon: string;
  type: 'match' | 'standings' | 'general';
}

// Popüler takımlar için ağırlık skoru
const POPULAR_TEAMS: Record<string, number> = {
  // Premier League Big 6
  'manchester city': 10,
  'arsenal': 10,
  'liverpool': 10,
  'chelsea': 9,
  'manchester united': 9,
  'tottenham': 8,
  // La Liga
  'real madrid': 10,
  'barcelona': 10,
  'atletico': 8,
  // Serie A
  'juventus': 9,
  'inter': 9,
  'milan': 9,
  'napoli': 8,
  // Bundesliga
  'bayern': 10,
  'dortmund': 9,
  // Ligue 1
  'paris': 10,
  'marseille': 7,
};

// Takım popülerlik skoru hesapla
const getMatchPopularity = (homeTeam: string, awayTeam: string): number => {
  const home = homeTeam.toLowerCase();
  const away = awayTeam.toLowerCase();
  
  let score = 0;
  Object.entries(POPULAR_TEAMS).forEach(([team, weight]) => {
    if (home.includes(team) || away.includes(team)) {
      score += weight;
    }
  });
  
  return score;
};

// Fallback promptlar (her zaman geçerli)
const FALLBACK_PROMPTS: SmartPrompt[] = [
  { text: "Premier Lig puan durumu", icon: "🏴󐁧󐁢󐁥󐁮󐁧󐁿", type: 'standings' },
  { text: "La Liga puan durumu", icon: "🇪🇸", type: 'standings' },
  { text: "Bu hafta en yüksek güvenli tahminler", icon: "🎯", type: 'general' },
  { text: "Bugün maç var mı?", icon: "📅", type: 'general' },
];

export function useSmartPrompts(maxPrompts: number = 4) {
  const [prompts, setPrompts] = useState<SmartPrompt[]>(FALLBACK_PROMPTS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSmartPrompts = async () => {
      try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(today);
        dayAfter.setDate(dayAfter.getDate() + 2);

        // Bugün ve yarının maçlarını çek
        const { data: matches, error } = await supabase
          .from("cached_matches")
          .select("home_team_name, away_team_name, utc_date, competition_name")
          .gte("utc_date", today.toISOString().split('T')[0])
          .lte("utc_date", dayAfter.toISOString().split('T')[0])
          .in("status", ["TIMED", "SCHEDULED"])
          .order("utc_date", { ascending: true })
          .limit(50);

        if (error || !matches || matches.length === 0) {
          // Maç yoksa fallback kullan
          setPrompts(FALLBACK_PROMPTS);
          setIsLoading(false);
          return;
        }

        // Maçları popülerliğe göre sırala
        const scoredMatches = matches.map(match => ({
          ...match,
          popularity: getMatchPopularity(match.home_team_name, match.away_team_name)
        })).sort((a, b) => b.popularity - a.popularity);

        // En popüler 2 maçı prompt olarak ekle
        const matchPrompts: SmartPrompt[] = scoredMatches
          .slice(0, 2)
          .map(match => ({
            text: `${match.home_team_name} vs ${match.away_team_name} analizi`,
            icon: "⚽",
            type: 'match' as const
          }));

        // Dinamik + fallback karışımı oluştur
        const dynamicPrompts: SmartPrompt[] = [
          ...matchPrompts,
          { text: "Bugünkü maçlar", icon: "📅", type: 'general' as const },
          { text: "Premier Lig puan durumu", icon: "🏆", type: 'standings' as const },
        ].slice(0, maxPrompts);

        setPrompts(dynamicPrompts);
      } catch (err) {
        console.error("Smart prompts error:", err);
        setPrompts(FALLBACK_PROMPTS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSmartPrompts();
  }, [maxPrompts]);

  return { prompts, isLoading };
}
