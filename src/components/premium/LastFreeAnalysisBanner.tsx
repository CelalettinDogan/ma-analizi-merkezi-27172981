import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAccessLevel } from '@/hooks/useAccessLevel';
import { useAnalysisLimit } from '@/hooks/useAnalysisLimit';

/**
 * Soft, dismissible banner shown to Free users when they have exactly
 * 1 analysis remaining today. Encourages upgrade before they hit the wall.
 */
const LastFreeAnalysisBanner: React.FC = () => {
  const { t } = useTranslation('premium');
  const navigate = useNavigate();
  const { isPremium, isAdmin, isGuest } = useAccessLevel();
  const { remaining, dailyLimit, isLoading } = useAnalysisLimit();

  const shouldShow =
    !isLoading &&
    !isGuest &&
    !isPremium &&
    !isAdmin &&
    dailyLimit > 0 &&
    remaining === 1;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          onClick={() => navigate('/premium')}
          className="w-full flex items-center gap-3 rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-primary/10 px-4 py-3 text-left active:scale-[0.99] transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
            <Crown className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">
              {t('lastFreeAnalysis.title')}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {t('lastFreeAnalysis.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-primary/15 text-primary px-3 py-1.5 text-[11px] font-bold shrink-0">
            <Sparkles className="w-3 h-3" />
            {t('lastFreeAnalysis.cta')}
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default LastFreeAnalysisBanner;
