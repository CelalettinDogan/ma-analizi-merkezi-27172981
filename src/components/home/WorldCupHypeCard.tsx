import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface WorldCupHypeCardProps {
  variant?: 'today' | 'upcoming';
  onSelectWC?: () => void;
}

const WC_KICKOFF = new Date('2026-06-11T18:00:00Z').getTime();

type Parts = { d: number; h: number; m: number; s: number; started: boolean };

const computeParts = (): Parts => {
  const diff = WC_KICKOFF - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, started: true };
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s, started: false };
};

const pad = (n: number) => n.toString().padStart(2, '0');

const TimeBlock: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center min-w-[44px]">
    <span className="font-display font-bold text-2xl tabular-nums leading-none text-foreground">
      {value}
    </span>
    <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70 mt-1 font-semibold">
      {label}
    </span>
  </div>
);

const Dot = () => (
  <span className="text-muted-foreground/30 font-bold text-xl leading-none -mt-2" aria-hidden>
    :
  </span>
);

const WorldCupHypeCard: React.FC<WorldCupHypeCardProps> = ({
  variant = 'today',
  onSelectWC,
}) => {
  const { t } = useTranslation('home');
  const [parts, setParts] = useState<Parts>(() => computeParts());

  useEffect(() => {
    if (parts.started) return;
    const id = setInterval(() => setParts(computeParts()), 1000);
    return () => clearInterval(id);
  }, [parts.started]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-primary/20',
        'select-none touch-manipulation',
      )}
      style={{
        background:
          'linear-gradient(135deg, hsl(152 60% 40% / 0.18) 0%, hsl(222 47% 9%) 45%, hsl(45 70% 45% / 0.18) 100%)',
      }}
    >
      {/* Glow orbs */}
      <motion.div
        aria-hidden
        className="absolute -top-12 -left-8 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, hsl(var(--primary) / 0.35) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
        animate={{ x: [0, 12, 0], y: [0, 8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-10 -right-8 w-44 h-44 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, hsl(45 70% 50% / 0.32) 0%, transparent 70%)',
          filter: 'blur(22px)',
        }}
        animate={{ x: [0, -10, 0], y: [0, -8, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Subtle grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative p-5 space-y-4">
        {/* Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/40 backdrop-blur-sm border border-primary/25">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
              <span className="relative rounded-full bg-primary w-1.5 h-1.5" />
            </span>
            <Trophy className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-foreground/80">
              {t('worldCup.badge')}
            </span>
          </span>
        </div>

        {/* Title */}
        <div>
          <h3 className="font-display font-bold text-lg leading-tight text-foreground">
            {parts.started ? t('worldCup.titleLive') : t('worldCup.title')}
          </h3>
          <p className="text-xs text-muted-foreground/80 mt-0.5">
            {parts.started
              ? t('worldCup.subtitleLive')
              : t('worldCup.subtitleCountdown')}
          </p>
        </div>

        {/* Countdown OR Live pulse */}
        {parts.started ? (
          <div className="flex items-center justify-center py-3">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 border border-primary/30">
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-primary animate-ping" />
                <span className="relative rounded-full bg-primary w-2 h-2" />
              </span>
              <span className="text-sm font-bold text-primary">
                {t('worldCup.liveBadge')}
              </span>
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5 py-1">
            <TimeBlock value={pad(parts.d)} label={t('worldCup.days')} />
            <Dot />
            <TimeBlock value={pad(parts.h)} label={t('worldCup.hours')} />
            <Dot />
            <TimeBlock value={pad(parts.m)} label={t('worldCup.minutes')} />
            <Dot />
            <TimeBlock value={pad(parts.s)} label={t('worldCup.seconds')} />
          </div>
        )}

        {/* Meta line */}
        <div className="text-[11px] text-muted-foreground/80 text-center font-medium">
          {t('worldCup.meta')}
        </div>

        {/* CTA */}
        {onSelectWC && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onSelectWC}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 rounded-xl',
              'bg-primary text-primary-foreground font-semibold text-sm',
              'shadow-[0_4px_20px_hsl(152_60%_40%_/_0.35)]',
              'touch-manipulation active:opacity-90',
            )}
          >
            <Trophy className="w-4 h-4" />
            <span>
              {variant === 'upcoming'
                ? t('worldCup.ctaUpcoming')
                : t('worldCup.cta')}
            </span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default WorldCupHypeCard;
