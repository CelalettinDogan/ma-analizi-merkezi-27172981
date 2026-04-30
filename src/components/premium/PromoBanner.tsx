import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PromoBannerProps {
  type: 'seasonal' | 'limited';
  discount?: number;
  expiresLabel?: string;
}

const PromoBanner: React.FC<PromoBannerProps> = ({ type, discount = 20, expiresLabel }) => {
  const { t } = useTranslation('premium');

  if (type === 'limited') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden border border-amber-500/20"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10" />
        <div className="relative px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Flame className="w-5 h-5 text-amber-500" />
            </motion.div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground">
              {t('promo.limitedTitle', { discount })}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {expiresLabel || t('promo.limitedSubtitle')}
            </p>
          </div>
          {expiresLabel && (
            <div className="flex items-center gap-1 text-[10px] text-amber-500 font-semibold shrink-0">
              <Clock className="w-3 h-3" />
              {expiresLabel}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Seasonal
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl overflow-hidden border border-primary/20"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-emerald-500/5 to-primary/8" />
      <div className="relative px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <span className="text-lg">⚽</span>
          </motion.div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground">
            {t('promo.seasonalTitle')}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {t('promo.seasonalSubtitle')}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default PromoBanner;
