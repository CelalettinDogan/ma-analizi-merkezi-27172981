import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSmartPromotion } from '@/hooks/useSmartPromotion';
import useHapticTap from '@/hooks/useHapticTap';
import { useTranslation } from 'react-i18next';

const SmartPromotionTrigger: React.FC = () => {
  const { visible, trigger, message, dismiss } = useSmartPromotion();
  const navigate = useNavigate();
  const tap = useHapticTap('medium');
  const { t } = useTranslation('premium');

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-[calc(80px+env(safe-area-inset-bottom,0px)+8px)] left-3 right-3 z-50"
        >
          <div className="relative rounded-2xl border border-primary/20 bg-background/95 backdrop-blur-xl p-4 shadow-lg shadow-primary/5">
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted/50 transition-colors"
              aria-label={t('dismiss')}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground mb-2 leading-snug">
                  {message}
                </p>
                <button
                  onClick={() => {
                    tap();
                    dismiss();
                    navigate(`/premium?from=smart_${trigger}`);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  {t('viewPlans')} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SmartPromotionTrigger;
