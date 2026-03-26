import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useAccessLevel } from '@/hooks/useAccessLevel';
import { useAnalysisLimit } from '@/hooks/useAnalysisLimit';
import { useChatbot } from '@/hooks/useChatbot';
import { useTheme } from 'next-themes';
import AppHeader from '@/components/layout/AppHeader';
import { supabase } from '@/integrations/supabase/client';

import ProfileHeader from '@/components/profile/ProfileHeader';
import RecentAnalyses from '@/components/profile/RecentAnalyses';
import SettingsMenu from '@/components/profile/SettingsMenu';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { favorites, getFavoritesByType } = useFavorites();
  const { theme, setTheme } = useTheme();
  
  const {
    isPremium, planDisplayName, dailyAnalysisLimit, dailyChatLimit,
    hasUnlimitedAnalyses, canUseAIChat, isAdmin
  } = useAccessLevel();
  
  const { remaining: analysisRemaining } = useAnalysisLimit();
  const { usage: chatUsage } = useChatbot();

  const { data: recentAnalyses, isLoading: analysesLoading } = useQuery({
    queryKey: ['recent-analyses-profile'],
    queryFn: async () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const { data } = await supabase
        .from('predictions')
        .select('*')
        .gte('created_at', oneWeekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    staleTime: 5 * 60 * 1000
  });

  if (authLoading) {
    return (
      <div className="h-screen bg-background flex flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto px-4 py-4 lg:pb-6" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
          <div className="space-y-3 max-w-lg mx-auto">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-background flex flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto px-4 py-4 lg:pb-6 flex items-center justify-center" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
          <Card className="w-full max-w-md glass-card">
            <CardContent className="pt-6 text-center">
              <User className="h-14 w-14 text-muted-foreground mx-auto mb-3" />
              <h2 className="text-lg font-bold mb-2">Giriş Yapın</h2>
              <p className="text-sm text-muted-foreground mb-4">Profilinizi görüntülemek için lütfen giriş yapın</p>
              <Link to="/auth"><Button className="w-full">Giriş Yap</Button></Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Kullanıcı';
  const initials = displayName.slice(0, 2).toUpperCase();
  const memberSince = user.created_at ? format(new Date(user.created_at), 'MMMM yyyy', { locale: tr }) : null;
  const favoriteLeagues = getFavoritesByType('league');
  const favoriteTeams = getFavoritesByType('team');

  const chatRemaining = chatUsage 
    ? (typeof chatUsage.remaining === 'number' ? chatUsage.remaining : '∞')
    : (canUseAIChat ? dailyChatLimit : 0);

  return (
    <div className="h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1 overflow-y-auto px-3 xs:px-4 py-3 xs:py-4 lg:pb-6" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-3 max-w-lg mx-auto">
          <motion.div variants={itemVariants}>
            <ProfileHeader
              displayName={displayName}
              initials={initials}
              email={user.email || ''}
              memberSince={memberSince}
              isAdmin={isAdmin}
              isPremium={isPremium}
              planDisplayName={planDisplayName}
              hasUnlimitedAnalyses={hasUnlimitedAnalyses}
              analysisRemaining={analysisRemaining}
              dailyAnalysisLimit={dailyAnalysisLimit}
              canUseAIChat={canUseAIChat}
              dailyChatLimit={dailyChatLimit}
              chatRemaining={chatRemaining}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <RecentAnalyses
              recentAnalyses={recentAnalyses}
              analysesLoading={analysesLoading}
              favorites={favorites}
              favoriteLeagues={favoriteLeagues}
              favoriteTeams={favoriteTeams}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <SettingsMenu
              theme={theme}
              setTheme={setTheme}
              signOut={signOut}
              userId={user.id}
            />
          </motion.div>

          <p className="text-micro text-muted-foreground text-center px-4 pb-2">
            ⚠️ Tüm içerikler istatistiksel analiz amaçlıdır ve tavsiye niteliği taşımaz.
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
