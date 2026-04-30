import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useStreak } from '@/hooks/useStreak';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import useHapticTap from '@/hooks/useHapticTap';

const StreakBadge: React.FC = () => {
  const { streak, milestone, dismissMilestone } = useStreak();
  const { t } = useTranslation('streak');
  const tap = useHapticTap('medium');

  React.useEffect(() => {
    if (milestone) {
      tap();
      toast.success(t('milestone', { days: milestone }), { duration: 4000 });
      dismissMilestone();
    }
  }, [milestone]);

  if (streak.current_streak < 1) return null;

  return (
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
        {streak.current_streak} {t('days')}
      </span>
    </motion.div>
  );
};

export default StreakBadge;
