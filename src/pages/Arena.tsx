import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trophy, Lock, Sparkles, Zap, Share2, Users, Timer, Gift, Crown, Loader2, Flame, Medal, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ArenaLeagues from '@/components/arena/ArenaLeagues';
import AppHeader from '@/components/layout/AppHeader';
import { supabase } from '@/integrations/supabase/client';
import { useAccessLevel } from '@/hooks/useAccessLevel';
import { isPickLocked, ResultPick, OUPick } from '@/lib/arenaScoring';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logEvent } from '@/lib/analytics';
import { maybeRequestReview } from '@/lib/inAppReview';

interface ArenaMatch {
  match_id: number;
  competition_name: string | null;
  home: string; away: string;
  home_crest: string | null; away_crest: string | null;
  utc_date: string; status: string;
  home_score: number | null; away_score: number | null;
  pick: { result: ResultPick; ou: OUPick; joker: boolean } | null;
  points: number | null;
  minute?: string | null;
  dist?: { n: number; '1': number; X: number; '2': number } | null;
}
interface ArenaProfile {
  total: number; tier: 'bronze' | 'silver' | 'gold' | 'diamond'; next: number | null; streak: number;
  last_week: { points: number; rank: number; total: number } | null; badges: string[];
}
const TIER_CLS: Record<string, string> = { bronze: 'text-accent/80 border-accent/30', silver: 'text-muted-foreground border-border', gold: 'text-accent border-accent/60', diamond: 'text-primary border-primary/60' };
const nextTierName = (total: number) => (total >= 90 ? 'diamond' : total >= 30 ? 'gold' : 'silver');
interface ArenaWeek {
  week_start: string; ends_at: string; participants: number;
  reward: { rank: number; bonus_analysis: number; bonus_chat: number } | null;
  rewards?: { week_start: string; rank: number; bonus_analysis: number; bonus_chat: number }[];
  matches: ArenaMatch[];
}
interface LbRow { rank: number; name: string; points: number; correct: number; is_me: boolean }
interface Lb { rows: LbRow[]; me: { rank: number; points: number; total: number } | null }

const useCountdown = (language: string, target?: string) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(i); }, []);
  if (!target) return '';
  const ms = Math.max(0, new Date(target).getTime() - now);
  const d = Math.floor(ms / 86_400_000), h = Math.floor((ms % 86_400_000) / 3_600_000), m = Math.floor((ms % 3_600_000) / 60_000);
  const unit = (value: number, name: 'day' | 'hour' | 'minute') =>
    new Intl.NumberFormat(language, { style: 'unit', unit: name, unitDisplay: 'narrow' }).format(value);
  return d > 0 ? `${unit(d, 'day')} ${unit(h, 'hour')}` : `${unit(h, 'hour')} ${unit(m, 'minute')}`;
};

const Crest = ({ src, name }: { src: string | null; name: string }) =>
  src ? <img src={src} alt={name} className="w-7 h-7 shrink-0 object-contain" loading="lazy" />
      : <div className="w-7 h-7 shrink-0 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">{name.slice(0, 2).toUpperCase()}</div>;

const Arena: React.FC = () => {
  const { t, i18n } = useTranslation('arena');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isPremium, isAdmin } = useAccessLevel();
  const canJoker = isPremium || isAdmin;
  const [tab, setTab] = useState<'play' | 'week' | 'league' | 'all'>('play');
  const [saving, setSaving] = useState<number | null>(null);

  const week = useQuery({
    queryKey: ['arena-week'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_arena_week' as any);
      if (error) throw error;
      return data as unknown as ArenaWeek;
    },
    staleTime: 60_000,
    refetchInterval: (q) => ((q.state.data as ArenaWeek | undefined)?.matches ?? []).some(m => m.status === 'IN_PLAY') ? 60_000 : false,
  });

  const profile = useQuery({
    queryKey: ['arena-profile'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_arena_profile' as any);
      if (error) throw error;
      return data as unknown as ArenaProfile;
    },
    staleTime: 5 * 60_000,
  });

  const lb = useQuery({
    queryKey: ['arena-lb', tab === 'all' ? 'all' : 'week'],
    enabled: tab === 'week' || tab === 'all',
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_arena_leaderboard' as any, { p_scope: tab === 'all' ? 'all' : 'week' });
      if (error) throw error;
      return data as unknown as Lb;
    },
    staleTime: 60_000,
  });

  // Team strength for AI tip (premium) from standings
  const teams = useMemo(() => (week.data?.matches ?? []).flatMap(m => [m.home, m.away]), [week.data]);
  const strength = useQuery({
    queryKey: ['arena-strength', teams.join('|')],
    enabled: canJoker && teams.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('cached_standings').select('team_name, points, played_games').in('team_name', teams);
      const map: Record<string, number> = {};
      (data ?? []).forEach(r => { map[r.team_name] = r.played_games ? (r.points ?? 0) / r.played_games : 1; });
      return map;
    },
  });

  useEffect(() => {
    const rewards = week.data?.rewards ?? (week.data?.reward ? [week.data.reward] : []);
    for (const r of rewards) {
      toast.success(t('rewardWon', { rank: r.rank, analysis: r.bonus_analysis, chat: r.bonus_chat }));
    }
    if (rewards.length > 0) {
      qc.invalidateQueries({ queryKey: ['bonus-credits'] });
      qc.invalidateQueries({ queryKey: ['arena-profile'] });
    }
  }, [week.data?.rewards, week.data?.reward, t, qc]);

  useEffect(() => {
    if ((week.data?.matches ?? []).some(m => m.status === 'FINISHED' && (m.points ?? 0) > 0)) maybeRequestReview('arena_win');
  }, [week.data]);

  const countdown = useCountdown(i18n.language, week.data?.ends_at);

  const submit = async (m: ArenaMatch, patch: Partial<{ result: ResultPick; ou: OUPick; joker: boolean }>) => {
    if (patch.joker && !canJoker) { navigate('/premium?from=arena_joker'); return; }
    const next = { result: m.pick?.result ?? null, ou: m.pick?.ou ?? null, joker: m.pick?.joker ?? false, ...patch };
    if (!next.result) { toast(t('rules')); return; }
    setSaving(m.match_id);
    const { error } = await supabase.rpc('submit_arena_pick' as any, {
      p_match_id: m.match_id, p_result: next.result, p_ou: next.ou, p_joker: next.joker,
    });
    setSaving(null);
    if (error) {
      if (error.message.includes('premium_required')) navigate('/premium?from=arena_joker');
      else toast.error(error.message.includes('locked') ? t('locked') : t('error'));
      return;
    }
    if (navigator.vibrate) navigator.vibrate(10);
    logEvent('arena_pick');
    qc.invalidateQueries({ queryKey: ['arena-week'] });
    qc.invalidateQueries({ queryKey: ['arena-lb'] });
    qc.invalidateQueries({ queryKey: ['arena-profile'] });
  };

  const myPoints = (week.data?.matches ?? []).reduce((s, m) => s + (m.points ?? 0), 0);
  const tenth = lb.data?.rows?.[9]?.points;
  const gap = lb.data?.me && tenth != null && lb.data.me.rank > 10 ? tenth - lb.data.me.points + 1 : null;

  const share = async () => {
    const text = t('shareText', { points: myPoints });
    try { if (navigator.share) await navigator.share({ text, url: 'https://golmetrikapp.lovable.app' }); else { await navigator.clipboard.writeText(text); toast.success(t('share')); } } catch {}
  };

  const fmtTime = (iso: string) => new Date(iso).toLocaleString(i18n.language, { weekday: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="h-screen min-w-0 bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1 min-h-0 min-w-0 overflow-y-auto px-4 pt-2 space-y-4" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-border/40 bg-card p-4">
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase"><Trophy className="w-4 h-4" />{t('title')}</div>
              <h1 className="mt-1 text-lg font-bold text-foreground leading-snug">{t('subtitle')}</h1>
              {profile.data && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                  <span className={cn('flex items-center gap-1 rounded-full border px-2 py-0.5', TIER_CLS[profile.data.tier])}><Medal className="w-3 h-3" />{t(`tier.${profile.data.tier}`)}</span>
                  {profile.data.streak > 0 && <span className="flex items-center gap-1 rounded-full border border-accent/40 px-2 py-0.5 text-accent"><Flame className="w-3 h-3" />{t('streakWeeks', { count: profile.data.streak })}</span>}
                </div>
              )}
              {profile.data?.next != null && (
                <div className="mt-2 w-40 max-w-full">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${Math.min(100, (profile.data.total / profile.data.next) * 100)}%` }} /></div>
                  <p className="mt-1 text-[10px] text-muted-foreground">{t('nextTier', { left: profile.data.next - profile.data.total, tier: t(`tier.${nextTierName(profile.data.total)}`) })}</p>
                </div>
              )}
            </div>
            <div className="text-end shrink-0">
              <div className="text-3xl font-black text-primary tabular-nums">{myPoints}</div>
              <div className="text-[11px] text-muted-foreground">{t('points')}</div>
            </div>
          </div>
          <div className="relative mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Timer className="w-3.5 h-3.5 shrink-0" />{t('endsIn')} {countdown}</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 shrink-0" />{t('participants', { count: week.data?.participants ?? 0 })}</span>
            <Button variant="ghost" size="sm" onClick={share} className="ms-auto flex items-center gap-1 text-primary font-medium min-h-[44px]" aria-label={t('share')}><Share2 className="w-3.5 h-3.5" />{t('share')}</Button>
          </div>
        </section>

        {/* Tabs */}
        <div className="grid grid-cols-2 min-[360px]:grid-cols-4 gap-1 p-1 rounded-xl bg-muted/40">
          {(['play', 'week', 'league', 'all'] as const).map(k => (
            <Button variant="ghost" size="sm" key={k} onClick={() => setTab(k)}
              className={cn('min-w-0 h-12 px-1 py-1 whitespace-normal rounded-lg text-xs leading-tight font-medium transition-colors', tab === k ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
              {t(k === 'play' ? 'tabPlay' : k === 'week' ? 'tabWeek' : k === 'league' ? 'tabLeague' : 'tabAll')}
            </Button>
          ))}
        </div>

        {tab === 'play' && (
          <>
            {week.isLoading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
            {profile.data?.last_week && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-muted-foreground">{t('lastWeek')}</p>
                  <p className="text-sm font-semibold text-foreground">{t('lastWeekText', profile.data.last_week)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { const lastWeek = profile.data?.last_week; if (!lastWeek) return; const text = t('shareText', { points: lastWeek.points }); if (navigator.share) navigator.share({ text, url: 'https://golmetrikapp.lovable.app' }).catch(() => {}); else navigator.clipboard.writeText(text).then(() => toast.success(t('share'))); }}
                  className="text-primary min-h-[44px] px-2" aria-label={t('share')}><Share2 className="w-4 h-4" /></Button>
              </div>
            )}
            {(profile.data?.badges?.length ?? 0) > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {profile.data?.badges.map(b => (
                  <span key={b} className="shrink-0 flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-3 h-8 text-xs font-semibold text-accent"><Medal className="w-3.5 h-3.5" />{t(`badge.${b}`)}</span>
                ))}
              </div>
            )}
            {week.data && week.data.matches.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">{t('empty')}</p>}
            <div className="space-y-3">
              {week.data?.matches.map(m => {
                const locked = isPickLocked(m.utc_date);
                const finished = m.status === 'FINISHED';
                const isLive = m.status === 'IN_PLAY';
                const d = m.dist;
                const s = strength.data;
                const hs = s?.[m.home] ?? 1, as = s?.[m.away] ?? 1;
                const favHome = hs >= as;
                const favPct = Math.round((Math.max(hs, as) / (hs + as || 1)) * 100);
                return (
                  <article key={m.match_id} className={cn('rounded-2xl border bg-card p-3', m.pick?.joker ? 'border-accent/60' : 'border-border/40')}>
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] text-muted-foreground mb-2">
                      <span className="min-w-0 flex-1 break-words">{m.competition_name}</span>
                      <span className="flex max-w-full flex-wrap items-center justify-end gap-1">
                        {isLive && <span className="flex items-center gap-1 text-destructive font-bold"><Radio className="w-3 h-3 animate-pulse" />{t('live')}{m.minute ? ` ${m.minute}'` : ''}</span>}
                        {locked && !finished && !isLive && <Lock className="w-3 h-3" />}
                        {finished || (isLive && m.home_score != null) ? <span className="font-bold text-foreground">{m.home_score}-{m.away_score}</span> : locked ? t('locked') : fmtTime(m.utc_date)}
                        {m.points != null && m.pick && (finished || isLive) && <span className={cn('ml-1 font-bold', m.points > 0 ? 'text-primary' : 'text-muted-foreground')}>+{m.points}{isLive ? ` ${t('livePts')}` : ''}</span>}
                      </span>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 mb-3">
                      <div className="flex flex-col min-[360px]:flex-row items-center gap-2 min-w-0"><Crest src={m.home_crest} name={m.home} /><span className="min-w-0 text-xs font-semibold leading-snug break-words text-center min-[360px]:text-start">{m.home}</span></div>
                      <span className="text-xs text-muted-foreground">vs</span>
                      <div className="flex flex-col-reverse min-[360px]:flex-row items-center gap-2 justify-end min-w-0"><span className="min-w-0 text-xs font-semibold leading-snug break-words text-center min-[360px]:text-end">{m.away}</span><Crest src={m.away_crest} name={m.away} /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['1', 'X', '2'] as ResultPick[]).map(r => (
                        <Button variant="ghost" size="sm" key={r} disabled={locked || saving === m.match_id} onClick={() => submit(m, { result: r })}
                          className={cn('h-11 min-w-0 rounded-xl text-sm font-bold border transition-all active:scale-95 disabled:opacity-60',
                            m.pick?.result === r ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/30 border-border/40 text-foreground')}>{r}</Button>
                      ))}
                    </div>
                    {d && d.n > 0 && (
                      <div className="mt-2">
                        <div className="flex h-1.5 rounded-full overflow-hidden bg-muted" dir="ltr">
                          <div className="bg-primary" style={{ width: `${(d['1'] / d.n) * 100}%` }} />
                          <div className="bg-muted-foreground/50" style={{ width: `${(d.X / d.n) * 100}%` }} />
                          <div className="bg-accent" style={{ width: `${(d['2'] / d.n) * 100}%` }} />
                        </div>
                        <div className="mt-2 text-center text-[11px] leading-snug text-muted-foreground">
                          {t('community')} · {t('picks', { count: d.n })}
                        </div>
                        <div dir="ltr" className="mt-1 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground tabular-nums">
                          <span className="text-start">1 · {Math.round((d['1'] / d.n) * 100)}%</span>
                          <span className="text-center">X · {Math.round((d.X / d.n) * 100)}%</span>
                          <span className="text-end">2 · {Math.round((d['2'] / d.n) * 100)}%</span>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {(['U', 'O'] as const).map(o => (
                        <Button variant="ghost" size="sm" key={o} disabled={locked || saving === m.match_id} onClick={() => submit(m, { ou: m.pick?.ou === o ? null : o })}
                          className={cn('h-11 min-w-0 whitespace-normal rounded-xl text-xs font-semibold border transition-all active:scale-95 disabled:opacity-60',
                            m.pick?.ou === o ? 'bg-primary/15 text-primary border-primary/50' : 'bg-muted/20 border-border/40 text-muted-foreground')}>{t(o === 'O' ? 'over' : 'under')}</Button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 items-stretch gap-2 mt-2">
                      <Button variant="ghost" size="sm" disabled={locked} onClick={() => submit(m, { joker: !m.pick?.joker })}
                        className={cn('min-w-0 min-h-[44px] h-auto px-2 py-2 whitespace-normal rounded-xl text-xs font-semibold border flex items-center justify-center gap-1 disabled:opacity-60',
                          m.pick?.joker ? 'bg-accent/20 border-accent/60 text-accent' : 'border-border/40 text-muted-foreground')}>
                        {canJoker ? <Zap className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}{t('joker')}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => !canJoker && navigate('/premium?from=arena_tip')}
                        className="min-w-0 min-h-[44px] h-auto px-2 py-2 whitespace-normal rounded-xl text-xs font-semibold border border-border/40 flex items-center justify-center gap-1 text-muted-foreground">
                        <Sparkles className="w-3.5 h-3.5 text-accent" />
                        <span className="min-w-0 break-words leading-snug">{canJoker ? `${t('favorite')}: ${(favHome ? m.home : m.away).split(' ')[0]} ${favPct}%` : t('aiTip')}</span>{!canJoker && <Crown className="w-3 h-3 shrink-0 text-accent" />}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="rounded-2xl border border-border/40 bg-card/60 p-3 text-xs text-muted-foreground space-y-1">
              <p>{t('rules')}</p>
              <p className="flex items-start gap-1 text-foreground"><Gift className="w-3.5 h-3.5 shrink-0 text-accent" /><span className="min-w-0">{t('rewardsInfo')}</span></p>
            </div>
            {!canJoker && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/premium?from=arena')} className="w-full min-h-[48px] h-auto px-3 py-2 whitespace-normal rounded-2xl bg-accent/15 border border-accent/40 text-accent text-sm font-semibold flex items-center justify-center gap-2">
                <Crown className="w-4 h-4" />{t('upsell')}
              </Button>
            )}
          </>
        )}

        {tab === 'league' && <ArenaLeagues />}

        {(tab === 'week' || tab === 'all') && (
          <section className="space-y-2">
            {gap != null && gap > 0 && (
              <Button variant="ghost" size="sm" onClick={() => (canJoker ? setTab('play') : navigate('/premium?from=arena_near_top'))}
                className="w-full rounded-xl border border-accent/40 bg-accent/10 p-3 text-xs text-accent text-left">{t('nearTop', { gap })}</Button>
            )}
            {lb.isLoading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
            {lb.data?.rows.map(r => (
              <div key={`${r.rank}-${r.name}`} className={cn('grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border px-3 min-h-[48px] py-2', r.is_me ? 'border-primary/60 bg-primary/10' : 'border-border/40 bg-card')}>
                <span className={cn('text-center font-bold tabular-nums', r.rank <= 3 ? 'text-accent' : 'text-muted-foreground')}>{r.rank}</span>
                <span className="min-w-0 truncate text-sm font-medium">{r.name}</span>
                <span className="text-sm font-bold text-primary tabular-nums">{r.points}</span>
              </div>
            ))}
            <div className="sticky bottom-0 rounded-xl border border-primary/40 bg-card/95 backdrop-blur px-3 py-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t('yourRank')}</span>
              <span className="min-w-0 break-words text-end font-bold text-foreground">{lb.data?.me ? `#${lb.data.me.rank} / ${lb.data.me.total} · ${lb.data.me.points} ${t('points')}` : t('noRank')}</span>
            </div>
          </section>
        )}

        {/* WC archive */}
        <section className="rounded-2xl border border-border/40 bg-card/60 p-3 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-accent shrink-0" />
          <div className="min-w-0"><p className="text-sm font-semibold">{t('wcArchive')}</p><p className="text-xs text-muted-foreground">{t('wcArchiveDesc')}</p></div>
        </section>
      </main>
    </div>
  );
};

export default Arena;
