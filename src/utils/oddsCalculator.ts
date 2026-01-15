// Real odds are not available from Football-Data.org free tier
// Odds Add-On requires paid subscription (15€/month)
// This system works WITHOUT odds - predictions are shown without odds values

export function calculateTotalOdds(items: { odds?: number | null }[]): number | null {
  const itemsWithOdds = items.filter(item => item.odds != null && item.odds > 0);
  if (itemsWithOdds.length === 0) return null;
  if (itemsWithOdds.length !== items.length) return null; // Some items don't have odds
  
  const total = itemsWithOdds.reduce((acc, item) => acc * (item.odds || 1), 1);
  return Math.round(total * 100) / 100;
}

export function calculatePotentialWin(totalOdds: number | null, stake: number): number | null {
  if (totalOdds === null) return null;
  return Math.round(totalOdds * stake * 100) / 100;
}

export function formatOdds(odds: number | null | undefined): string {
  if (odds == null) return '-';
  return odds.toFixed(2);
}

export function formatCurrency(amount: number | null): string {
  if (amount === null) return '-';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
