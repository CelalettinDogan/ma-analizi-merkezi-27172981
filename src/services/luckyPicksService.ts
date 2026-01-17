import { supabase } from '@/integrations/supabase/client';
import { BetSlipItem } from '@/types/betslip';
import { format, addDays } from 'date-fns';

export interface LuckyPick {
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  predictionType: string;
  predictionValue: string;
  confidence: 'düşük' | 'orta' | 'yüksek';
  hybridConfidence: number;
}

/**
 * Get the top N highest confidence predictions for upcoming matches
 * Uses cached_matches to find upcoming games and predictions table for confidence data
 */
export async function getLuckyPicks(limit: number = 3): Promise<LuckyPick[]> {
  const today = format(new Date(), 'yyyy-MM-dd');
  const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  // First try to get from predictions table (existing analyzed matches)
  const { data: predictions, error: predictionsError } = await supabase
    .from('predictions')
    .select('*')
    .gte('match_date', today)
    .lte('match_date', nextWeek)
    .is('is_correct', null) // Not yet verified (upcoming)
    .not('hybrid_confidence', 'is', null)
    .order('hybrid_confidence', { ascending: false })
    .limit(50); // Get more to filter unique matches

  if (predictionsError) {
    console.error('Error fetching predictions for lucky picks:', predictionsError);
    throw new Error('Şanslı tahminler yüklenemedi');
  }

  if (!predictions || predictions.length === 0) {
    // Fallback: Get from cached matches and calculate simple confidence
    return await getLuckyPicksFromCachedMatches(limit);
  }

  // Get unique matches with their highest confidence prediction
  const matchMap = new Map<string, LuckyPick>();
  
  for (const pred of predictions) {
    const matchKey = `${pred.home_team}-${pred.away_team}`;
    
    // Skip if we already have this match with higher confidence
    if (matchMap.has(matchKey)) {
      continue;
    }

    // Map confidence from percentage to category
    const hybridConf = pred.hybrid_confidence || 50;
    let confidence: 'düşük' | 'orta' | 'yüksek' = 'düşük';
    if (hybridConf >= 70) confidence = 'yüksek';
    else if (hybridConf >= 50) confidence = 'orta';

    matchMap.set(matchKey, {
      homeTeam: pred.home_team,
      awayTeam: pred.away_team,
      league: pred.league,
      matchDate: pred.match_date,
      predictionType: pred.prediction_type,
      predictionValue: pred.prediction_value,
      confidence,
      hybridConfidence: hybridConf,
    });

    if (matchMap.size >= limit) break;
  }

  return Array.from(matchMap.values());
}

/**
 * Fallback: Get upcoming matches from cache and create simple predictions
 */
async function getLuckyPicksFromCachedMatches(limit: number): Promise<LuckyPick[]> {
  const now = new Date().toISOString();

  const { data: matches, error } = await supabase
    .from('cached_matches')
    .select('*')
    .gt('utc_date', now)
    .in('status', ['TIMED', 'SCHEDULED'])
    .order('utc_date', { ascending: true })
    .limit(limit);

  if (error || !matches) {
    console.error('Error fetching cached matches:', error);
    throw new Error('Maç bulunamadı');
  }

  // Create simple predictions based on home advantage (mock high confidence)
  return matches.map((match) => ({
    homeTeam: match.home_team_name,
    awayTeam: match.away_team_name,
    league: match.competition_code,
    matchDate: format(new Date(match.utc_date), 'yyyy-MM-dd'),
    predictionType: 'Maç Sonucu',
    predictionValue: 'Ev Sahibi Kazanır',
    confidence: 'yüksek' as const,
    hybridConfidence: 65,
  }));
}

/**
 * Convert LuckyPick to BetSlipItem format
 */
export function luckyPickToBetSlipItem(pick: LuckyPick): Omit<BetSlipItem, 'id'> {
  return {
    homeTeam: pick.homeTeam,
    awayTeam: pick.awayTeam,
    league: pick.league,
    matchDate: pick.matchDate,
    predictionType: pick.predictionType,
    predictionValue: pick.predictionValue,
    confidence: pick.confidence,
    odds: null,
  };
}
