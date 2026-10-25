import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

const winner = '00000000-0000-0000-0000-000000000001';
const other = '00000000-0000-0000-0000-000000000002';
let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS
      $$ SELECT nullif(current_setting('test.uid', true), '')::uuid $$;
    CREATE TABLE arena_rewards(user_id uuid, week_start date, rank integer, PRIMARY KEY(user_id, week_start));
    CREATE TABLE arena_weeks(week_start date PRIMARY KEY, match_ids integer[]);
    CREATE TABLE arena_picks(user_id uuid, week_start date, match_id integer, result_pick text, ou_pick text, joker boolean);
    CREATE TABLE streak_rewards(user_id uuid, reward_type text, streak_day integer, quantity integer, expires_at timestamptz);
    CREATE TABLE cached_matches(match_id integer, competition_code text, competition_name text,
      home_team_name text, away_team_name text, home_team_crest text, away_team_crest text,
      utc_date timestamptz, status text, home_score integer, away_score integer);
    CREATE TABLE cached_live_matches(match_id integer, status text, minute text, home_score integer, away_score integer, updated_at timestamptz);
    CREATE TABLE fixture_scores(week_start date, user_id uuid, points integer, settled boolean);
    CREATE FUNCTION arena_week_start(integer) RETURNS date LANGUAGE sql AS $$ SELECT '2026-10-19'::date $$;
    CREATE FUNCTION arena_ensure_week(date) RETURNS integer[] LANGUAGE sql AS $$ SELECT '{}'::integer[] $$;
    CREATE FUNCTION arena_scored_picks(p_week date)
      RETURNS TABLE(user_id uuid, match_id integer, points integer, settled boolean)
      LANGUAGE sql AS $$ SELECT user_id, 1, points, settled FROM fixture_scores WHERE week_start=p_week $$;
  `);
  // Execute the shipped PostgreSQL functions, not a JS simulation.
  const migration = readFileSync('drizzle/migrations/0005_retain_pending_arena_rewards.sql', 'utf8');
  await db.exec(migration.slice(0, migration.indexOf('SELECT cron.schedule')));
}, 30_000);

afterAll(async () => { await db.close(); });
beforeEach(async () => {
  await db.exec('TRUNCATE arena_rewards, arena_weeks, fixture_scores, streak_rewards;');
  await db.query("SELECT set_config('test.uid', $1, false)", [winner]);
});

async function seed(week: string, uid = winner, points = 10, settled = true) {
  await db.query('INSERT INTO arena_weeks VALUES ($1, ARRAY[1]) ON CONFLICT DO NOTHING', [week]);
  await db.query('INSERT INTO fixture_scores VALUES ($1,$2,$3,$4)', [week, uid, points, settled]);
}
async function openArena() {
  const { rows } = await db.query<{ value: { rewards: unknown[] } }>('SELECT get_arena_week() AS value');
  return rows[0]?.value;
}

describe('pending Arena rewards (actual PostgreSQL)', () => {
  it('keeps a top-3 reward pending even after a year away', async () => {
    await seed('2025-10-13');
    await db.exec('SELECT arena_save_pending_rewards()');
    const pending = await db.query('SELECT rank, claimed_at FROM arena_rewards');
    expect(pending.rows).toEqual([{ rank: 1, claimed_at: null }]);
    expect((await db.query('SELECT * FROM streak_rewards')).rows).toHaveLength(0);
    expect((await openArena())?.rewards).toHaveLength(1);
    const credits = await db.query<{ quantity: number; valid: boolean }>(
      "SELECT quantity, expires_at > now() + interval '29 days' AS valid FROM streak_rewards WHERE reward_type='bonus_analysis'",
    );
    expect(credits.rows).toEqual([{ quantity: 3, valid: true }]);
  });

  it('collects every missed week rather than only last week', async () => {
    await seed('2026-08-03'); await seed('2026-08-10'); await seed('2026-08-17');
    expect((await openArena())?.rewards).toHaveLength(3);
    expect((await db.query('SELECT * FROM streak_rewards')).rows).toHaveLength(6);
  });

  it('grants each weekly reward only once across repeated opens', async () => {
    await seed('2026-09-07');
    await openArena();
    expect((await openArena())?.rewards).toEqual([]);
    expect((await db.query('SELECT * FROM streak_rewards')).rows).toHaveLength(2);
  });

  it('does not duplicate already-granted rewards from before the change', async () => {
    await seed('2026-09-07');
    await db.query('INSERT INTO arena_rewards(user_id,week_start,rank) VALUES ($1,$2,1)', [winner, '2026-09-07']);
    expect((await openArena())?.rewards).toEqual([]);
    expect((await db.query('SELECT * FROM streak_rewards')).rows).toHaveLength(0);
  });

  it('leaves another winner pending until that account opens Arena', async () => {
    await seed('2026-09-07', winner, 10); await seed('2026-09-07', other, 5);
    await openArena();
    const { rows } = await db.query('SELECT rank, claimed_at FROM arena_rewards WHERE user_id=$1', [other]);
    expect(rows).toEqual([{ rank: 2, claimed_at: null }]);
  });

  it('only saves top-three rewards, preserving the rank-based quantities', async () => {
    for (let i = 1; i <= 4; i++) {
      await seed('2026-09-07', `00000000-0000-0000-0000-00000000000${i}`, 20 - i);
    }
    await db.exec('SELECT arena_save_pending_rewards()');
    expect((await db.query('SELECT rank FROM arena_rewards ORDER BY rank')).rows).toEqual([{ rank: 1 }, { rank: 2 }, { rank: 3 }]);
  });

  it('does not snapshot a week whose scoring is still unsettled', async () => {
    await seed('2026-10-12', winner, 10, false);
    expect((await openArena())?.rewards).toEqual([]);
    expect((await db.query('SELECT * FROM arena_rewards')).rows).toHaveLength(0);
  });

  it('rejects a signed-out claim', async () => {
    await seed('2026-09-07');
    await db.query("SELECT set_config('test.uid', '', false)");
    await expect(openArena()).rejects.toThrow('not authenticated');
    expect((await db.query('SELECT * FROM streak_rewards')).rows).toHaveLength(0);
  });
});