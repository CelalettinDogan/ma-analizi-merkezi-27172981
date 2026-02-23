import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PLAN_PRICES } from '@/constants/accessLevels';

interface DashboardData {
  totalUsers: number;
  premiumUsers: number;
  premiumRate: number;
  todayChats: number;
  todayAnalysis: number;
  aiAccuracy: number;
  liveMatches: number;
  activeUsers24h: number;
  lastUpdated: string | null;
}

interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastSignIn: string | null;
  isPremium: boolean;
  planType: string | null;
  roles: string[];
  chatUsageToday: number;
  analysisUsageToday: number;
  isBanned: boolean;
}

interface PlanStats {
  planType: string;
  count: number;
  revenue: number;
}

interface PredictionStats {
  type: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface LeagueStats {
  league: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  targetAudience: string;
  sentAt: string | null;
  deliveredCount: number;
  openedCount: number;
}

interface LogEntry {
  id: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, any> | null;
  createdAt: string;
}

export const useAdminData = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Dashboard
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // Users
  const [users, setUsers] = useState<User[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const pageSize = 20;

  // Premium
  const [planStats, setPlanStats] = useState<PlanStats[]>([]);

  // AI
  const [predictionStats, setPredictionStats] = useState<PredictionStats[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tokenCount, setTokenCount] = useState(0);

  // Activity Logs
  const [activityLogs, setActivityLogs] = useState<LogEntry[]>([]);

  // League Stats
  const [leagueStats, setLeagueStats] = useState<LeagueStats[]>([]);

  // ========== ANALYTICS-BASED FETCHERS ==========

  // Fetch dashboard from admin_daily_analytics (cached) with live fallback
  const fetchDashboard = useCallback(async () => {
    try {
      // Try cached analytics first
      const { data: analytics } = await supabase
        .from('admin_daily_analytics' as any)
        .select('*')
        .order('report_date', { ascending: false })
        .limit(1)
        .single();

      if (analytics) {
        const a = analytics as any;
        setDashboardData({
          totalUsers: a.total_users,
          premiumUsers: a.premium_users,
          premiumRate: a.premium_rate,
          todayChats: a.today_chats,
          todayAnalysis: a.today_analysis,
          aiAccuracy: a.ai_accuracy,
          liveMatches: a.live_matches,
          activeUsers24h: a.active_users_24h,
          lastUpdated: a.created_at,
        });
        return;
      }

      // Fallback to live calculation
      await fetchDashboardLive();
    } catch (e) {
      console.error('Dashboard fetch error, falling back to live:', e);
      await fetchDashboardLive();
    }
  }, []);

  // Live fallback for dashboard
  const fetchDashboardLive = useCallback(async () => {
    try {
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { data: premiumData } = await supabase
        .from('premium_subscriptions')
        .select('plan_type, user_id')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      const premiumUsers = premiumData?.length || 0;

      const today = new Date().toISOString().split('T')[0];
      const { data: chatData } = await supabase
        .from('chatbot_usage')
        .select('usage_count')
        .eq('usage_date', today);
      const todayChats = chatData?.reduce((sum, r) => sum + r.usage_count, 0) || 0;

      const { data: analysisData } = await supabase
        .from('analysis_usage')
        .select('usage_count')
        .eq('usage_date', today);
      const todayAnalysis = analysisData?.reduce((sum, r) => sum + r.usage_count, 0) || 0;

      const { data: mlStats } = await supabase
        .from('ml_model_stats')
        .select('accuracy_percentage')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      const { count: liveMatches } = await supabase
        .from('cached_live_matches')
        .select('*', { count: 'exact', head: true });

      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: activeData } = await supabase
        .from('chatbot_usage')
        .select('user_id')
        .gte('last_used_at', yesterday);
      const activeUsers24h = new Set(activeData?.map(r => r.user_id)).size;

      setDashboardData({
        totalUsers: totalUsers || 0,
        premiumUsers,
        premiumRate: totalUsers ? (premiumUsers / totalUsers) * 100 : 0,
        todayChats,
        todayAnalysis,
        aiAccuracy: mlStats?.accuracy_percentage || 0,
        liveMatches: liveMatches || 0,
        activeUsers24h,
        lastUpdated: null,
      });
    } catch (e) {
      console.error('Dashboard live fetch error:', e);
    }
  }, []);

  // Fetch league stats from analytics or fallback
  const fetchLeagueStats = useCallback(async () => {
    try {
      // Try cached
      const { data: analytics } = await supabase
        .from('admin_daily_analytics' as any)
        .select('league_stats')
        .order('report_date', { ascending: false })
        .limit(1)
        .single();

      if (analytics && (analytics as any).league_stats) {
        setLeagueStats((analytics as any).league_stats as LeagueStats[]);
        return;
      }

      // Fallback
      await fetchLeagueStatsLive();
    } catch {
      await fetchLeagueStatsLive();
    }
  }, []);

  const fetchLeagueStatsLive = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('predictions')
        .select('league, is_correct')
        .eq('is_primary', true)
        .not('is_correct', 'is', null);

      if (data) {
        const grouped: Record<string, { total: number; correct: number }> = {};
        data.forEach(row => {
          if (!grouped[row.league]) grouped[row.league] = { total: 0, correct: 0 };
          grouped[row.league].total++;
          if (row.is_correct) grouped[row.league].correct++;
        });

        const stats: LeagueStats[] = Object.entries(grouped)
          .map(([league, { total, correct }]) => ({
            league,
            total,
            correct,
            accuracy: total > 0 ? (correct / total) * 100 : 0,
          }))
          .sort((a, b) => b.total - a.total);

        setLeagueStats(stats);
      }
    } catch (e) {
      console.error('League stats live fetch error:', e);
    }
  }, []);

  // Fetch plan stats from analytics or fallback
  const fetchPlanStats = useCallback(async () => {
    try {
      const { data: analytics } = await supabase
        .from('admin_daily_analytics' as any)
        .select('premium_by_plan, premium_revenue')
        .order('report_date', { ascending: false })
        .limit(1)
        .single();

      if (analytics && (analytics as any).premium_by_plan) {
        const byPlan = (analytics as any).premium_by_plan as Record<string, number>;
        const priceMap: Record<string, number> = {
          premium_basic: PLAN_PRICES.premium_basic.monthly,
          premium_plus: PLAN_PRICES.premium_plus.monthly,
          premium_pro: PLAN_PRICES.premium_pro.monthly,
        };

        const stats: PlanStats[] = Object.entries(byPlan).map(([planType, count]) => ({
          planType,
          count,
          revenue: count * (priceMap[planType] || 0),
        }));

        setPlanStats(stats);
        return;
      }

      await fetchPlanStatsLive();
    } catch {
      await fetchPlanStatsLive();
    }
  }, []);

  const fetchPlanStatsLive = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('premium_subscriptions')
        .select('plan_type')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      const counts: Record<string, number> = {};
      data?.forEach(sub => {
        counts[sub.plan_type] = (counts[sub.plan_type] || 0) + 1;
      });

      const priceMap: Record<string, number> = {
        premium_basic: PLAN_PRICES.premium_basic.monthly,
        premium_plus: PLAN_PRICES.premium_plus.monthly,
        premium_pro: PLAN_PRICES.premium_pro.monthly,
      };

      const stats: PlanStats[] = Object.entries(counts).map(([planType, count]) => ({
        planType,
        count,
        revenue: count * (priceMap[planType] || 0),
      }));

      setPlanStats(stats);
    } catch (e) {
      console.error('Plan stats live fetch error:', e);
    }
  }, []);

  // Trigger edge function to refresh analytics now
  const triggerAnalyticsRefresh = useCallback(async () => {
    try {
      toast.info('Analytics hesaplanıyor...');
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/compute-admin-analytics`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
        }
      );

      if (!response.ok) throw new Error('Analytics hesaplama başarısız');

      toast.success('Analytics güncellendi');
      // Re-fetch from cache
      await Promise.all([fetchDashboard(), fetchLeagueStats(), fetchPlanStats()]);
    } catch (e) {
      console.error('Analytics refresh error:', e);
      toast.error('Analytics güncellenemedi');
    }
  }, [fetchDashboard, fetchLeagueStats, fetchPlanStats]);

  // ========== NON-CACHED FETCHERS (unchanged) ==========

  // Fetch users via edge function (gets real emails from auth.users)
  const fetchUsers = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return;

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/admin-users?page=${usersPage}&pageSize=${pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('Admin users fetch failed:', response.status);
        return;
      }

      const result = await response.json();
      setUsers(result.users || []);
      setUsersCount(result.totalCount || 0);
    } catch (e) {
      console.error('Users fetch error:', e);
    }
  }, [usersPage]);

  // Fetch prediction stats
  const fetchPredictionStats = useCallback(async () => {
    try {
      // Try cached first
      const { data: analytics } = await supabase
        .from('admin_daily_analytics' as any)
        .select('prediction_stats')
        .order('report_date', { ascending: false })
        .limit(1)
        .single();

      if (analytics && (analytics as any).prediction_stats) {
        setPredictionStats((analytics as any).prediction_stats as PredictionStats[]);
        return;
      }

      // Fallback
      const { data } = await supabase
        .from('prediction_stats')
        .select('*');

      if (data) {
        const stats: PredictionStats[] = data.map(row => ({
          type: row.prediction_type || 'Unknown',
          total: row.total_predictions || 0,
          correct: row.correct_predictions || 0,
          accuracy: row.accuracy_percentage || 0,
        }));
        setPredictionStats(stats);
      }
    } catch (e) {
      console.error('Prediction stats fetch error:', e);
    }
  }, []);

  // Fetch system prompt
  const fetchSystemPrompt = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('ai_prompts')
        .select('prompt')
        .eq('name', 'system')
        .eq('is_active', true)
        .single();

      if (data) {
        setSystemPrompt(data.prompt);
      }
    } catch (e) {
      console.log('No system prompt found');
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('push_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setNotifications(data.map(n => ({
          id: n.id,
          title: n.title,
          body: n.body,
          targetAudience: n.target_audience,
          sentAt: n.sent_at,
          deliveredCount: n.delivered_count,
          openedCount: n.opened_count,
        })));
      }

      const { count } = await supabase
        .from('push_tokens')
        .select('*', { count: 'exact', head: true });
      setTokenCount(count || 0);
    } catch (e) {
      console.error('Notifications fetch error:', e);
    }
  }, []);

  // Fetch activity logs
  const fetchActivityLogs = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('admin_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        setActivityLogs(data.map(log => ({
          id: log.id,
          adminId: log.admin_id,
          action: log.action,
          targetType: log.target_type,
          targetId: log.target_id,
          details: log.details as Record<string, any> | null,
          createdAt: log.created_at,
        })));
      }
    } catch (e) {
      console.error('Activity logs fetch error:', e);
    }
  }, []);

  // Log admin action
  const logAction = useCallback(async (action: string, targetType?: string, targetId?: string, details?: Record<string, any>) => {
    if (!user) return;
    
    try {
      await supabase.from('admin_activity_logs').insert({
        admin_id: user.id,
        action,
        target_type: targetType || null,
        target_id: targetId || null,
        details: details || null,
      });
    } catch (e) {
      console.error('Failed to log action:', e);
    }
  }, [user]);

  // Actions
  const assignPremium = useCallback(async (userId: string, planType: string, durationDays: number) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const { error } = await supabase.from('premium_subscriptions').upsert({
      user_id: userId,
      plan_type: planType,
      is_active: true,
      starts_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      platform: 'admin',
    }, { onConflict: 'user_id' });

    if (error) throw error;
    
    await logAction('assign_premium', 'user', userId, { planType, durationDays });
    await fetchUsers();
    await fetchPlanStats();
  }, [logAction, fetchUsers, fetchPlanStats]);

  const toggleRole = useCallback(async (userId: string, role: 'admin' | 'moderator' | 'user' | 'vip', action: 'add' | 'remove') => {
    if (action === 'add') {
      const { error } = await supabase.from('user_roles').insert({
        user_id: userId,
        role,
      });
      if (error) throw error;
      await logAction('add_role', 'user', userId, { role });
    } else {
      const { error } = await supabase.from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
      if (error) throw error;
      await logAction('remove_role', 'user', userId, { role });
    }
    await fetchUsers();
  }, [logAction, fetchUsers]);

  const banUser = useCallback(async (userId: string, reason: string) => {
    const { error } = await supabase.from('profiles')
      .update({
        is_banned: true,
        banned_at: new Date().toISOString(),
        ban_reason: reason,
      } as any)
      .eq('user_id', userId);

    if (error) throw error;
    await logAction('ban_user', 'user', userId, { reason });
    await fetchUsers();
  }, [logAction, fetchUsers]);

  const unbanUser = useCallback(async (userId: string) => {
    const { error } = await supabase.from('profiles')
      .update({
        is_banned: false,
        banned_at: null,
        ban_reason: null,
      } as any)
      .eq('user_id', userId);

    if (error) throw error;
    await logAction('unban_user', 'user', userId);
    await fetchUsers();
  }, [logAction, fetchUsers]);

  const savePrompt = useCallback(async (prompt: string) => {
    const { error } = await supabase.from('ai_prompts').upsert({
      name: 'system',
      prompt,
      is_active: true,
      updated_by: user?.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'name' });

    if (error) throw error;
    await logAction('update_prompt', 'ai_prompts', 'system');
    setSystemPrompt(prompt);
  }, [user, logAction]);

  const sendNotification = useCallback(async (data: { title: string; body: string; targetAudience: string }) => {
    const { error } = await supabase.from('push_notifications').insert({
      title: data.title,
      body: data.body,
      target_audience: data.targetAudience,
      sent_by: user?.id,
      sent_at: new Date().toISOString(),
    });

    if (error) throw error;
    await logAction('send_notification', 'push_notifications', undefined, data);
    await fetchNotifications();
  }, [user, logAction, fetchNotifications]);

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchDashboard(),
        fetchUsers(),
        fetchPlanStats(),
        fetchPredictionStats(),
        fetchLeagueStats(),
        fetchSystemPrompt(),
        fetchNotifications(),
        fetchActivityLogs(),
      ]);
      setIsLoading(false);
    };
    loadAll();
  }, []);

  // Reload users when page changes
  useEffect(() => {
    fetchUsers();
  }, [usersPage, fetchUsers]);

  return {
    isLoading,
    
    // Dashboard
    dashboardData,
    refreshDashboard: fetchDashboard,
    triggerAnalyticsRefresh,

    // Users
    users,
    usersCount,
    usersPage,
    setUsersPage,
    pageSize,
    refreshUsers: fetchUsers,
    assignPremium,
    toggleRole,
    banUser,
    unbanUser,

    // Premium
    planStats,
    refreshPlanStats: fetchPlanStats,

    // AI
    predictionStats,
    leagueStats,
    systemPrompt,
    refreshPredictionStats: fetchPredictionStats,
    refreshLeagueStats: fetchLeagueStats,
    savePrompt,

    // Notifications
    notifications,
    tokenCount,
    refreshNotifications: fetchNotifications,
    sendNotification,

    // Logs
    activityLogs,
    refreshActivityLogs: fetchActivityLogs,
  };
};
