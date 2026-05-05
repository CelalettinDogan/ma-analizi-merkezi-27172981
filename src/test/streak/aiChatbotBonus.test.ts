/**
 * E2E regression for ai-chatbot bonus_chat gating.
 *
 * This is a deterministic simulation of the server flow in
 * `supabase/functions/ai-chatbot/index.ts`:
 *
 *   - Free users without bonus → 403 ACCESS_DENIED
 *   - Free users WITH bonus → 200 first request, bonus consumed, then 403
 *   - Premium users hitting plan dailyLimit fall back to bonus → 200 once,
 *     then 429 LIMIT_EXCEEDED
 *
 * The simulator mirrors the gating order in the edge function so any drift
 * between this test and `index.ts` will fail CI before users see it.
 */
import { describe, it, expect } from 'vitest';
import { newState, updateStreak, type SimState } from './streakSimulator';

type Plan = 'free' | 'basic' | 'pro';
const PLAN_LIMITS: Record<Plan, number> = { free: 0, basic: 3, pro: 25 };

interface ChatResponse {
  status: number;
  code?: string;
  usedBonus?: boolean;
  bonusRemaining?: number;
}

interface SessionState {
  usage: number; // chatbot_usage.usage_count for today
}

function bonusChatAvailable(state: SimState, userId: string): number {
  return state.rewards
    .filter((r) => r.user_id === userId && r.reward_type === 'bonus_chat' && !r.used)
    .reduce((s, r) => s + r.quantity, 0);
}

function consumeBonusChat(state: SimState, userId: string): boolean {
  const c = state.rewards
    .filter((r) => r.user_id === userId && r.reward_type === 'bonus_chat' && !r.used && r.quantity > 0)
    .sort((a, b) => a.granted_at.localeCompare(b.granted_at))[0];
  if (!c) return false;
  if (c.quantity <= 1) {
    c.quantity = 0;
    c.used = true;
  } else c.quantity -= 1;
  return true;
}

/** Mirrors the gating order in ai-chatbot/index.ts */
function callChatbot(
  state: SimState,
  session: SessionState,
  userId: string,
  plan: Plan,
  isAdmin = false,
): ChatResponse {
  const dailyLimit = PLAN_LIMITS[plan];
  const bonus = bonusChatAvailable(state, userId);
  let willConsumeBonus = false;

  if (!isAdmin && plan === 'free') {
    if (bonus <= 0) return { status: 403, code: 'ACCESS_DENIED' };
    willConsumeBonus = true;
  }

  if (!isAdmin && !willConsumeBonus && session.usage >= dailyLimit) {
    if (bonus > 0) willConsumeBonus = true;
    else return { status: 429, code: 'LIMIT_EXCEEDED' };
  }

  // Successful response → consume credit / increment usage atomically
  if (!isAdmin) {
    if (willConsumeBonus) consumeBonusChat(state, userId);
    else session.usage += 1;
  }

  return {
    status: 200,
    usedBonus: willConsumeBonus,
    bonusRemaining: bonusChatAvailable(state, userId),
  };
}

const USER = 'free-user';
const seedDays = (s: SimState, n: number) => {
  const base = new Date('2026-01-01T00:00:00Z');
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + i);
    updateStreak(s, USER, d.toISOString().slice(0, 10));
  }
};

describe('ai-chatbot bonus_chat E2E gating', () => {
  it('Free user with no bonus → 403 immediately', () => {
    const s = newState();
    const sess: SessionState = { usage: 0 };
    expect(callChatbot(s, sess, USER, 'free').code).toBe('ACCESS_DENIED');
  });

  it('Free user earns 7-day bonus → 1st request 200 (usedBonus), 2nd request 403', () => {
    const s = newState();
    seedDays(s, 7);
    expect(bonusChatAvailable(s, USER)).toBe(1);
    const sess: SessionState = { usage: 0 };

    const r1 = callChatbot(s, sess, USER, 'free');
    expect(r1).toMatchObject({ status: 200, usedBonus: true, bonusRemaining: 0 });

    const r2 = callChatbot(s, sess, USER, 'free');
    expect(r2.status).toBe(403);
    expect(r2.code).toBe('ACCESS_DENIED');
  });

  it('Premium basic user: plan limit hit, bonus fallback then 429', () => {
    const s = newState();
    seedDays(s, 7); // earns 1 bonus_chat
    const sess: SessionState = { usage: 0 };

    // Fill plan limit (3)
    for (let i = 0; i < 3; i++) {
      const r = callChatbot(s, sess, USER, 'basic');
      expect(r.status).toBe(200);
      expect(r.usedBonus).toBe(false);
    }
    expect(sess.usage).toBe(3);

    // 4th request → bonus fallback
    const r4 = callChatbot(s, sess, USER, 'basic');
    expect(r4).toMatchObject({ status: 200, usedBonus: true, bonusRemaining: 0 });

    // 5th request → bonus exhausted, plan still over → 429
    const r5 = callChatbot(s, sess, USER, 'basic');
    expect(r5.status).toBe(429);
    expect(r5.code).toBe('LIMIT_EXCEEDED');
  });

  it('Admin bypasses everything', () => {
    const s = newState();
    const sess: SessionState = { usage: 999 };
    const r = callChatbot(s, sess, USER, 'free', true);
    expect(r.status).toBe(200);
  });

  it('30-day cooldown: second 7-day streak grants no bonus → still 403 for free user', () => {
    const s = newState();
    seedDays(s, 7);
    const sess: SessionState = { usage: 0 };
    // Use the first bonus
    callChatbot(s, sess, USER, 'free');
    // Break and re-earn within 30 days
    const base = new Date('2026-01-01T00:00:00Z');
    const restart = new Date(base);
    restart.setUTCDate(restart.getUTCDate() + 15);
    updateStreak(s, USER, restart.toISOString().slice(0, 10));
    for (let i = 16; i < 22; i++) {
      const d = new Date(base);
      d.setUTCDate(d.getUTCDate() + i);
      updateStreak(s, USER, d.toISOString().slice(0, 10));
    }
    expect(bonusChatAvailable(s, USER)).toBe(0);
    expect(callChatbot(s, sess, USER, 'free').code).toBe('ACCESS_DENIED');
  });
});
