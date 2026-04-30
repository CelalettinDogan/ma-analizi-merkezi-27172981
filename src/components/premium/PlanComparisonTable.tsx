import React from 'react';
import { motion } from 'framer-motion';
import { Check, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type CellValue = string | boolean;

interface Row {
  labelKey: string;
  values: [CellValue, CellValue, CellValue, CellValue]; // free, basic, plus, pro
}

const rows: Row[] = [
  { labelKey: 'analysis', values: ['analysisFree', 'analysisUnlimited', 'analysisUnlimited', 'analysisUnlimited'] as any },
  { labelKey: 'chat',     values: ['chatFree', '3', '5', '10'] },
  { labelKey: 'history',  values: ['historyFree', 'historyPremium', 'historyPremium', 'historyPremium'] as any },
  { labelKey: 'ads',      values: [false, true, true, true] },
  { labelKey: 'deepStats', values: [false, true, true, true] },
  { labelKey: 'priority', values: [false, false, true, true] },
];

const PlanComparisonTable: React.FC = () => {
  const { t } = useTranslation('premium');

  const renderCell = (val: CellValue, isHighlight: boolean) => {
    if (val === true) return <Check className={cn('w-4 h-4 mx-auto', isHighlight ? 'text-primary' : 'text-emerald-500')} />;
    if (val === false) return <Minus className="w-3 h-3 mx-auto text-muted-foreground/40" />;
    // String — could be a translation key under compare.rows or a literal number string
    const translated = t(`compare.rows.${val as string}`, { defaultValue: val as string });
    return <span className={cn('text-[11px]', isHighlight ? 'font-bold text-primary' : 'text-foreground')}>{translated}</span>;
  };

  const cols = [
    { key: 'free' as const, label: t('compare.cols.free'), highlight: false },
    { key: 'basic' as const, label: t('compare.cols.basic'), highlight: false },
    { key: 'plus' as const, label: t('compare.cols.plus'), highlight: true },
    { key: 'pro' as const, label: t('compare.cols.pro'), highlight: false },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-2xl border border-border/40 bg-card/50 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-border/40">
        <h3 className="text-sm font-bold text-foreground">{t('compare.title')}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">{t('compare.subtitle')}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead className="bg-muted/20">
            <tr>
              <th className="text-left font-semibold text-muted-foreground px-3 py-2.5 sticky left-0 bg-muted/20">
                {t('compare.cols.feature')}
              </th>
              {cols.map(c => (
                <th
                  key={c.key}
                  className={cn(
                    'text-center font-bold px-2 py-2.5',
                    c.highlight ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.labelKey} className={cn('border-t border-border/20', idx % 2 === 1 && 'bg-muted/[0.04]')}>
                <td className="text-left text-muted-foreground px-3 py-2.5 sticky left-0 bg-card">
                  {t(`compare.rows.${row.labelKey}`)}
                </td>
                {row.values.map((v, i) => (
                  <td
                    key={i}
                    className={cn('text-center px-2 py-2.5', cols[i].highlight && 'bg-primary/[0.04]')}
                  >
                    {renderCell(v, cols[i].highlight)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
};

export default PlanComparisonTable;
