/**
 * Mirror of the server-side arena_scored_picks SQL. Keep both in sync.
 * Server is authoritative; this is used for UI previews and tests.
 */
export type ResultPick = '1' | 'X' | '2';
export type OUPick = 'O' | 'U' | null;

export interface ArenaPickInput {
  result: ResultPick;
  ou: OUPick;
  joker: boolean;
}

export interface MatchOutcome {
  homeScore: number;
  awayScore: number;
  finished: boolean;
  /** Total pickers on this match */
  totalPickers: number;
  /** Pickers who chose the same result as this pick */
  samePickers: number;
}

export const POINTS = { result: 3, ou: 2, surprise: 2 } as const;

export function actualResult(h: number, a: number): ResultPick {
  return h > a ? '1' : h < a ? '2' : 'X';
}

export function scoreArenaPick(pick: ArenaPickInput, m: MatchOutcome): number {
  if (!m.finished) return 0;
  const resultOk = pick.result === actualResult(m.homeScore, m.awayScore);
  const ouOk = pick.ou !== null && (m.homeScore + m.awayScore > 2.5) === (pick.ou === 'O');
  const surprise = resultOk && m.totalPickers >= 4 && m.samePickers / m.totalPickers < 0.25;
  const base = (resultOk ? POINTS.result : 0) + (ouOk ? POINTS.ou : 0) + (surprise ? POINTS.surprise : 0);
  return base * (pick.joker ? 2 : 1);
}

export function isPickLocked(kickoffIso: string, now: Date = new Date()): boolean {
  return new Date(kickoffIso).getTime() <= now.getTime();
}
