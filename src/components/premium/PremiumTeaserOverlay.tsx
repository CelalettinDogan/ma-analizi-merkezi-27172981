import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumTeaserOverlayProps {
  /** Visible teaser height. Anything taller is hidden behind the gradient. */
  className?: string;
  /** Optional override label, defaults to translation key. */
  label?: string;
}

/**
 * Wrap any premium-only content with this overlay.
 * - The first portion stays visible.
 * - The bottom is masked with a gradient + blur.
 * - A pill CTA navigates to /premium.
 *
 * Usage:
 * <div className="relative">
 *   <div className={isPremium ? '' : 'blur-sm select-none pointer-events-none max-h-24 overflow-hidden'}>
 *     {content}
 *   </div>
 *   {!isPremium && <PremiumTeaserOverlay />}
 * </div>
 */
const PremiumTeaserOverlay: React.FC<PremiumTeaserOverlayProps> = ({ className, label }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('premium');

  return (
    <div
      className={cn(
        'absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pointer-events-none',
        className,
      )}
      aria-hidden="false"
    >
      <div className="h-20 w-full bg-gradient-to-t from-card via-card/85 to-transparent" />
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => navigate('/premium')}
        className="pointer-events-auto -mt-2 mb-2 flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/15 px-4 py-2 text-[12px] font-semibold text-primary backdrop-blur-md shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.45)] active:opacity-85"
      >
        <Crown className="h-3.5 w-3.5" />
        <span>{label ?? t('teaser.unlockFull')}</span>
      </motion.button>
    </div>
  );
};

export default PremiumTeaserOverlay;
