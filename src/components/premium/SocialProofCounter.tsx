import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

/**
 * Avatar-stack + animated counter showing recent Premium upgrades.
 * Renders nothing if count < 5 (avoids weak social proof).
 */
const MIN_COUNT = 5;

const useCountUp = (target: number | null, duration = 900) => {
  const [val, setVal] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === null) return;
    let raf = 0;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const p = Math.min(1, (ts - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return val;
};

const Avatar: React.FC<{ from: string; to: string; idx: number }> = ({ from, to, idx }) => (
  <div
    className="w-7 h-7 rounded-full ring-2 ring-background shrink-0"
    style={{
      background: `linear-gradient(135deg, ${from}, ${to})`,
      marginLeft: idx === 0 ? 0 : -10,
      zIndex: 10 - idx,
    }}
    aria-hidden="true"
  />
);

const SocialProofCounter: React.FC = () => {
  const { t } = useTranslation('premium');
  const [count, setCount] = useState<number | null>(null);
  const animated = useCountUp(count, 900);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: c, error } = await supabase
        .from('premium_subscriptions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo);
      if (cancelled) return;
      setCount(error ? 0 : (c ?? 0));
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (count === null || count < MIN_COUNT) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex items-center justify-center"
    >
      <div className="inline-flex items-center gap-2.5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20 pl-1.5 pr-3.5 py-1.5">
        {/* Avatar stack */}
        <div className="flex items-center">
          <Avatar from="hsl(152 60% 45%)" to="hsl(170 55% 40%)" idx={0} />
          <Avatar from="hsl(45 70% 55%)" to="hsl(35 75% 50%)" idx={1} />
          <Avatar from="hsl(195 65% 50%)" to="hsl(215 60% 45%)" idx={2} />
        </div>

        {/* Live dot */}
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
          <span className="relative rounded-full h-1.5 w-1.5 bg-emerald-400" />
        </span>

        <span className="text-[12px] font-semibold text-foreground/90">
          <span className="font-extrabold text-emerald-400 tabular-nums">{animated}</span>
          {' '}
          <span className="text-muted-foreground">{t('social.joinedThisWeek', 'upgraded this week')}</span>
        </span>
      </div>
    </motion.div>
  );
};

export default SocialProofCounter;
