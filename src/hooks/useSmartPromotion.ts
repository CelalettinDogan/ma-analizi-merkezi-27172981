import { useState, useCallback, useEffect } from 'react';
import { useStreak } from '@/hooks/useStreak';
import { usePredictorStats } from '@/hooks/usePredictorStats';
import { useAccessLevel } from '@/hooks/useAccessLevel';
import { canShowPromo, recordPromoShown } from '@/lib/quietHours';

type Trigger = 'power_user' | 'accuracy_pro' | 'engaged_browsing';

interface SmartPromotionState {
  visible: boolean;
  trigger: Trigger | null;
  message: string;
}

export const useSmartPromotion = () => {
  const { streak } = useStreak();
  const { stats, rank } = usePredictorStats();
  const { isPremium } = useAccessLevel();
  const [state, setState] = useState<SmartPromotionState>({ visible: false, trigger: null, message: '' });

  useEffect(() => {
    if (isPremium) return;

    // Power user trigger: streak ≥ 7
    if (streak.current_streak >= 7 && canShowPromo('power_user')) {
      setState({
        visible: true,
        trigger: 'power_user',
        message: `${streak.current_streak} gün üst üste! Premium ile daha fazla analiz aç.`,
      });
      recordPromoShown('power_user');
      return;
    }

    // Accuracy pro trigger: accuracy ≥ 60%
    if (stats.accuracy !== null && stats.accuracy >= 60 && stats.verified_predictions >= 10 && canShowPromo('accuracy_pro')) {
      setState({
        visible: true,
        trigger: 'accuracy_pro',
        message: `%${stats.accuracy} isabet oranı! Pro seviyeye geç.`,
      });
      recordPromoShown('accuracy_pro');
      return;
    }
  }, [streak, stats, isPremium]);

  const dismiss = useCallback(() => {
    setState({ visible: false, trigger: null, message: '' });
  }, []);

  return { ...state, dismiss };
};
