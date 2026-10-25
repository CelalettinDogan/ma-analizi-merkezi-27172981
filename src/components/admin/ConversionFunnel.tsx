import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS: { key: string; label: string }[] = [
  { key: 'installs', label: 'Uygulama açan cihaz' },
  { key: 'signups', label: 'Kayıt' },
  { key: 'first_analysis', label: 'İlk analiz' },
  { key: 'day2_return', label: '2+ gün dönen' },
  { key: 'paywall_views', label: 'Premium ekranı gören' },
  { key: 'purchase_start', label: 'Satın almayı başlatan' },
  { key: 'purchases', label: 'Satın alan' },
];

const ConversionFunnel: React.FC = () => {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-funnel', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_conversion_funnel', { p_days: days });
      if (error) throw error;
      return data as Record<string, number>;
    },
  });
  const top = Math.max(1, ...STEPS.map(s => data?.[s.key] ?? 0));

  return (
    <section className="rounded-2xl border border-border/40 bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Dönüşüm hunisi</h3>
        <div className="flex gap-1">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={cn('px-2 h-7 rounded-lg text-xs', d === days ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground')}>{d}g</button>
          ))}
        </div>
      </div>
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /> : (
        <div className="space-y-2">
          {STEPS.map((s, i) => {
            const v = data?.[s.key] ?? 0;
            const prev = i > 0 ? data?.[STEPS[i - 1].key] ?? 0 : null;
            const rate = prev ? Math.round((v / prev) * 100) : null;
            return (
              <div key={s.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-semibold tabular-nums">{v}{rate != null && <span className="text-muted-foreground font-normal"> · %{rate}</span>}</span>
                </div>
                <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(v / top) * 100}%` }} />
                </div>
              </div>
            );
          })}
          <p className="text-[11px] text-muted-foreground pt-1">Cihaz ve adım ölçümü bu sürümle başladı; eski kullanıcılar geriye dönük sayılmaz.</p>
        </div>
      )}
    </section>
  );
};

export default ConversionFunnel;
