import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Copy, Loader2, LogOut, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface League { id: string; name: string; code: string; is_owner: boolean; members: number }
interface LbRow { rank: number; name: string; points: number; correct: number; is_me: boolean }
interface Lb { rows: LbRow[]; me: { rank: number; points: number; total: number } | null }

const errKey = (msg: string) => ['invalid_code', 'league_full', 'too_many', 'invalid_name'].find(k => msg.includes(k));

const ArenaLeagues: React.FC = () => {
  const { t } = useTranslation('arena');
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [scope, setScope] = useState<'week' | 'all'>('week');

  const leagues = useQuery({
    queryKey: ['arena-leagues'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_arena_leagues' as any);
      if (error) throw error;
      return (data ?? []) as unknown as League[];
    },
  });

  const board = useQuery({
    queryKey: ['arena-league-board', openId, scope],
    enabled: !!openId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_arena_league_board' as any, { p_league: openId, p_scope: scope });
      if (error) throw error;
      return data as unknown as Lb;
    },
  });

  const run = async (fn: () => Promise<{ error: any; data?: any }>, okMsg: string) => {
    setBusy(true);
    const { error, data } = await fn();
    setBusy(false);
    if (error) { const k = errKey(error.message); toast.error(k ? t(`league.err.${k}`) : t('error')); return null; }
    toast.success(okMsg);
    qc.invalidateQueries({ queryKey: ['arena-leagues'] });
    return data;
  };

  const create = async () => {
    const d = await run(() => supabase.rpc('create_arena_league' as any, { p_name: name }) as any, t('league.created'));
    if (d) { setName(''); setOpenId(d.id); }
  };
  const join = async () => {
    const d = await run(() => supabase.rpc('join_arena_league' as any, { p_code: code }) as any, t('league.joined'));
    if (d) { setCode(''); setOpenId(d.id); }
  };
  const leave = async (id: string) => {
    await run(() => supabase.rpc('leave_arena_league' as any, { p_league: id }) as any, t('league.leave'));
    setOpenId(null);
  };
  const share = async (l: League) => {
    const text = t('league.shareText', { name: l.name, code: l.code });
    try {
      if (navigator.share) await navigator.share({ text, url: 'https://golmetrikapp.lovable.app' });
      else { await navigator.clipboard.writeText(text); toast.success(l.code); }
    } catch { /* cancelled */ }
  };

  const open = leagues.data?.find(l => l.id === openId);

  if (open) {
    return (
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <button onClick={() => setOpenId(null)} className="flex items-center gap-1 text-sm text-muted-foreground min-h-[44px]">
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />{t('league.back')}
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => share(open)} className="flex items-center gap-1 text-xs text-primary font-medium min-h-[44px] px-2">
              <Copy className="w-3.5 h-3.5" />{open.code}
            </button>
            <button onClick={() => leave(open.id)} aria-label={t('league.leave')} className="text-muted-foreground min-h-[44px] px-2">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        <h2 className="text-base font-bold text-foreground">{open.name}</h2>
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-muted/40">
          {(['week', 'all'] as const).map(s => (
            <button key={s} onClick={() => setScope(s)} className={cn('h-8 rounded-lg text-xs font-medium', scope === s ? 'bg-card text-foreground' : 'text-muted-foreground')}>
              {t(s === 'week' ? 'tabWeek' : 'tabAll')}
            </button>
          ))}
        </div>
        {board.isLoading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}
        {board.data?.rows.map(r => (
          <div key={`${r.rank}-${r.name}`} className={cn('flex items-center gap-3 rounded-xl border px-3 h-12', r.is_me ? 'border-primary/60 bg-primary/10' : 'border-border/40 bg-card')}>
            <span className={cn('w-6 text-center font-bold tabular-nums', r.rank <= 3 ? 'text-accent' : 'text-muted-foreground')}>{r.rank}</span>
            <span className="flex-1 truncate text-sm font-medium">{r.name}</span>
            <span className="text-sm font-bold text-primary tabular-nums">{r.points}</span>
          </div>
        ))}
        {open.members < 2 && (
          <button onClick={() => share(open)} className="w-full h-11 rounded-xl border border-primary/40 bg-primary/10 text-primary text-sm font-semibold">{t('league.copy')}</button>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-border/40 bg-card p-3 space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground flex items-center gap-1"><Users className="w-4 h-4 text-primary" />{t('league.title')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t('league.desc')}</p>
        </div>
        <div className="flex gap-2">
          <input value={name} onChange={e => setName(e.target.value)} maxLength={32} placeholder={t('league.namePh')}
            className="flex-1 h-11 rounded-xl bg-muted/40 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none select-text" />
          <button disabled={busy || name.trim().length < 2} onClick={create}
            className="h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1 disabled:opacity-50">
            <Plus className="w-4 h-4" />{t('league.create')}
          </button>
        </div>
        <div className="flex gap-2">
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} placeholder={t('league.codePh')}
            className="flex-1 h-11 rounded-xl bg-muted/40 px-3 text-sm tracking-widest text-foreground placeholder:text-muted-foreground placeholder:tracking-normal outline-none select-text" />
          <button disabled={busy || code.trim().length < 6} onClick={join}
            className="h-11 px-4 rounded-xl border border-primary/50 text-primary text-sm font-semibold disabled:opacity-50">{t('league.join')}</button>
        </div>
      </div>
      {leagues.isLoading && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}
      {leagues.data?.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">{t('league.empty')}</p>}
      {leagues.data?.map(l => (
        <button key={l.id} onClick={() => setOpenId(l.id)} className="w-full flex items-center justify-between rounded-xl border border-border/40 bg-card px-3 h-14 text-start">
          <span className="min-w-0">
            <span className="block text-sm font-semibold truncate text-foreground">{l.name}</span>
            <span className="block text-[11px] text-muted-foreground">{t('league.members', { count: l.members })}</span>
          </span>
          <span className="text-xs font-mono text-muted-foreground">{l.code}</span>
        </button>
      ))}
    </section>
  );
};

export default ArenaLeagues;
