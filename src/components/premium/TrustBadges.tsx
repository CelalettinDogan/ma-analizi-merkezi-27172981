import React from 'react';
import { motion } from 'framer-motion';
import { Shield, RotateCcw, Zap, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TrustBadges: React.FC = () => {
  const { t } = useTranslation('premium');
  const items = [
    { icon: RotateCcw, key: 'cancelAnytime' },
    { icon: Zap,       key: 'instantAccess' },
    { icon: Lock,      key: 'securePayment' },
    { icon: Shield,    key: 'moneyBack' },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="grid grid-cols-2 gap-2"
    >
      {items.map(({ icon: Icon, key }) => (
        <div
          key={key}
          className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-muted/15 border border-border/25"
        >
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5 text-primary/80" />
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground leading-tight">
            {t(`trust.${key}`)}
          </span>
        </div>
      ))}
    </motion.div>
  );
};

export default TrustBadges;
