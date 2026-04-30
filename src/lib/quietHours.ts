/**
 * Returns true if current local time is in quiet hours (23:00–08:00).
 * Premium promotions should NOT show during quiet hours.
 */
export const isQuietHours = (): boolean => {
  const h = new Date().getHours();
  return h >= 23 || h < 8;
};

const PROMO_CAP_KEY = 'smart_promo_daily_cap';
const PROMO_COOLDOWN_PREFIX = 'smart_promo_cd_';
const MAX_DAILY_PROMOS = 2;
const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours per trigger type

export const canShowPromo = (trigger: string): boolean => {
  if (isQuietHours()) return false;

  // Daily cap
  const today = new Date().toDateString();
  const capData = localStorage.getItem(PROMO_CAP_KEY);
  if (capData) {
    try {
      const parsed = JSON.parse(capData);
      if (parsed.date === today && parsed.count >= MAX_DAILY_PROMOS) return false;
    } catch {}
  }

  // Per-trigger cooldown
  const cdKey = PROMO_COOLDOWN_PREFIX + trigger;
  const lastShown = localStorage.getItem(cdKey);
  if (lastShown && Date.now() - parseInt(lastShown, 10) < COOLDOWN_MS) return false;

  return true;
};

export const recordPromoShown = (trigger: string): void => {
  const today = new Date().toDateString();
  const cdKey = PROMO_COOLDOWN_PREFIX + trigger;
  localStorage.setItem(cdKey, Date.now().toString());

  const capData = localStorage.getItem(PROMO_CAP_KEY);
  let count = 1;
  if (capData) {
    try {
      const parsed = JSON.parse(capData);
      if (parsed.date === today) count = parsed.count + 1;
    } catch {}
  }
  localStorage.setItem(PROMO_CAP_KEY, JSON.stringify({ date: today, count }));
};
