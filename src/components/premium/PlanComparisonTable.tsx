import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useHapticTap } from '@/hooks/useHapticTap';

type PlanKey = 'basic' | 'plus' | 'pro';
type Cell = string | true | false;

interface Row {
  labelKey: string;
  free: Cell;
  basic: Cell;
  plus: Cell;
  pro: Cell;
}

const rows: Row[] = [
  { labelKey: 'analysis', free: 'analysisFree', basic: 'analysisUnlimited', plus: 'analysisUnlimited', pro: 'analysisUnlimited' },
  { labelKey: 'chat',     free: 'chatFree',     basic: '3',                  plus: '5',                  pro: '10' },
  { labelKey: 'history',  free: 'historyFree',  basic: 'historyPremium',     plus: 'historyPremium',     pro: 'historyPremium' },
  { labelKey: 'ads',      free: false,          basic: true,                 plus: true,                 pro: true },
  { labelKey: 'deepStats',free: false,          basic: true,                 plus: true,                 pro: true },
  { labelKey: 'priority', free: false,          basic: false,                plus: true,                 pro: true },
];

/**
 * Mobile-first 2-column comparison: Free vs selected plan.
 * Plan switcher is a pill segmented control. Selected plan column glows.
 */
const PlanComparisonTable: React.FC = () => {
  const { t } = useTranslation('premium');
  
  const tap = useHapticTap('light');
  const [selected, setSelected] = useState<PlanKey>('plus');

  const renderCell = (val: Cell, highlight: boolean) => {
    if (val === true) {
      return (
        <div className={cn(
          'mx-auto w-6 h-6 rounded-full flex items-center justify-center',
          highlight ? 'bg-primary/20 shadow-[0_0_12px_hsl(var(--primary)/0.4)]' : 'bg-emerald-500/15',
        )}>
          <Check className={cn('w-3.5 h-3.5', highlight ? 'text-primary' : 'text-emerald-400')} strokeWidth={3} />
        </div>
      );
    }
    if (val === false) {
      return (
        <div className="mx-auto w-6 h-6 rounded-full bg-muted/30 flex items-center justify-center">
          <X className="w-3 h-3 text-muted-foreground/50" strokeWidth={2.5} />
        </div>
      );
    }
    return (
      <span className={cn(
        'text-[12px] font-semibold',
        highlight ? 'text-primary' : 'text-foreground/80',
      )}>
        {t(`compare.rows.${val}`, { defaultValue: val })}
      </span>
    );
  };

  const planOptions: { key: PlanKey; label: string }[] = [
    { key: 'basic', label: t('compare.cols.basic') },
    { key: 'plus',  label: t('compare.cols.plus') },
    { key: 'pro',   label: t('compare.cols.pro') },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden shadow-[0_8px_32px_-8px_hsl(0_0%_0%/0.4)]"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h3 className="text-[15px] font-bold text-foreground">{t('compare.title')}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {t('compare.selectPlan', 'Tap a plan to compare with Free')}
        </p>
      </div>

      {/* Segmented control */}
      <div className="px-4 mb-3">
        <div className="relative inline-flex w-full bg-muted/40 rounded-2xl p-1 border border-border/30">
          {planOptions.map((opt, idx) => (
            <button
              key={opt.key}
              onClick={() => { tap(); setSelected(opt.key); }}
              className={cn(
                'relative flex-1 z-10 py-2 rounded-xl text-[12px] font-bold transition-colors',
                selected === opt.key ? 'text-primary-foreground' : 'text-muted-foreground',
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {selected === opt.key && (
                <motion.div
                  layoutId="planCompareSelector"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-emerald-600 shadow-[0_4px_16px_-2px_hsl(var(--primary)/0.45)]"
                />
              )}
              <span className="relative">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2-column compare grid */}
      <div className="px-2 pb-2">
        <div className="grid grid-cols-[1.2fr_0.8fr_1fr] items-center px-2 pb-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60">
            {t('compare.cols.feature')}
          </span>
          <span className="text-[11px] font-bold text-muted-foreground/80 text-center">
            {t('compare.cols.free')}
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={selected}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="text-[11px] font-extrabold text-primary text-center"
            >
              {t(`compare.cols.${selected}`)}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="rounded-2xl bg-background/40 overflow-hidden">
          {rows.map((row, idx) => {
            const planVal = row[selected];
            return (
              <div
                key={row.labelKey}
                className={cn(
                  'grid grid-cols-[1.2fr_0.8fr_1fr] items-center px-3 py-2.5',
                  idx !== rows.length - 1 && 'border-b border-border/20',
                )}
              >
                <span className="text-[12px] text-muted-foreground">
                  {t(`compare.rows.${row.labelKey}`)}
                </span>
                <div className="text-center">{renderCell(row.free, false)}</div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${selected}-${row.labelKey}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.12 }}
                    className="text-center"
                  >
                    {renderCell(planVal, true)}
                  </motion.div>
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky CTA strip */}
      <button
        onClick={() => { tap(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        className="w-full px-4 py-3.5 bg-gradient-to-r from-primary/15 to-emerald-500/10 border-t border-primary/20 text-[13px] font-bold text-primary active:opacity-80 transition-opacity flex items-center justify-center gap-1.5"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {t('compare.upgradeTo', { plan: t(`compare.cols.${selected}`), defaultValue: `Upgrade to ${t(`compare.cols.${selected}`)} →` })}
      </button>
    </motion.section>
  );
};

export default PlanComparisonTable;
