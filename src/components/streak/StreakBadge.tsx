import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Gift } from 'lucide-react';
import { useStreak } from '@/hooks/useStreak';
import { useStreakRewards } from '@/hooks/useStreakRewards';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import useHapticTap from '@/hooks/useHapticTap';

const StreakBadge: React.FC = () => {
  const { streak, milestone, dismissMilestone } = useStreak();
  const { bonusCredits } = useStreakRewards();
  const { t } = useTranslation(['streak', 'rewards']);
  const tap = useHapticTap('heavy');

  // Server has already granted rewards; just celebrate when a new milestone arrives
  React.useEffect(() => {
    if (milestone) {
      tap();
      toast.success(t('streak:milestone', { days: milestone }), { duration: 4000 });
      dismissMilestone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestone]);

  if (streak.current_streak < 1) return null;

  const totalBonus = bonusCredits.bonus_analysis + bonusCredits.bonus_chat;

  return (
    <div className="inline-flex items-center gap-2">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20"
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <Flame className="h-4 w-4 text-amber-500" />
        </motion.div>
        <span className="text-xs font-semibold text-amber-400">
          {streak.current_streak} {t('streak:days')}
        </span>
      </motion.div>

      {totalBonus > 0 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
        >
          <Gift className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-[10px] font-semibold text-emerald-400">
            {totalBonus}
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default StreakBadge;
