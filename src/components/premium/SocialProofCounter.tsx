import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

/**
 * Shows the number of users who upgraded to Premium in the last 7 days.
 * Falls back to a generic message if the count cannot be loaded
 * (e.g. RLS prevents reading premium_subscriptions for free users).
 */
const SocialProofCounter: React.FC = () => {
  const { t } = useTranslation('premium');
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: c, error } = await supabase
        .from('premium_subscriptions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo);
      if (cancelled) return;
      if (error) {
        // RLS may block this for non-admin users; show fallback message instead.
        setCount(0);
      } else {
        setCount(c ?? 0);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (count === null) return null;

  const message = count > 0
    ? t('social.thisWeek', { count })
    : t('social.thisWeekZero');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="flex items-center justify-center gap-1.5 py-1"
    >
      <Users className="w-3.5 h-3.5 text-emerald-500/70 shrink-0" />
      <span className="text-[11px] text-muted-foreground font-medium">{message}</span>
    </motion.div>
  );
};

export default SocialProofCounter;
