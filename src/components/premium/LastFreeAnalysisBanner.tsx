import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAccessLevel } from '@/hooks/useAccessLevel';
import { useAnalysisLimit } from '@/hooks/useAnalysisLimit';
import { useHapticTap } from '@/hooks/useHapticTap';

/**
 * High-urgency native banner for free users with exactly 1 analysis left.
 * - Vertical amber accent bar (Apple-Mail flag style)
 * - Animated countdown ring with bold "1"
 * - Glassmorphism layered background
 * - Mounts with a 3-pulse attention burst, then settles
 */
const LastFreeAnalysisBanner: React.FC = () => {
  const { t } = useTranslation('premium');
  const navigate = useNavigate();
  const { isPremium, isAdmin, isGuest } = useAccessLevel();
  const { remaining, dailyLimit, isLoading } = useAnalysisLimit();
  const [pulseDone, setPulseDone] = useState(false);
  const tap = useHapticTap('light');

  const shouldShow =
    !isLoading &&
    !isGuest &&
    !isPremium &&
    !isAdmin &&
    dailyLimit > 0 &&
    remaining === 1;

  useEffect(() => {
    if (!shouldShow) return;
    const t = setTimeout(() => setPulseDone(true), 3000);
    return () => clearTimeout(t);
  }, [shouldShow]);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.button
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: pulseDone ? 1 : [1, 1.015, 1, 1.015, 1],
          }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: pulseDone ? 0.25 : 1.4 }}
          onClick={() => {
            tap();
            navigate('/premium?from=last-free-banner');
          }}
          aria-label={t('lastFreeAnalysis.title')}
          className="relative w-full flex items-stretch gap-3 rounded-2xl overflow-hidden border border-amber-500/30 bg-card/80 backdrop-blur-xl px-3.5 py-3 text-left active:scale-[0.99] transition-transform shadow-[0_4px_20px_-4px_hsl(45_70%_45%/0.25)]"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {/* Layered mesh background */}
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.08] via-transparent to-primary/[0.08] pointer-events-none"
          />
          <span
            aria-hidden="true"
            className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"
          />

          {/* Vertical accent bar */}
          <span
            aria-hidden="true"
            className="relative w-[3px] rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-600 shrink-0 shadow-[0_0_8px_hsl(45_70%_55%/0.6)]"
          />

          {/* Countdown ring */}
          <div className="relative shrink-0 flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 36 36" className="transform -rotate-90">
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                strokeWidth="2.5"
                className="stroke-muted/40"
              />
              <motion.circle
                cx="18" cy="18" r="15"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="stroke-amber-400"
                strokeDasharray={94.25}
                initial={{ strokeDashoffset: 94.25 }}
                animate={{ strokeDashoffset: 94.25 - 94.25 / 3 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold text-amber-400">
              1
            </span>
          </div>

          {/* Text */}
          <div className="relative flex-1 min-w-0 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-foreground truncate flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              {t('lastFreeAnalysis.title')}
            </p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {t('lastFreeAnalysis.subtitle')}
            </p>
          </div>

          {/* CTA pill */}
          <div className="relative shrink-0 self-center flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-[11px] font-extrabold shadow-[0_2px_10px_-2px_hsl(var(--primary)/0.6)]">
            <Sparkles className="w-3 h-3" />
            {t('lastFreeAnalysis.cta')}
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default LastFreeAnalysisBanner;
