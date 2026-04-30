import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Crown, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticTap } from '@/hooks/useHapticTap';
import { useStreak } from '@/hooks/useStreak';
import { useAnalysisLimit } from '@/hooks/useAnalysisLimit';

interface PremiumTeaserOverlayProps {
  className?: string;
  label?: string;
  source?: string;
}

const PremiumTeaserOverlay: React.FC<PremiumTeaserOverlayProps> = ({
  className,
  label,
  source = 'teaser',
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation('premium');
  const tap = useHapticTap('medium');
  const { streak } = useStreak();
  const { remaining, dailyLimit } = useAnalysisLimit();
  const [pulseCount, setPulseCount] = useState(0);

  // Attention pulse — 3 times on mount then stop
  useEffect(() => {
    if (pulseCount >= 3) return;
    const timer = setTimeout(() => setPulseCount(c => c + 1), 1200);
    return () => clearTimeout(timer);
  }, [pulseCount]);

  const handleClick = () => {
    tap();
    navigate(`/premium?from=${source}`);
  };

  // Dynamic CTA label based on context
  const getDynamicLabel = () => {
    if (label) return label;
    if (streak.current_streak >= 5) return t('teaser.streakCta', { days: streak.current_streak });
    if (remaining <= 1) return t('teaser.lastChanceCta');
    return t('teaser.unlockFull');
  };

  // Dynamic subtitle
  const getSubtitle = () => {
    if (streak.current_streak >= 7) return t('teaser.powerUser');
    if (remaining === 0) return t('teaser.limitReached');
    return t('teaser.detailedReasoning');
  };

  return (
    <div
      className={cn(
        'absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pointer-events-none',
        className,
      )}
      aria-hidden="false"
    >
      {/* Layer 1 — deep fade to card */}
      <div className="h-28 w-full bg-gradient-to-t from-card via-card/95 to-transparent" />
      {/* Layer 2 — subtle primary glow */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-primary/[0.08] to-transparent pointer-events-none" />

      {/* Context subtitle */}
      <div className="pointer-events-none -mt-2 mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        <Lock className="h-2.5 w-2.5" />
        <span>{getSubtitle()}</span>
      </div>

      {/* CTA button — glassmorphism + shimmer + pulse ring */}
      <div className="relative mb-3 pointer-events-auto">
        {/* Animated pulse ring (attention) */}
        <AnimatePresence>
          {pulseCount < 3 && (
            <motion.div
              key={pulseCount}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.6, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full border-2 border-primary/40 pointer-events-none"
            />
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={handleClick}
          aria-label={getDynamicLabel()}
          className="relative flex items-center gap-2 overflow-hidden rounded-full border border-primary/30 bg-gradient-to-r from-primary/25 via-primary/15 to-amber-500/20 px-5 py-2.5 text-[13px] font-bold text-primary backdrop-blur-xl shadow-[0_6px_28px_-4px_hsl(var(--primary)/0.5)]"
        >
          {/* Shimmer sweep */}
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{
              animation: 'shimmer 2s ease-in-out infinite',
              willChange: 'transform',
            }}
          />

          {/* Crown with glow */}
          <motion.span
            animate={{ rotate: [0, -10, 0, 10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="relative drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
          >
            <Crown className="h-4 w-4" />
          </motion.span>

          {/* Dynamic label */}
          <span className="relative">{getDynamicLabel()}</span>

          {/* Arrow */}
          <motion.span
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            <ArrowRight className="h-3.5 w-3.5 opacity-70" />
          </motion.span>
        </motion.button>
      </div>
    </div>
  );
};

export default PremiumTeaserOverlay;
