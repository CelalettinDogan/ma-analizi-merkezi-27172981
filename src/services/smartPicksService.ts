import { supabase } from '@/integrations/supabase/client';
import { AnalysisSetItem } from '@/types/analysisSet';
import { format, addDays } from 'date-fns';

export interface SmartPick {
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
 * Only includes matches that haven't started yet (status = TIMED or SCHEDULED)
 */
export async function getSmartPicks(limit: number = 3): Promise<SmartPick[]> {
  const now = new Date().toISOString();

  // First get upcoming matches from cache to know which ones are actually not played
  const { data: upcomingMatches, error: matchError } = await supabase
    .from('cached_matches')
    .select('home_team_name, away_team_name, competition_code, utc_date, status')
    .gt('utc_date', now)
    .in('status', ['TIMED', 'SCHEDULED'])
    .order('utc_date', { ascending: true })
    .limit(100);

  if (matchError) {
    console.error('Error fetching upcoming matches:', matchError);
    throw new Error('Akıllı seçimler yüklenemedi');
  }

  if (!upcomingMatches || upcomingMatches.length === 0) {
    throw new Error('Yaklaşan maç bulunamadı');
  }

  // Create a set of valid upcoming match keys
  const upcomingMatchKeys = new Set(
    upcomingMatches.map(m => `${m.home_team_name}-${m.away_team_name}`)
  );

  const today = format(new Date(), 'yyyy-MM-dd');
  const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  // Get predictions and filter only those that match upcoming games
  const { data: predictions, error: predictionsError } = await supabase
    .from('predictions')
    .select('*')
    .gte('match_date', today)
    .lte('match_date', nextWeek)
    .is('is_correct', null) // Not yet verified
    .not('hybrid_confidence', 'is', null)
    .order('hybrid_confidence', { ascending: false })
    .limit(100);

  if (predictionsError) {
    console.error('Error fetching predictions for smart picks:', predictionsError);
    throw new Error('Akıllı seçimler yüklenemedi');
  }

  // Filter predictions to only include upcoming matches
  const validPredictions = predictions?.filter(pred => 
    upcomingMatchKeys.has(`${pred.home_team}-${pred.away_team}`)
  ) || [];

  if (validPredictions.length === 0) {
    throw new Error('Henüz analiz edilmiş tahmin bulunmuyor. Önce maç analizi yapın.');
  }

  // Get unique matches with their highest confidence prediction
  const matchMap = new Map<string, SmartPick>();
  
  for (const pred of validPredictions) {
    const matchKey = `${pred.home_team}-${pred.away_team}`;
    
    // Skip if we already have this match with higher confidence
    if (matchMap.has(matchKey)) {
      continue;
    }

    // Use database confidence if valid, otherwise calculate from hybrid_confidence
    let confidence: 'düşük' | 'orta' | 'yüksek';
    if (pred.confidence === 'yüksek' || pred.confidence === 'orta' || pred.confidence === 'düşük') {
      confidence = pred.confidence;
    } else {
      // Scale hybrid_confidence from 0-1 to 0-100 for threshold comparison
      const hybridConfPercent = (pred.hybrid_confidence || 0.5) * 100;
      if (hybridConfPercent >= 70) confidence = 'yüksek';
      else if (hybridConfPercent >= 50) confidence = 'orta';
      else confidence = 'düşük';
    }
    
    // Also scale for display (0-1 to 0-100)
    const hybridConf = (pred.hybrid_confidence || 0.5) * 100;

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
 * Convert SmartPick to AnalysisSetItem format
 */
export function smartPickToAnalysisSetItem(pick: SmartPick): Omit<AnalysisSetItem, 'id'> {
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

// Backward compatibility
export const getLuckyPicks = getSmartPicks;
export const luckyPickToBetSlipItem = smartPickToAnalysisSetItem;
