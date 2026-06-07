import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const WC_KICKOFF = new Date('2026-06-11T18:00:00Z').getTime();

const computeDays = () => {
  const diff = WC_KICKOFF - Date.now();
  if (diff <= 0) return { days: 0, started: true };
  return { days: Math.ceil(diff / 86400000), started: false };
};

const WCHeroBanner: React.FC = () => {
  const { t } = useTranslation('common');
  const [state, setState] = useState(computeDays);

  useEffect(() => {
    if (state.started) return;
    const id = setInterval(() => setState(computeDays()), 60_000);
    return () => clearInterval(id);
  }, [state.started]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl p-5 select-none"
      style={{
        background:
          'linear-gradient(135deg, hsl(222 47% 11%) 0%, hsl(222 47% 7%) 60%, hsl(152 60% 14%) 100%)',
      }}
    >
      {/* Emerald glow */}
      <motion.div
        aria-hidden
        className="absolute -top-16 -left-10 w-48 h-48 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.35) 0%, transparent 70%)',
          filter: 'blur(22px)',
        }}
        animate={{ x: [0, 14, 0], y: [0, 10, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Amber glow */}
      <motion.div
        aria-hidden
        className="absolute -bottom-14 -right-10 w-52 h-52 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(45 70% 50% / 0.28) 0%, transparent 70%)',
          filter: 'blur(24px)',
        }}
        animate={{ x: [0, -12, 0], y: [0, -8, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Trophy silhouette */}
      <div className="absolute -right-3 -top-3 opacity-[0.08] pointer-events-none">
        <Trophy className="w-32 h-32 text-amber-400" strokeWidth={1.2} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inset-0 rounded-full bg-destructive animate-ping opacity-75" />
            <span className="relative rounded-full bg-destructive w-1.5 h-1.5" />
          </span>
          <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-destructive">
            {state.started ? t('wc.hero.liveCoverage') : t('wc.hero.comingSoon')}
          </span>
        </div>

        <h1 className="font-display font-black text-2xl leading-tight text-foreground tracking-tight">
          {t('wc.hero.title')}
        </h1>

        <p className="text-xs text-muted-foreground/90 mt-1">
          {t('wc.hero.subtitle')}
        </p>

        {!state.started && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] font-bold text-amber-400 tabular-nums">
              {t('wc.hero.daysToKickoff', { count: state.days })}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default WCHeroBanner;
