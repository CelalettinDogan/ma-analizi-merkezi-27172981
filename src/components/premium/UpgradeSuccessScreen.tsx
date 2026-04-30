import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, CheckCircle2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import useHapticTap from '@/hooks/useHapticTap';

interface UpgradeSuccessProps {
  planName: string;
  onDismiss: () => void;
}

const confettiColors = [
  'hsl(var(--primary))',
  'hsl(45 93% 58%)',    // amber
  'hsl(160 60% 45%)',   // emerald
  'hsl(280 60% 60%)',   // purple
  'hsl(var(--accent))',
];

const Particle = ({ index }: { index: number }) => {
  const angle = (index / 20) * Math.PI * 2;
  const distance = 80 + Math.random() * 120;
  const size = 4 + Math.random() * 6;
  const color = confettiColors[index % confettiColors.length];
  const isCircle = Math.random() > 0.5;

  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
      animate={{
        opacity: 0,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 40,
        scale: 0.2,
        rotate: 360 + Math.random() * 360,
      }}
      transition={{ duration: 1.2 + Math.random() * 0.6, ease: 'easeOut' }}
      className="absolute top-1/2 left-1/2 pointer-events-none"
      style={{
        width: isCircle ? size : size * 2,
        height: size,
        borderRadius: isCircle ? '50%' : '2px',
        backgroundColor: color,
      }}
    />
  );
};

const UpgradeSuccessScreen: React.FC<UpgradeSuccessProps> = ({ planName, onDismiss }) => {
  const { t } = useTranslation('premium');
  const tapHeavy = useHapticTap('heavy');
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    tapHeavy();
    const timer = setTimeout(() => setShowConfetti(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center px-6"
    >
      {/* Confetti burst */}
      <div className="relative">
        <AnimatePresence>
          {showConfetti && Array.from({ length: 20 }).map((_, i) => (
            <Particle key={i} index={i} />
          ))}
        </AnimatePresence>

        {/* Success icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="relative w-24 h-24 mx-auto"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-amber-500/20 blur-2xl" />
          <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-[0_16px_64px_-8px_hsl(var(--primary)/0.5)]">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-background"
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
          </motion.div>
        </motion.div>
      </div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mt-8 space-y-2"
      >
        <h2 className="text-2xl font-bold text-foreground">
          {t('success.title')}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
          {t('success.description', { plan: planName })}
        </p>
      </motion.div>

      {/* Features unlocked */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 w-full max-w-xs space-y-2"
      >
        {['unlimitedAnalysis', 'aiChat', 'prioritySupport'].map((key, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/10"
          >
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground">
              {t(`success.features.${key}`)}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mt-10 w-full max-w-xs"
      >
        <Button
          onClick={onDismiss}
          className="w-full h-14 text-[15px] font-bold rounded-2xl bg-gradient-to-r from-primary to-emerald-500"
          size="lg"
        >
          {t('success.continue')}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default UpgradeSuccessScreen;
