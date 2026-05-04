/**
 * Pure TypeScript simulator that mirrors the server-side streak logic in
 * `update_user_streak` and `grant_streak_reward_for_user` Postgres functions.
 *
 * This lets us lock down expected behavior in CI without a live DB.
 * If the SQL functions change, update this simulator to match — the tests
 * will then enforce parity across all milestone scenarios.
 */

export type RewardType =
  | 'bonus_analysis'
  | 'bonus_chat'
  | 'badge'
  | 'premium_trial';

export interface StreakRewardRow {
  user_id: string;
  reward_type: RewardType;
  streak_day: number;
  quantity: number;
  granted_at: string; // ISO date
  used: boolean;
  expires_at: string | null;
}

export interface UserStreakRow {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null; // YYYY-MM-DD
  streak_freeze_used: boolean;
}

export interface PremiumSubRow {
  user_id: string;
  plan_type: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  platform: string;
}

export interface SimState {
  streaks: Map<string, UserStreakRow>;
  rewards: StreakRewardRow[];
  premium: PremiumSubRow[];
}

export const newState = (): SimState => ({
  streaks: new Map(),
  rewards: [],
  premium: [],
});

const MILESTONES = [3, 5, 7, 14, 30] as const;

const addDays = (iso: string, days: number): string => {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const diffDays = (a: string, b: string): number => {
  const da = new Date(a + 'T00:00:00Z').getTime();
  const db = new Date(b + 'T00:00:00Z').getTime();
  return Math.round((da - db) / 86_400_000);
};

export interface GrantedReward {
  day: number;
  type: string;
  quantity: number;
}

/** Mirrors public.grant_streak_reward_for_user(p_user_id) */
export function grantRewards(state: SimState, userId: string): GrantedReward[] {
  const rec = state.streaks.get(userId);
  if (!rec || rec.current_streak < 3 || !rec.last_activity_date) return [];
  const streakStart = addDays(rec.last_activity_date, -(rec.current_streak - 1));
  const granted: GrantedReward[] = [];

  for (const milestone of MILESTONES) {
    if (rec.current_streak < milestone) continue;
    const already = state.rewards.some(
      (r) =>
        r.user_id === userId &&
        r.streak_day === milestone &&
        r.granted_at >= streakStart,
    );
    if (already) continue;

    const now = rec.last_activity_date; // simulate granted_at = today
    switch (milestone) {
      case 3:
        state.rewards.push({
          user_id: userId,
          reward_type: 'bonus_analysis',
          streak_day: 3,
          quantity: 1,
          granted_at: now,
          used: false,
          expires_at: null,
        });
        granted.push({ day: 3, type: 'bonus_analysis', quantity: 1 });
        break;
      case 5:
        state.rewards.push({
          user_id: userId,
          reward_type: 'bonus_chat',
          streak_day: 5,
          quantity: 1,
          granted_at: now,
          used: false,
          expires_at: null,
        });
        granted.push({ day: 5, type: 'bonus_chat', quantity: 1 });
        break;
      case 7:
        state.rewards.push({
          user_id: userId,
          reward_type: 'bonus_chat',
          streak_day: 7,
          quantity: 2,
          granted_at: now,
          used: false,
          expires_at: null,
        });
        granted.push({ day: 7, type: 'bonus_chat', quantity: 2 });
        break;
      case 14:
        state.rewards.push({
          user_id: userId,
          reward_type: 'bonus_chat',
          streak_day: 14,
          quantity: 3,
          granted_at: now,
          used: false,
          expires_at: null,
        });
        state.rewards.push({
          user_id: userId,
          reward_type: 'badge',
          streak_day: 14,
          quantity: 1,
          granted_at: now,
          used: false,
          expires_at: null,
        });
        granted.push({ day: 14, type: 'bonus_chat+badge', quantity: 3 });
        break;
      case 30: {
        state.rewards.push({
          user_id: userId,
          reward_type: 'premium_trial',
          streak_day: 30,
          quantity: 1,
          granted_at: now,
          used: false,
          expires_at: null,
        });
        const startsAt = new Date(now + 'T00:00:00Z');
        const expires = new Date(startsAt);
        expires.setUTCDate(expires.getUTCDate() + 1);
        state.premium.push({
          user_id: userId,
          plan_type: 'trial',
          starts_at: startsAt.toISOString(),
          expires_at: expires.toISOString(),
          is_active: true,
          platform: 'streak_reward',
        });
        granted.push({ day: 30, type: 'premium_trial', quantity: 1 });
        break;
      }
    }
  }
  return granted;
}

/** Mirrors public.update_user_streak() — `today` is supplied for determinism */
export function updateStreak(
  state: SimState,
  userId: string,
  today: string,
): { rec: UserStreakRow; newly_granted: GrantedReward[] } {
  let rec = state.streaks.get(userId);

  if (!rec) {
    rec = {
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
      streak_freeze_used: false,
    };
    state.streaks.set(userId, rec);
  } else if (rec.last_activity_date === today) {
    // no-op
  } else if (rec.last_activity_date && diffDays(today, rec.last_activity_date) === 1) {
    rec.current_streak += 1;
    rec.longest_streak = Math.max(rec.longest_streak, rec.current_streak);
    rec.last_activity_date = today;
    rec.streak_freeze_used = false;
  } else if (
    rec.last_activity_date &&
    diffDays(today, rec.last_activity_date) === 2 &&
    !rec.streak_freeze_used
  ) {
    rec.current_streak += 1;
    rec.longest_streak = Math.max(rec.longest_streak, rec.current_streak);
    rec.last_activity_date = today;
    rec.streak_freeze_used = true;
  } else {
    rec.current_streak = 1;
    rec.last_activity_date = today;
    rec.streak_freeze_used = false;
  }

  const newly_granted = grantRewards(state, userId);
  return { rec, newly_granted };
}

/** Mirrors public.use_bonus_credit(credit_type) */
export function useBonusCredit(
  state: SimState,
  userId: string,
  type: 'bonus_analysis' | 'bonus_chat',
): boolean {
  const candidate = state.rewards
    .filter(
      (r) =>
        r.user_id === userId &&
        r.reward_type === type &&
        !r.used &&
        r.quantity > 0,
    )
    .sort((a, b) => a.granted_at.localeCompare(b.granted_at))[0];
  if (!candidate) return false;
  if (candidate.quantity <= 1) {
    candidate.quantity = 0;
    candidate.used = true;
  } else {
    candidate.quantity -= 1;
  }
  return true;
}

export function bonusTotals(state: SimState, userId: string) {
  const sum = (t: RewardType) =>
    state.rewards
      .filter((r) => r.user_id === userId && r.reward_type === t && !r.used)
      .reduce((acc, r) => acc + r.quantity, 0);
  return {
    bonus_analysis: sum('bonus_analysis'),
    bonus_chat: sum('bonus_chat'),
    has_streak_badge: state.rewards.some(
      (r) => r.user_id === userId && r.reward_type === 'badge' && r.streak_day >= 14,
    ),
  };
}
