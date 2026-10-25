# Project rules

- Arena scoring, tiers and rewards are computed server-side (`arena_scored_picks`, `arena_tier`, `get_arena_week`); `src/lib/arenaScoring.ts` mirrors them for UI/tests and must be kept in sync — server is authoritative.
- Arena friend leagues are accessed only through security-definer RPCs; tables expose no write policies so membership limits can't be bypassed.
- Matches referenced by arena_weeks must never be deleted by cache cleanup; Arena scores and rewards are recomputed from them.
- Arena rewards use a server-side pending ledger: an hourly settlement job snapshots historical winners, and get_arena_week atomically claims all pending weeks under an account lock; existing rows are already claimed to prevent duplicate credits.
