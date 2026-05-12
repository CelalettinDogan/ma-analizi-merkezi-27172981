import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TimeSeriesPoint {
  date: string; // YYYY-MM-DD
  total_users: number;
  premium_users: number;
  active_users_24h: number;
  today_chats: number;
  today_analysis: number;
  ai_accuracy: number;
  premium_revenue: number;
}

export interface UserGrowthPoint {
  date: string;
  cumulative: number;
  new_users: number;
}

export type RangeDays = 7 | 14 | 30 | 90;

const buildEmptyDays = (days: number): string[] => {
  const list: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    list.push(d.toISOString().slice(0, 10));
  }
  return list;
};

export const useAnalyticsTimeSeries = (rangeDays: RangeDays = 30) => {
  const [series, setSeries] = useState<TimeSeriesPoint[]>([]);
  const [growth, setGrowth] = useState<UserGrowthPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - (rangeDays - 1));
      const sinceStr = since.toISOString().slice(0, 10);

      // 1) admin_daily_analytics rows
      const { data: rows } = await supabase
        .from('admin_daily_analytics' as any)
        .select(
          'report_date,total_users,premium_users,active_users_24h,today_chats,today_analysis,ai_accuracy,premium_revenue',
        )
        .gte('report_date', sinceStr)
        .order('report_date', { ascending: true });

      const days = buildEmptyDays(rangeDays);
      const byDate = new Map<string, any>();
      (rows || []).forEach((r: any) => byDate.set(r.report_date, r));

      // forward-fill cumulative-style fields, zero-fill counters
      let lastTotal = 0;
      let lastPremium = 0;
      let lastAcc = 0;
      const filled: TimeSeriesPoint[] = days.map((d) => {
        const r = byDate.get(d);
        if (r) {
          lastTotal = r.total_users || lastTotal;
          lastPremium = r.premium_users || lastPremium;
          lastAcc = r.ai_accuracy ?? lastAcc;
        }
        return {
          date: d,
          total_users: r?.total_users ?? lastTotal,
          premium_users: r?.premium_users ?? lastPremium,
          active_users_24h: r?.active_users_24h ?? 0,
          today_chats: r?.today_chats ?? 0,
          today_analysis: r?.today_analysis ?? 0,
          ai_accuracy: r?.ai_accuracy ?? lastAcc,
          premium_revenue: Number(r?.premium_revenue ?? 0),
        };
      });
      setSeries(filled);

      // 2) user growth from profiles.created_at
      const { data: profiles } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', new Date(sinceStr).toISOString())
        .order('created_at', { ascending: true });

      const dailyNew = new Map<string, number>();
      days.forEach((d) => dailyNew.set(d, 0));
      (profiles || []).forEach((p) => {
        const d = new Date(p.created_at).toISOString().slice(0, 10);
        if (dailyNew.has(d)) dailyNew.set(d, (dailyNew.get(d) || 0) + 1);
      });

      // Approximate baseline: count of profiles before window start
      const { count: baseline } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', new Date(sinceStr).toISOString());

      let cum = baseline || 0;
      const growthPoints: UserGrowthPoint[] = days.map((d) => {
        const n = dailyNew.get(d) || 0;
        cum += n;
        return { date: d, cumulative: cum, new_users: n };
      });
      setGrowth(growthPoints);
    } catch (e) {
      console.error('Time series fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [rangeDays]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { series, growth, isLoading, refetch: fetchAll };
};
