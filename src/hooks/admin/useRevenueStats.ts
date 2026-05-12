import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PLAN_PRICES } from '@/constants/accessLevels';

export interface RevenueKpis {
  mrr: number;
  arpu: number;
  activeSubs: number;
  trialSubs: number;
  churn30d: number; // %
  cancelled30d: number;
  newSubs30d: number;
}

export interface PlanBreakdown {
  planType: string;
  count: number;
  mrr: number;
}

export interface RevenueFlowPoint {
  date: string;
  new: number;
  cancelled: number;
}

export interface RecentSub {
  id: string;
  user_id: string;
  plan_type: string;
  platform: string | null;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  auto_renewing: boolean | null;
  acknowledged: boolean | null;
  product_id: string | null;
}

const PRICE: Record<string, number> = {
  premium_basic: PLAN_PRICES.premium_basic.monthly,
  premium_plus: PLAN_PRICES.premium_plus.monthly,
  premium_pro: PLAN_PRICES.premium_pro.monthly,
};

const buildDays = (n: number) => {
  const out: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
};

export const useRevenueStats = () => {
  const [kpis, setKpis] = useState<RevenueKpis | null>(null);
  const [breakdown, setBreakdown] = useState<PlanBreakdown[]>([]);
  const [flow, setFlow] = useState<RevenueFlowPoint[]>([]);
  const [recent, setRecent] = useState<RecentSub[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const nowIso = new Date().toISOString();
      const since30 = new Date(Date.now() - 30 * 86400000).toISOString();

      // Active subs
      const { data: active } = await supabase
        .from('premium_subscriptions')
        .select('plan_type, user_id, expires_at')
        .eq('is_active', true)
        .gt('expires_at', nowIso);

      // 30d new
      const { data: new30 } = await supabase
        .from('premium_subscriptions')
        .select('id, plan_type, starts_at')
        .gte('starts_at', since30);

      // 30d expired/cancelled (active=false OR expires in past within window)
      const { data: cancelled } = await supabase
        .from('premium_subscriptions')
        .select('id, expires_at, updated_at, is_active')
        .or(`is_active.eq.false,and(expires_at.gte.${since30},expires_at.lt.${nowIso})`)
        .gte('updated_at', since30);

      // Recent transactions
      const { data: recentRows } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .order('starts_at', { ascending: false })
        .limit(50);

      const counts: Record<string, number> = {};
      const uniqueUsers = new Set<string>();
      let mrr = 0;
      let trial = 0;
      (active || []).forEach((s: any) => {
        counts[s.plan_type] = (counts[s.plan_type] || 0) + 1;
        uniqueUsers.add(s.user_id);
        if (s.plan_type === 'trial') trial += 1;
        else mrr += PRICE[s.plan_type] || 0;
      });

      const planBreakdown: PlanBreakdown[] = Object.entries(counts)
        .filter(([k]) => k !== 'trial')
        .map(([planType, count]) => ({
          planType,
          count,
          mrr: count * (PRICE[planType] || 0),
        }))
        .sort((a, b) => b.mrr - a.mrr);

      const activeSubs = (active || []).length - trial;
      const arpu = activeSubs > 0 ? mrr / activeSubs : 0;
      const newSubs30d = (new30 || []).filter((s: any) => s.plan_type !== 'trial').length;
      const cancelled30d = (cancelled || []).length;
      const churn30d =
        activeSubs + cancelled30d > 0
          ? (cancelled30d / (activeSubs + cancelled30d)) * 100
          : 0;

      setKpis({
        mrr,
        arpu,
        activeSubs,
        trialSubs: trial,
        churn30d,
        cancelled30d,
        newSubs30d,
      });
      setBreakdown(planBreakdown);

      // Flow (30 days)
      const days = buildDays(30);
      const newMap = new Map<string, number>(days.map((d) => [d, 0]));
      const cancelMap = new Map<string, number>(days.map((d) => [d, 0]));
      (new30 || []).forEach((s: any) => {
        const d = new Date(s.starts_at).toISOString().slice(0, 10);
        if (newMap.has(d)) newMap.set(d, (newMap.get(d) || 0) + 1);
      });
      (cancelled || []).forEach((s: any) => {
        const d = new Date(s.updated_at || s.expires_at).toISOString().slice(0, 10);
        if (cancelMap.has(d)) cancelMap.set(d, (cancelMap.get(d) || 0) + 1);
      });
      setFlow(
        days.map((d) => ({
          date: d,
          new: newMap.get(d) || 0,
          cancelled: cancelMap.get(d) || 0,
        })),
      );

      setRecent((recentRows || []) as RecentSub[]);
    } catch (e) {
      console.error('Revenue stats error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { kpis, breakdown, flow, recent, isLoading, refetch: fetchAll };
};
