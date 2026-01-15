import { supabase } from '@/integrations/supabase/client';
import { BetSlip, BetSlipItem, BetSlipItemRecord } from '@/types/betslip';

export async function saveBetSlip(
  items: BetSlipItem[],
  name?: string
): Promise<string | null> {
  // Create the bet slip without odds (odds not available from API)
  const { data: slip, error: slipError } = await supabase
    .from('bet_slips')
    .insert({
      name: name || null,
      total_odds: null,
      stake: 0,
      potential_win: null,
      status: 'pending',
      is_verified: false,
    })
    .select('id')
    .single();

  if (slipError || !slip) {
    console.error('Error creating bet slip:', slipError);
    return null;
  }

  // Create the slip items
  const slipItems = items.map((item) => ({
    slip_id: slip.id,
    league: item.league,
    home_team: item.homeTeam,
    away_team: item.awayTeam,
    match_date: item.matchDate,
    prediction_type: item.predictionType,
    prediction_value: item.predictionValue,
    confidence: item.confidence,
    odds: item.odds, // Will be null
  }));

  const { error: itemsError } = await supabase
    .from('bet_slip_items')
    .insert(slipItems);

  if (itemsError) {
    console.error('Error creating bet slip items:', itemsError);
    // Rollback the slip
    await supabase.from('bet_slips').delete().eq('id', slip.id);
    return null;
  }

  return slip.id;
}

export async function getBetSlips(limit: number = 20): Promise<BetSlip[]> {
  const { data: slips, error } = await supabase
    .from('bet_slips')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching bet slips:', error);
    return [];
  }

  // Fetch items for each slip
  const slipsWithItems = await Promise.all(
    (slips || []).map(async (slip) => {
      const { data: items } = await supabase
        .from('bet_slip_items')
        .select('*')
        .eq('slip_id', slip.id);

      return {
        ...slip,
        items: items as BetSlipItemRecord[] || [],
      } as BetSlip;
    })
  );

  return slipsWithItems;
}

export async function getBetSlipById(id: string): Promise<BetSlip | null> {
  const { data: slip, error } = await supabase
    .from('bet_slips')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !slip) {
    console.error('Error fetching bet slip:', error);
    return null;
  }

  const { data: items } = await supabase
    .from('bet_slip_items')
    .select('*')
    .eq('slip_id', id);

  return {
    ...slip,
    items: items as BetSlipItemRecord[] || [],
  } as BetSlip;
}

export async function deleteBetSlip(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('bet_slips')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting bet slip:', error);
    return false;
  }

  return true;
}

export async function updateBetSlipStatus(
  id: string,
  status: 'pending' | 'won' | 'lost' | 'partial',
  isVerified: boolean = false
): Promise<boolean> {
  const { error } = await supabase
    .from('bet_slips')
    .update({ status, is_verified: isVerified })
    .eq('id', id);

  if (error) {
    console.error('Error updating bet slip status:', error);
    return false;
  }

  return true;
}

export async function updateBetSlipItemResult(
  itemId: string,
  isCorrect: boolean,
  homeScore: number,
  awayScore: number
): Promise<boolean> {
  const { error } = await supabase
    .from('bet_slip_items')
    .update({
      is_correct: isCorrect,
      home_score: homeScore,
      away_score: awayScore,
    })
    .eq('id', itemId);

  if (error) {
    console.error('Error updating bet slip item:', error);
    return false;
  }

  return true;
}

export async function getBetSlipStats(): Promise<{
  total: number;
  won: number;
  lost: number;
  pending: number;
}> {
  const { data: slips, error } = await supabase
    .from('bet_slips')
    .select('*');

  if (error || !slips) {
    return { total: 0, won: 0, lost: 0, pending: 0 };
  }

  const stats = slips.reduce(
    (acc, slip) => {
      acc.total++;
      
      if (slip.status === 'won') {
        acc.won++;
      } else if (slip.status === 'lost') {
        acc.lost++;
      } else {
        acc.pending++;
      }
      
      return acc;
    },
    { total: 0, won: 0, lost: 0, pending: 0 }
  );

  return stats;
}
