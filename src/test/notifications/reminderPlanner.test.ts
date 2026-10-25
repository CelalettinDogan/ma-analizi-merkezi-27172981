import { describe, it, expect } from 'vitest';
import {
  pickFavoriteMatches,
  pickUnpickedArenaMatch,
  reminderTimeFor,
  type ReminderCandidateMatch,
} from '@/lib/reminderPlanner';

const NOW = new Date('2026-10-25T12:00:00.000Z');

const match = (over: Partial<ReminderCandidateMatch> = {}): ReminderCandidateMatch => ({
  match_id: 1,
  home_team_name: 'Galatasaray',
  away_team_name: 'Fenerbahçe',
  utc_date: '2026-10-26T18:00:00.000Z',
  status: 'TIMED',
  ...over,
});

describe('reminderTimeFor', () => {
  it('returns kickoff minus 2 hours when far enough in the future', () => {
    const at = reminderTimeFor('2026-10-26T18:00:00.000Z', NOW);
    expect(at).not.toBeNull();
    expect(at!.toISOString()).toBe('2026-10-26T16:00:00.000Z');
  });

  it('returns null when the reminder would fire in the past', () => {
    // kickoff in 30 minutes -> reminder would be 90 minutes ago
    const soon = new Date('2026-10-25T12:30:00.000Z');
    expect(reminderTimeFor(soon, NOW)).toBeNull();
  });

  it('returns null when the kickoff itself is in the past', () => {
    expect(reminderTimeFor('2026-10-25T10:00:00.000Z', NOW)).toBeNull();
  });
});

describe('pickFavoriteMatches', () => {
  const filter = { ids: ['15'], names: ['Galatasaray'] };

  it('keeps only favourite-team matches inside the 7-day window, sorted by kickoff', () => {
    const matches = [
      match({ match_id: 1, away_team_name: 'Başakşehir', utc_date: '2026-10-26T18:00:00.000Z' }),
      match({ match_id: 2, home_team_name: 'Trabzonspor', utc_date: '2026-10-27T18:00:00.000Z' }), // not a favourite
      match({ match_id: 3, away_team_name: 'Fenerbahçe', utc_date: '2026-11-05T18:00:00.000Z' }), // outside window
      match({ match_id: 4, status: 'FINISHED', utc_date: '2026-10-25T13:00:00.000Z' }), // finished
      match({ match_id: 5, utc_date: '2026-10-26T12:00:00.000Z' }), // earlier kickoff
    ];
    const picked = pickFavoriteMatches(matches, filter, NOW);
    expect(picked.map((m) => m.match_id)).toEqual([5, 1]);
  });

  it('matches favourites by team id as well as by name', () => {
    const matches = [
      match({ match_id: 1, home_team_name: 'Anonim SK', home_team_id: 15 }),
      match({ match_id: 2, home_team_name: 'Anonim SK', home_team_id: 42 }),
    ];
    const picked = pickFavoriteMatches(matches, filter, NOW);
    expect(picked.map((m) => m.match_id)).toEqual([1]);
  });

  it('returns nothing when the user has no favourite teams', () => {
    const empty: typeof filter = { ids: [], names: [] };
    expect(pickFavoriteMatches([match()], empty, NOW)).toEqual([]);
  });
});

describe('pickUnpickedArenaMatch', () => {
  it('returns the earliest upcoming match without a pick', () => {
    const matches = [
      match({ match_id: 2, utc_date: '2026-10-27T18:00:00.000Z' }),
      match({ match_id: 1, utc_date: '2026-10-26T18:00:00.000Z', pick: { result: '1', ou: null, joker: false } }),
      match({ match_id: 3, utc_date: '2026-10-26T20:00:00.000Z' }),
    ];
    expect(pickUnpickedArenaMatch(matches, NOW)?.match_id).toBe(3);
  });

  it('returns null when every upcoming match already has a pick', () => {
    const matches = [match({ pick: { result: 'X', ou: null, joker: false } })];
    expect(pickUnpickedArenaMatch(matches, NOW)).toBeNull();
  });

  it('ignores finished matches', () => {
    const matches = [match({ status: 'FINISHED' })];
    expect(pickUnpickedArenaMatch(matches, NOW)).toBeNull();
  });
});
