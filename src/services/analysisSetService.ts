import { supabase } from '@/integrations/supabase/client';
import { AnalysisSet, AnalysisSetItem, AnalysisSetItemRecord } from '@/types/analysisSet';

export async function saveAnalysisSet(
  items: Omit<AnalysisSetItem, 'id'>[],
  userId: string,
  name?: string
): Promise<string | null> {
  // Create the analysis set with user_id
  const { data: set, error: setError } = await supabase
    .from('bet_slips')
    .insert({
      user_id: userId,
      name: name || null,
      total_odds: null,
      stake: null,
      potential_win: null,
      status: 'pending',
      is_verified: false,
    })
    .select('id')
    .single();

  if (setError || !set) {
    console.error('Error creating analysis set:', setError);
    return null;
  }

  // Create the set items
  const setItems = items.map((item) => ({
    slip_id: set.id,
    league: item.league,
    home_team: item.homeTeam,
    away_team: item.awayTeam,
    match_date: item.matchDate,
    prediction_type: item.predictionType,
    prediction_value: item.predictionValue,
    confidence: item.confidence,
    odds: item.odds,
  }));

  const { error: itemsError } = await supabase
    .from('bet_slip_items')
    .insert(setItems);

  if (itemsError) {
    console.error('Error creating analysis set items:', itemsError);
    // Rollback the set
    await supabase.from('bet_slips').delete().eq('id', set.id);
    return null;
  }

  return set.id;
}

export async function getAnalysisSets(limit: number = 20): Promise<AnalysisSet[]> {
  const { data: sets, error } = await supabase
    .from('bet_slips')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching analysis sets:', error);
    return [];
  }

  // Fetch items for each set
  const setsWithItems = await Promise.all(
    (sets || []).map(async (set) => {
      const { data: items } = await supabase
        .from('bet_slip_items')
        .select('*')
        .eq('slip_id', set.id);

      return {
        ...set,
        items: items as AnalysisSetItemRecord[] || [],
      } as AnalysisSet;
    })
  );

  return setsWithItems;
}

export async function getAnalysisSetById(id: string): Promise<AnalysisSet | null> {
  const { data: set, error } = await supabase
    .from('bet_slips')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !set) {
    console.error('Error fetching analysis set:', error);
    return null;
  }

  const { data: items } = await supabase
    .from('bet_slip_items')
    .select('*')
    .eq('slip_id', id);

  return {
    ...set,
    items: items as AnalysisSetItemRecord[] || [],
  } as AnalysisSet;
}

export async function deleteAnalysisSet(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('bet_slips')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting analysis set:', error);
    return false;
  }

  return true;
}

export async function getAnalysisSetStats(userId?: string): Promise<{
  total: number;
  pending: number;
}> {
  let query = supabase.from('bet_slips').select('*');
  
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data: sets, error } = await query;

  if (error || !sets) {
    return { total: 0, pending: 0 };
  }

  const stats = sets.reduce(
    (acc, set) => {
      acc.total++;
      if (set.status === 'pending') {
        acc.pending++;
      }
      return acc;
    },
    { total: 0, pending: 0 }
  );

  return stats;
}

// Backward compatibility aliases
export const saveBetSlip = saveAnalysisSet;
export const getBetSlips = getAnalysisSets;
export const deleteBetSlip = deleteAnalysisSet;
