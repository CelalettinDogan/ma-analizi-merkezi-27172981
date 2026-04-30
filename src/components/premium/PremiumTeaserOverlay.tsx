import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticTap } from '@/hooks/useHapticTap';

interface PremiumTeaserOverlayProps {
  className?: string;
  label?: string;
  /** Optional query string (without ?) to attach when navigating to /premium */
  source?: string;
}

/**
 * Cinematic frosted-glass teaser. Sits absolutely over locked content.
 * - 3-layer gradient: deep card fade → subtle highlight sweep
 * - Shimmering CTA pill with rotating crown icon
 * - Native haptic feedback on tap
 */
const PremiumTeaserOverlay: React.FC<PremiumTeaserOverlayProps> = ({
  className,
  label,
  source = 'teaser',
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation('premium');
  const tap = useHapticTap('medium');

  const handleClick = () => {
    tap();
    navigate(`/premium?from=${source}`);
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
      <div className="h-24 w-full bg-gradient-to-t from-card via-card/90 to-transparent" />
      {/* Layer 2 — subtle primary glow */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-primary/[0.06] to-transparent pointer-events-none" />

      {/* Tiny "locked" micro-label above CTA */}
      <div className="pointer-events-none -mt-1 mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        <Lock className="h-2.5 w-2.5" />
        <span>{t('teaser.locked', 'Premium')}</span>
      </div>

      {/* CTA pill */}
      <motion.button
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        onClick={handleClick}
        aria-label={label ?? t('teaser.unlockFull')}
        className="pointer-events-auto relative mb-2 flex items-center gap-1.5 overflow-hidden rounded-full border border-primary/40 bg-gradient-to-r from-primary/20 via-primary/15 to-amber-500/15 px-4 py-2 text-[12px] font-bold text-primary backdrop-blur-md shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.55)]"
      >
        {/* Shimmer sweep */}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          style={{
            animation: 'shimmer 2.4s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
        <motion.span
          animate={{ rotate: [0, -8, 0, 8, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]"
        >
          <Crown className="h-3.5 w-3.5" />
        </motion.span>
        <span className="relative">{label ?? t('teaser.unlockFull')}</span>
      </motion.button>
    </div>
  );
};

export default PremiumTeaserOverlay;
