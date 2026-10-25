# Project rules

- Arena scoring, tiers and rewards are computed server-side (`arena_scored_picks`, `arena_tier`, `get_arena_week`); `src/lib/arenaScoring.ts` mirrors them for UI/tests and must be kept in sync — server is authoritative.
- Arena friend leagues are accessed only through security-definer RPCs; tables expose no write policies so membership limits can't be bypassed.
