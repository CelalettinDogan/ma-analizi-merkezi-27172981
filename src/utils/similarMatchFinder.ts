import { supabase } from '@/integrations/supabase/client';

export interface SimilarMatch {
  id: string;
  league: string;
  home_team: string;
  away_team: string;
  match_date: string;
  home_goals: number;
  away_goals: number;
  result: string;
  similarity: number;
}

export interface MatchFeaturesForSearch {
  positionDiff: number;
  homeFormScore: number;
  awayFormScore: number;
  homeGoalAvg: number;
  awayGoalAvg: number;
  homeAdvantageScore: number;
  isDerby: boolean;
  matchImportance: string;
}

// Benzerlik skoru hesapla (0-100)
function calculateSimilarity(
  current: MatchFeaturesForSearch,
  historical: {
    position_diff: number | null;
    home_form_score: number | null;
    away_form_score: number | null;
    home_goal_avg: number | null;
    away_goal_avg: number | null;
    home_advantage_score: number | null;
    is_derby: boolean | null;
    match_importance: string | null;
  }
): number {
  const weights = {
    positionDiff: 0.15,
    homeFormScore: 0.15,
    awayFormScore: 0.15,
    homeGoalAvg: 0.15,
    awayGoalAvg: 0.15,
    homeAdvantage: 0.10,
    isDerby: 0.10,
    matchImportance: 0.05,
  };

  let score = 0;
  let totalWeight = 0;

  // Position diff (max 20 fark)
  if (historical.position_diff !== null) {
    const diff = Math.abs(current.positionDiff - historical.position_diff) / 20;
    score += (1 - Math.min(diff, 1)) * weights.positionDiff * 100;
    totalWeight += weights.positionDiff;
  }

  // Form scores (0-100)
  if (historical.home_form_score !== null) {
    const diff = Math.abs(current.homeFormScore - historical.home_form_score) / 100;
    score += (1 - diff) * weights.homeFormScore * 100;
    totalWeight += weights.homeFormScore;
  }

  if (historical.away_form_score !== null) {
    const diff = Math.abs(current.awayFormScore - historical.away_form_score) / 100;
    score += (1 - diff) * weights.awayFormScore * 100;
    totalWeight += weights.awayFormScore;
  }

  // Goal averages (max 3 gol/maç)
  if (historical.home_goal_avg !== null) {
    const diff = Math.abs(current.homeGoalAvg - historical.home_goal_avg) / 3;
    score += (1 - Math.min(diff, 1)) * weights.homeGoalAvg * 100;
    totalWeight += weights.homeGoalAvg;
  }

  if (historical.away_goal_avg !== null) {
    const diff = Math.abs(current.awayGoalAvg - historical.away_goal_avg) / 3;
    score += (1 - Math.min(diff, 1)) * weights.awayGoalAvg * 100;
    totalWeight += weights.awayGoalAvg;
  }

  // Home advantage (-30 to +30)
  if (historical.home_advantage_score !== null) {
    const diff = Math.abs(current.homeAdvantageScore - historical.home_advantage_score) / 60;
    score += (1 - Math.min(diff, 1)) * weights.homeAdvantage * 100;
    totalWeight += weights.homeAdvantage;
  }

  // Derby match (exact match bonus)
  if (historical.is_derby !== null) {
    if (current.isDerby === historical.is_derby) {
      score += weights.isDerby * 100;
    }
    totalWeight += weights.isDerby;
  }

  // Match importance (exact match bonus)
  if (historical.match_importance !== null) {
    if (current.matchImportance === historical.match_importance) {
      score += weights.matchImportance * 100;
    }
    totalWeight += weights.matchImportance;
  }

  // Normalize
  return totalWeight > 0 ? Math.round(score / totalWeight) : 0;
}

// Benzer maçları bul
export async function findSimilarMatches(
  features: MatchFeaturesForSearch,
  league: string,
  limit: number = 10
): Promise<{
  matches: SimilarMatch[];
  stats: {
    homeWinRate: number;
    drawRate: number;
    awayWinRate: number;
    avgGoals: number;
    over2_5Rate: number;
    bttsRate: number;
  };
}> {
  try {
    // Match history'den sonuçlanmış maçları al
    const { data: historicalMatches, error } = await supabase
      .from('match_history')
      .select('*')
      .eq('league', league)
      .order('match_date', { ascending: false })
      .limit(200);

    if (error || !historicalMatches) {
      console.error('Error fetching historical matches:', error);
      return {
        matches: [],
        stats: { homeWinRate: 45, drawRate: 27, awayWinRate: 28, avgGoals: 2.5, over2_5Rate: 50, bttsRate: 50 },
      };
    }

    // Benzerlik skorlarını hesapla
    const matchesWithSimilarity = historicalMatches
      .map(match => ({
        id: match.id,
        league: match.league,
        home_team: match.home_team,
        away_team: match.away_team,
        match_date: match.match_date,
        home_goals: match.home_score ?? 0,
        away_goals: match.away_score ?? 0,
        result: '',
        similarity: calculateSimilarity(features, {
          position_diff: match.position_diff,
          home_form_score: match.home_form_score,
          away_form_score: match.away_form_score,
          home_goal_avg: match.home_goal_avg,
          away_goal_avg: match.away_goal_avg,
          home_advantage_score: 0,
          is_derby: match.is_derby,
          match_importance: match.match_importance,
        }),
      }))
      .filter(m => m.similarity >= 50) // Min %50 benzerlik
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    // İstatistikleri hesapla
    let homeWins = 0;
    let draws = 0;
    let awayWins = 0;
    let totalGoals = 0;
    let over2_5 = 0;
    let btts = 0;

    matchesWithSimilarity.forEach(m => {
      const homeGoals = m.home_goals;
      const awayGoals = m.away_goals;

      if (homeGoals > awayGoals) homeWins++;
      else if (homeGoals === awayGoals) draws++;
      else awayWins++;

      totalGoals += homeGoals + awayGoals;
      if (homeGoals + awayGoals > 2.5) over2_5++;
      if (homeGoals > 0 && awayGoals > 0) btts++;
    });

    const total = matchesWithSimilarity.length || 1;

    return {
      matches: matchesWithSimilarity.map(m => ({
        id: m.id,
        league: m.league,
        home_team: m.home_team,
        away_team: m.away_team,
        match_date: m.match_date,
        home_goals: m.home_goals,
        away_goals: m.away_goals,
        result: m.result,
        similarity: m.similarity,
      })),
      stats: {
        homeWinRate: Math.round((homeWins / total) * 100),
        drawRate: Math.round((draws / total) * 100),
        awayWinRate: Math.round((awayWins / total) * 100),
        avgGoals: Math.round((totalGoals / total) * 10) / 10,
        over2_5Rate: Math.round((over2_5 / total) * 100),
        bttsRate: Math.round((btts / total) * 100),
      },
    };
  } catch (err) {
    console.error('Error in findSimilarMatches:', err);
    return {
      matches: [],
      stats: { homeWinRate: 45, drawRate: 27, awayWinRate: 28, avgGoals: 2.5, over2_5Rate: 50, bttsRate: 50 },
    };
  }
}
