import { describe, it, expect } from 'vitest';
import {
  newState,
  updateStreak,
  useBonusCredit,
  bonusTotals,
  grantRewards,
} from './streakSimulator';

const USER = 'user-1';

const day = (offset: number) => {
  const d = new Date('2026-01-01T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};

describe('Streak rewards — end-to-end scenarios', () => {
  it('T1: first day creates streak=1 and grants no rewards', () => {
    const s = newState();
    const { rec, newly_granted } = updateStreak(s, USER, day(0));
    expect(rec.current_streak).toBe(1);
    expect(newly_granted).toEqual([]);
  });

  it('T2: same-day repeat call is idempotent', () => {
    const s = newState();
    updateStreak(s, USER, day(0));
    const r2 = updateStreak(s, USER, day(0));
    expect(r2.rec.current_streak).toBe(1);
    expect(r2.newly_granted).toEqual([]);
  });

  it('T3: 3-day streak grants +1 bonus_analysis', () => {
    const s = newState();
    let granted: any[] = [];
    for (let i = 0; i < 3; i++) granted = updateStreak(s, USER, day(i)).newly_granted;
    expect(granted).toEqual([{ day: 3, type: 'bonus_analysis', quantity: 1 }]);
    expect(bonusTotals(s, USER).bonus_analysis).toBe(1);
  });

  it('T4: 5-day streak does NOT grant bonus_chat (rule changed)', () => {
    const s = newState();
    for (let i = 0; i < 5; i++) updateStreak(s, USER, day(i));
    expect(bonusTotals(s, USER)).toMatchObject({
      bonus_analysis: 1,
      bonus_chat: 0,
    });
  });

  it('T5: 7-day streak grants exactly 1 bonus_chat', () => {
    const s = newState();
    for (let i = 0; i < 7; i++) updateStreak(s, USER, day(i));
    expect(bonusTotals(s, USER).bonus_chat).toBe(1);
  });

  it('T6: 14-day streak grants badge but no extra chat (still chat=1)', () => {
    const s = newState();
    for (let i = 0; i < 14; i++) updateStreak(s, USER, day(i));
    const t = bonusTotals(s, USER);
    expect(t.has_streak_badge).toBe(true);
    expect(t.bonus_chat).toBe(1);
  });

  it('T7: 30-day streak activates 1-day premium trial', () => {
    const s = newState();
    for (let i = 0; i < 30; i++) updateStreak(s, USER, day(i));
    expect(s.premium.length).toBe(1);
    expect(s.premium[0]).toMatchObject({
      plan_type: 'trial',
      is_active: true,
      platform: 'streak_reward',
    });
  });

  it('T8: idempotency — calling grant twice does not double-grant', () => {
    const s = newState();
    for (let i = 0; i < 5; i++) updateStreak(s, USER, day(i));
    const before = s.rewards.length;
    grantRewards(s, USER);
    grantRewards(s, USER);
    expect(s.rewards.length).toBe(before);
  });

  it('T9: streak freeze allows skipping exactly one day', () => {
    const s = newState();
    updateStreak(s, USER, day(0));
    updateStreak(s, USER, day(1));
    // skip day(2)
    const r = updateStreak(s, USER, day(3));
    expect(r.rec.current_streak).toBe(3);
    expect(r.rec.streak_freeze_used).toBe(true);
  });

  it('T10: missing >2 days resets streak to 1', () => {
    const s = newState();
    for (let i = 0; i < 5; i++) updateStreak(s, USER, day(i));
    const r = updateStreak(s, USER, day(10));
    expect(r.rec.current_streak).toBe(1);
  });

  it('T11: re-earning after a break grants rewards again in new window', () => {
    const s = newState();
    for (let i = 0; i < 5; i++) updateStreak(s, USER, day(i));
    const beforeReset = s.rewards.length;
    updateStreak(s, USER, day(20)); // hard reset
    for (let i = 21; i < 24; i++) updateStreak(s, USER, day(i));
    // New 3-day milestone in new window → +1 reward
    expect(s.rewards.length).toBe(beforeReset + 1);
    expect(s.rewards.at(-1)?.streak_day).toBe(3);
  });

  it('T12: useBonusCredit consumes one credit and returns false when empty', () => {
    const s = newState();
    for (let i = 0; i < 5; i++) updateStreak(s, USER, day(i));
    expect(useBonusCredit(s, USER, 'bonus_analysis')).toBe(true);
    expect(useBonusCredit(s, USER, 'bonus_analysis')).toBe(false);
    expect(bonusTotals(s, USER).bonus_analysis).toBe(0);
  });

  it('T13: bonus_chat credits stack and consume FIFO', () => {
    const s = newState();
    for (let i = 0; i < 7; i++) updateStreak(s, USER, day(i));
    expect(bonusTotals(s, USER).bonus_chat).toBe(3);
    for (let i = 0; i < 3; i++) expect(useBonusCredit(s, USER, 'bonus_chat')).toBe(true);
    expect(useBonusCredit(s, USER, 'bonus_chat')).toBe(false);
  });

  it('T14: longest_streak persists across resets', () => {
    const s = newState();
    for (let i = 0; i < 7; i++) updateStreak(s, USER, day(i));
    updateStreak(s, USER, day(20));
    const rec = s.streaks.get(USER)!;
    expect(rec.longest_streak).toBe(7);
    expect(rec.current_streak).toBe(1);
  });

  it('T15: 30-day milestone is granted exactly once per window', () => {
    const s = newState();
    for (let i = 0; i < 30; i++) updateStreak(s, USER, day(i));
    const trials = s.rewards.filter((r) => r.streak_day === 30);
    expect(trials.length).toBe(1);
    expect(s.premium.length).toBe(1);
  });
});
