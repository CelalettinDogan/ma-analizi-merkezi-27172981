import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Flame, Zap, MessageSquare, Crown, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStreakRewards } from '@/hooks/useStreakRewards';
import { useStreak } from '@/hooks/useStreak';
import { Card, CardContent } from '@/components/ui/card';

const MILESTONES = [
  { day: 3, icon: Zap, rewardKey: 'day3', color: 'text-blue-400' },
  { day: 5, icon: MessageSquare, rewardKey: 'day5', color: 'text-emerald-400' },
  { day: 7, icon: MessageSquare, rewardKey: 'day7', color: 'text-emerald-500' },
  { day: 14, icon: Award, rewardKey: 'day14', color: 'text-purple-400' },
  { day: 30, icon: Crown, rewardKey: 'day30', color: 'text-amber-400' },
];

const StreakRewardsCard: React.FC = () => {
  const { t } = useTranslation('rewards');
  const { streak } = useStreak();
  const { bonusCredits } = useStreakRewards();

  return (
    <Card className="glass-card">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500/10">
            <Gift className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{t('title')}</h3>
            <p className="text-micro text-muted-foreground">{t('description')}</p>
          </div>
        </div>

        {/* Active bonuses */}
        {(bonusCredits.bonus_analysis > 0 || bonusCredits.bonus_chat > 0) && (
          <div className="flex gap-2">
            {bonusCredits.bonus_analysis > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-semibold text-blue-400">
                  +{bonusCredits.bonus_analysis} {t('bonusAnalysis')}
                </span>
              </div>
            )}
            {bonusCredits.bonus_chat > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-semibold text-emerald-400">
                  +{bonusCredits.bonus_chat} {t('bonusChat')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Milestone progress */}
        <div className="space-y-1.5">
          {MILESTONES.map((m) => {
            const reached = streak.current_streak >= m.day;
            const Icon = m.icon;
            return (
              <div
                key={m.day}
                className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${
                  reached ? 'bg-primary/5 border border-primary/10' : 'bg-muted/10 opacity-50'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  reached ? 'bg-primary/10' : 'bg-muted/20'
                }`}>
                  <Icon className={`w-3.5 h-3.5 ${reached ? m.color : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${reached ? '' : 'text-muted-foreground'}`}>
                      {m.day} {t('dayShort')}
                    </span>
                    {reached && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-[10px] font-bold text-primary"
                      >
                        {t('earned')}
                      </motion.span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{t(m.rewardKey)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Streak badge indicator */}
        {bonusCredits.has_streak_badge && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Award className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-purple-400">{t('badge')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StreakRewardsCard;
