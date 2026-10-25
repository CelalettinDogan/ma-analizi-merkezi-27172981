import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Gift, Share2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logEvent } from '@/lib/analytics';

const STORE_URL = 'https://play.google.com/store/apps/details?id=app.lovable.a043c35180f74404bfb04355af0b4d37';

const ReferralCard: React.FC = () => {
  const { t } = useTranslation('rewards');
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ['my-referral'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_referral');
      if (error) throw error;
      return data as { code: string; invited: number; redeemed: boolean };
    },
    staleTime: 5 * 60_000,
  });

  const share = async () => {
    if (!data) return;
    const text = t('referral.shareText', { code: data.code });
    logEvent('referral_share');
    try {
      if (navigator.share) await navigator.share({ text, url: STORE_URL });
      else { await navigator.clipboard.writeText(`${text} ${STORE_URL}`); toast.success(t('referral.copied')); }
    } catch {}
  };

  const redeem = async () => {
    if (!code.trim()) return;
    setBusy(true);
    const { data: res, error } = await supabase.rpc('redeem_referral', { p_code: code });
    setBusy(false);
    const r = res as { ok: boolean; reason?: string } | null;
    if (error || !r?.ok) { toast.error(t(`referral.err_${r?.reason ?? 'invalid'}`)); return; }
    toast.success(t('referral.redeemed'));
    qc.invalidateQueries({ queryKey: ['my-referral'] });
    qc.invalidateQueries({ queryKey: ['bonus-credits'] });
  };

  return (
    <section className="rounded-2xl border border-border/40 bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Gift className="w-5 h-5 text-accent" />
        <div>
          <h3 className="text-sm font-semibold">{t('referral.title')}</h3>
          <p className="text-xs text-muted-foreground">{t('referral.desc')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => data && navigator.clipboard?.writeText(data.code).then(() => toast.success(t('referral.copied')))}
          className="flex-1 h-11 rounded-xl border border-dashed border-primary/50 bg-primary/5 text-primary font-mono font-bold tracking-widest flex items-center justify-center gap-2">
          {data?.code ?? '······'} <Copy className="w-3.5 h-3.5" />
        </button>
        <button onClick={share} className="h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1">
          <Share2 className="w-4 h-4" />{t('referral.share')}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">{t('referral.invited', { count: data?.invited ?? 0 })}</p>
      {data && !data.redeemed && (
        <div className="flex gap-2">
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} placeholder={t('referral.placeholder')}
            className="flex-1 h-10 rounded-xl bg-muted/40 px-3 text-sm uppercase outline-none focus:ring-1 focus:ring-primary" />
          <button disabled={busy} onClick={redeem} className="h-10 px-4 rounded-xl border border-border/60 text-sm font-medium disabled:opacity-60">{t('referral.apply')}</button>
        </div>
      )}
    </section>
  );
};

export default ReferralCard;
