import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Gift, Zap, MessageSquare, Crown, Award, TrendingUp, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStreak } from '@/hooks/useStreak';
import { useStreakRewards } from '@/hooks/useStreakRewards';
import { useAccessLevel } from '@/hooks/useAccessLevel';
import { useChatbot } from '@/hooks/useChatbot';
import { useAnalysisLimit } from '@/hooks/useAnalysisLimit';
import { Skeleton } from '@/components/ui/skeleton';

const MILESTONES = [
  { day: 3, icon: Zap, rewardKey: 'day3', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { day: 5, icon: MessageSquare, rewardKey: 'day5', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { day: 7, icon: MessageSquare, rewardKey: 'day7', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { day: 14, icon: Award, rewardKey: 'day14', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { day: 30, icon: Crown, rewardKey: 'day30', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } },
};

const Rewards: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['rewards', 'common', 'streak']);
  const { streak, isLoading: streakLoading } = useStreak();
  const { bonusCredits, isLoading: rewardsLoading } = useStreakRewards();
  const { dailyChatLimit, canUseAIChat, isPremium, planDisplayName } = useAccessLevel();
  const { usage: chatUsage } = useChatbot();
  const { remaining: analysisRemaining } = useAnalysisLimit();

  const isLoading = streakLoading || rewardsLoading;

  const chatRemaining = chatUsage
    ? (typeof chatUsage.remaining === 'number' ? chatUsage.remaining : '∞')
    : (canUseAIChat ? dailyChatLimit : 0);

  // Progress to next milestone
  const nextMilestone = MILESTONES.find(m => streak.current_streak < m.day);
  const prevMilestoneDay = MILESTONES.filter(m => streak.current_streak >= m.day).pop()?.day ?? 0;
  const progressPct = nextMilestone
    ? ((streak.current_streak - prevMilestoneDay) / (nextMilestone.day - prevMilestoneDay)) * 100
    : 100;

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex flex-col">
        <header className="flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-3 border-b border-border/40">
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Skeleton className="h-6 w-32" />
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-3 border-b border-border/40">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-base font-bold">{t('rewards:title')}</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-4 max-w-lg mx-auto">

          {/* Streak Hero */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-0">
                <div className="relative px-5 py-6 text-center">
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-500/8 to-transparent pointer-events-none" />
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                    className="relative"
                  >
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                      <Flame className="w-10 h-10 text-amber-500" />
                    </div>
                    <p className="text-4xl font-black tabular-nums">{streak.current_streak}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('streak:days', { ns: 'streak' }) || 'Günlük Seri'}</p>
                  </motion.div>

                  <div className="flex justify-center gap-6 mt-4">
                    <div className="text-center">
                      <p className="text-lg font-bold tabular-nums">{streak.longest_streak}</p>
                      <p className="text-[10px] text-muted-foreground">En Uzun</p>
                    </div>
                    <div className="w-px bg-border/40" />
                    <div className="text-center">
                      <p className="text-lg font-bold tabular-nums">{MILESTONES.filter(m => streak.current_streak >= m.day).length}/{MILESTONES.length}</p>
                      <p className="text-[10px] text-muted-foreground">Milestone</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Active Bonuses */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-xl bg-primary/10">
                    <Star className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold">Aktif Bonus Haklar</h3>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Bonus Analysis */}
                  <div className="p-3 rounded-2xl bg-blue-500/8 border border-blue-500/15 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-[10px] font-medium text-muted-foreground">{t('rewards:bonusAnalysis')}</span>
                    </div>
                    <p className="text-xl font-black tabular-nums text-blue-400">{bonusCredits.bonus_analysis}</p>
                  </div>
                  {/* Bonus Chat */}
                  <div className="p-3 rounded-2xl bg-emerald-500/8 border border-emerald-500/15 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] font-medium text-muted-foreground">{t('rewards:bonusChat')}</span>
                    </div>
                    <p className="text-xl font-black tabular-nums text-emerald-400">{bonusCredits.bonus_chat}</p>
                  </div>
                </div>

                {/* Daily plan limits */}
                <div className="pt-2 border-t border-border/30 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Plan Analiz Hakkı</span>
                    <span className="font-semibold tabular-nums">{analysisRemaining}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Plan Chat Hakkı</span>
                    <span className="font-semibold tabular-nums">{chatRemaining}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-semibold">{planDisplayName}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Next Milestone Progress */}
          {nextMilestone && (
            <motion.div variants={itemVariants}>
              <Card className="glass-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-amber-500/10">
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                    </div>
                    <h3 className="text-sm font-bold">Sonraki Hedef</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${nextMilestone.bg} border ${nextMilestone.border}`}>
                      <nextMilestone.icon className={`w-5 h-5 ${nextMilestone.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">{nextMilestone.day} Gün Serisi</p>
                      <p className="text-[10px] text-muted-foreground">{t(`rewards:${nextMilestone.rewardKey}`)}</p>
                    </div>
                    <span className="text-xs font-bold tabular-nums text-muted-foreground">
                      {streak.current_streak}/{nextMilestone.day}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 rounded-full bg-muted/20 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progressPct, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Milestone Timeline */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-xl bg-amber-500/10">
                    <Gift className="w-4 h-4 text-amber-500" />
                  </div>
                  <h3 className="text-sm font-bold">{t('rewards:title')}</h3>
                </div>

                <div className="space-y-2">
                  {MILESTONES.map((m, idx) => {
                    const reached = streak.current_streak >= m.day;
                    const Icon = m.icon;
                    return (
                      <motion.div
                        key={m.day}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx + 0.4 }}
                        className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                          reached ? `${m.bg} border ${m.border}` : 'bg-muted/5 border border-border/20 opacity-50'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          reached ? m.bg : 'bg-muted/20'
                        }`}>
                          <Icon className={`w-4 h-4 ${reached ? m.color : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${reached ? '' : 'text-muted-foreground'}`}>
                            {m.day} {t('streak:days', { ns: 'streak' }) || 'Gün'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{t(`rewards:${m.rewardKey}`)}</p>
                        </div>
                        {reached && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10"
                          >
                            {t('rewards:earned')}
                          </motion.span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Streak Badge */}
          {bonusCredits.has_streak_badge && (
            <motion.div variants={itemVariants}>
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <Award className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-purple-400">{t('rewards:badge')}</p>
                      <p className="text-[10px] text-muted-foreground">14+ gün seri ödülü</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Upgrade CTA for free users */}
          {!isPremium && (
            <motion.div variants={itemVariants}>
              <Button
                className="w-full h-12 rounded-2xl font-semibold"
                onClick={() => navigate('/premium')}
              >
                <Crown className="w-4 h-4 mr-2" />
                Premium ile Daha Fazla Hak Kazan
              </Button>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Rewards;
