import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { usePredictorStats, RANK_CONFIG } from '@/hooks/usePredictorStats';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const PredictorRankCard: React.FC = () => {
  const { stats, rank, isLoading } = usePredictorStats();
  const { t } = useTranslation('predictor');
  const config = RANK_CONFIG[rank];

  if (isLoading || stats.total_predictions < 1) return null;

  const accuracyDisplay = stats.accuracy !== null ? `${stats.accuracy}%` : '—';
  const progressValue = stats.accuracy ?? 0;

  return (
    <Card className="glass-card overflow-hidden border-border/40">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            className={`h-10 w-10 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center text-lg`}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            {config.icon}
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {t(`ranks.${rank}`)}
            </p>
            <p className="text-micro text-muted-foreground">
              {t('accuracy')}: {accuracyDisplay}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">{stats.total_predictions}</p>
            <p className="text-micro text-muted-foreground">{t('totalPredictions')}</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-micro text-muted-foreground">
            <span>{t('verified')}: {stats.verified_predictions}</span>
            <span>{t('correct')}: {stats.correct_predictions}</span>
          </div>
          <Progress value={progressValue} className="h-1.5" />
          {(stats.verified_predictions_14d ?? 0) > 0 && (
            <div className="flex justify-between text-micro text-muted-foreground pt-1">
              <span>{t('last14Days')}</span>
              <span className="font-semibold text-foreground">
                {stats.accuracy_14d ?? 0}% · {stats.correct_predictions_14d}/{stats.verified_predictions_14d}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PredictorRankCard;
