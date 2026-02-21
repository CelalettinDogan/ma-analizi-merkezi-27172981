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

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    try {
      // Total users from profiles
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Premium users
      const { data: premiumData } = await supabase
        .from('premium_subscriptions')
        .select('plan_type, user_id')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      const premiumUsers = premiumData?.length || 0;

      // Today's chat usage
      const today = new Date().toISOString().split('T')[0];
      const { data: chatData } = await supabase
        .from('chatbot_usage')
        .select('usage_count')
        .eq('usage_date', today);
      const todayChats = chatData?.reduce((sum, r) => sum + r.usage_count, 0) || 0;

      // Today's analysis usage
      const { data: analysisData } = await supabase
        .from('analysis_usage')
        .select('usage_count')
        .eq('usage_date', today);
      const todayAnalysis = analysisData?.reduce((sum, r) => sum + r.usage_count, 0) || 0;

      // AI accuracy from ml_model_stats
      const { data: mlStats } = await supabase
        .from('ml_model_stats')
        .select('accuracy_percentage')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      // Live matches
      const { count: liveMatches } = await supabase
        .from('cached_live_matches')
        .select('*', { count: 'exact', head: true });

      // Active users (approximation from chat usage last 24h)
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
      });
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    }
  }, []);

  // Fetch users with pagination
  const fetchUsers = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const offset = (usersPage - 1) * pageSize;

      // Get profiles
      const { data: profiles, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (!profiles) return;

      // Get additional data for these users
      const userIds = profiles.map(p => p.user_id);

      // Get roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Get premium status
      const { data: premiumData } = await supabase
        .from('premium_subscriptions')
        .select('user_id, plan_type, is_active, expires_at')
        .in('user_id', userIds)
        .eq('is_active', true);

      // Get chat usage
      const { data: chatUsage } = await supabase
        .from('chatbot_usage')
        .select('user_id, usage_count')
        .in('user_id', userIds)
        .eq('usage_date', today);

      // Get analysis usage
      const { data: analysisUsage } = await supabase
        .from('analysis_usage')
        .select('user_id, usage_count')
        .in('user_id', userIds)
        .eq('usage_date', today);

      const userList: User[] = profiles.map(profile => {
        const roles = rolesData?.filter(r => r.user_id === profile.user_id).map(r => r.role) || [];
        const premium = premiumData?.find(p => p.user_id === profile.user_id && new Date(p.expires_at) > new Date());
        const chat = chatUsage?.find(c => c.user_id === profile.user_id);
        const analysis = analysisUsage?.find(a => a.user_id === profile.user_id);

        return {
          id: profile.user_id,
          email: profile.user_id, // We don't have email in profiles, would need auth.users
          displayName: profile.display_name || '',
          createdAt: profile.created_at,
          lastSignIn: null,
          isPremium: !!premium,
          planType: premium?.plan_type || null,
          roles,
          chatUsageToday: chat?.usage_count || 0,
          analysisUsageToday: analysis?.usage_count || 0,
          isBanned: (profile as any).is_banned || false,
        };
      });

      setUsers(userList);
      setUsersCount(count || 0);
    } catch (e) {
      console.error('Users fetch error:', e);
    }
  }, [usersPage]);

  // Fetch plan stats
  const fetchPlanStats = useCallback(async () => {
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
      console.error('Plan stats fetch error:', e);
    }
  }, []);

  // Fetch prediction stats
  const fetchPredictionStats = useCallback(async () => {
    try {
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

  // Fetch league stats
  const fetchLeagueStats = useCallback(async () => {
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
      console.error('League stats fetch error:', e);
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
      // Prompt may not exist yet
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

      // Token count
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
