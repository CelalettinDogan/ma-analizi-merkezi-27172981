import { describe, it, expect } from 'vitest';
import { scoreArenaPick, isPickLocked } from '@/lib/arenaScoring';

const fin = (h: number, a: number, total = 10, same = 5) => ({ homeScore: h, awayScore: a, finished: true, totalPickers: total, samePickers: same });

describe('arena scoring', () => {
  it('correct result gives 3 points', () => {
    expect(scoreArenaPick({ result: '1', ou: null, joker: false }, fin(2, 0))).toBe(3);
  });
  it('correct over/under gives 2 points', () => {
    expect(scoreArenaPick({ result: '2', ou: 'O', joker: false }, fin(2, 1))).toBe(2);
  });
  it('both correct gives 5 points', () => {
    expect(scoreArenaPick({ result: 'X', ou: 'U', joker: false }, fin(1, 1))).toBe(5);
  });
  it('rarely picked correct result adds +2 surprise bonus', () => {
    expect(scoreArenaPick({ result: '2', ou: null, joker: false }, fin(0, 1, 10, 2))).toBe(5);
  });
  it('no surprise bonus with fewer than 4 pickers', () => {
    expect(scoreArenaPick({ result: '2', ou: null, joker: false }, fin(0, 1, 3, 0))).toBe(3);
  });
  it('joker doubles the points', () => {
    expect(scoreArenaPick({ result: '1', ou: 'O', joker: true }, fin(3, 1))).toBe(10);
  });
  it('unfinished match gives 0', () => {
    expect(scoreArenaPick({ result: '1', ou: 'O', joker: true }, { ...fin(3, 1), finished: false })).toBe(0);
  });
  it('pick locks at kickoff', () => {
    const now = new Date('2026-10-25T12:00:00Z');
    expect(isPickLocked('2026-10-25T12:00:00Z', now)).toBe(true);
    expect(isPickLocked('2026-10-25T12:01:00Z', now)).toBe(false);
  });
});
