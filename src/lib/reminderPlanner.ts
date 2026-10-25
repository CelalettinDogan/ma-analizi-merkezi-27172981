/**
 * Pure helpers that decide which one-off local notifications should be
 * scheduled (favourite-team match-day reminders and Arena pick reminders).
 * Server data is only read; nothing here mutates state.
 */

export interface ReminderCandidateMatch {
  match_id: number;
  home_team_name: string;
  away_team_name: string;
  utc_date: string;
  status: string;
}

export interface FavoriteTeamFilter {
  /** favorite_id values as strings (may match home_team_id/away_team_id) */
  ids: string[];
  /** favorite_name values (may match team names) */
  names: string[];
}

/** A match is eligible when its kickoff is more than 10 minutes in the future. */
const isUpcoming = (kickoffIso: string, now: Date, minLeadMinutes = 10): boolean =>
  new Date(kickoffIso).getTime() - now.getTime() > minLeadMinutes * 60_000;

const matchesFavorite = (
  m: ReminderCandidateMatch & { home_team_id?: number | null; away_team_id?: number | null },
  filter: FavoriteTeamFilter,
): boolean => {
  const homeId = m.home_team_id != null ? String(m.home_team_id) : null;
  const awayId = m.away_team_id != null ? String(m.away_team_id) : null;
  const idHit = (homeId != null && filter.ids.includes(homeId)) || (awayId != null && filter.ids.includes(awayId));
  const nameHit = filter.names.includes(m.home_team_name) || filter.names.includes(m.away_team_name);
  return idHit || nameHit;
};

/**
 * Favourite-team matches within `windowDays`, sorted by kickoff.
 * Scheduling caps the count itself (e.g. first 3).
 */
export function pickFavoriteMatches(
  matches: (ReminderCandidateMatch & { home_team_id?: number | null; away_team_id?: number | null })[],
  filter: FavoriteTeamFilter,
  now: Date,
  windowDays = 7,
): ReminderCandidateMatch[] {
  const end = now.getTime() + windowDays * 86_400_000;
  return matches
    .filter((m) => {
      const kickoff = new Date(m.utc_date).getTime();
      return (
        (m.status === 'TIMED' || m.status === 'SCHEDULED') &&
        kickoff > now.getTime() &&
        kickoff <= end &&
        matchesFavorite(m, filter)
      );
    })
    .sort((a, b) => new Date(a.utc_date).getTime() - new Date(b.utc_date).getTime());
}

/**
 * First upcoming Arena match (within windowDays) the user has not picked yet.
 * Accepts the get_arena_week match shape (`home`/`away`, `pick`) as well.
 */
export function pickUnpickedArenaMatch(
  matches: (ReminderCandidateMatch & { home?: string; away?: string; pick?: unknown })[],
  now: Date,
  windowDays = 7,
): (ReminderCandidateMatch & { home?: string; away?: string; pick?: unknown }) | null {
  const end = now.getTime() + windowDays * 86_400_000;
  const upcoming = matches
    .filter((m) => {
      const kickoff = new Date(m.utc_date).getTime();
      return (
        (m.status === 'TIMED' || m.status === 'SCHEDULED') &&
        !m.pick &&
        kickoff > now.getTime() &&
        kickoff <= end
      );
    })
    .sort((a, b) => new Date(a.utc_date).getTime() - new Date(b.utc_date).getTime());
  return upcoming[0] ?? null;
}

/**
 * Notification time for a kickoff: `leadMinutes` before kickoff (device-local
 * Date). Returns null when the reminder would fire too soon (or in the past).
 */
export function reminderTimeFor(
  kickoff: string | Date,
  now: Date,
  leadMinutes = 120,
  minLeadMinutes = 10,
): Date | null {
  const at = new Date(new Date(kickoff).getTime() - leadMinutes * 60_000);
  if (at.getTime() - now.getTime() <= minLeadMinutes * 60_000) return null;
  return at;
}
