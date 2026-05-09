import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Lock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { isToday, isTomorrow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { getSmartPicks, type SmartPick } from '@/services/smartPicksService';
import { formatPredictionType, formatPredictionValue } from '@/utils/predictionLabels';

interface DailyPickCardProps {
  isPremium?: boolean;
}

const cleanTeam = (name: string) => name.replace(/ FC$| CF$| SC$/i, '').trim();

const DailyPickCard: React.FC<DailyPickCardProps> = ({ isPremium = false }) => {
  const { t } = useTranslation('home');
  const navigate = useNavigate();

  const { data: picks } = useQuery({
    queryKey: ['daily-pick-card'],
    queryFn: () => getSmartPicks(1),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const pick: SmartPick | undefined = picks?.[0];
  if (!pick) return null;

  const hasPrediction = !!pick.predictionType && pick.hybridConfidence > 0;

  let dayLabel = '';
  try {
    const d = parseISO(pick.matchDate);
    if (isToday(d)) dayLabel = t('todays.dates.today');
    else if (isTomorrow(d)) dayLabel = t('todays.dates.tomorrow');
  } catch {}

  const confColor =
    pick.hybridConfidence >= 70 ? 'text-emerald-400' :
    pick.hybridConfidence >= 50 ? 'text-amber-400' : 'text-muted-foreground';

  const handleClick = () => {
    if (!isPremium) navigate('/premium', { state: { from: 'daily_pick' } });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="px-4"
    >
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.10] via-amber-500/[0.04] to-transparent">
        {/* Shimmer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute inset-0 animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-amber-500/[0.07] to-transparent" />
        </div>

        {/* Amber accent */}
        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-amber-500/70" />

        <div className="relative p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="text-sm font-bold text-amber-500">
                {t('dailyPick.title', 'Günün Skoru')}
              </span>
            </div>
            {dayLabel && (
              <span className="text-micro font-medium text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded-full">
                {dayLabel}
              </span>
            )}
          </div>

          {/* Subtitle */}
          <p className="text-micro text-muted-foreground/80 leading-tight">
            {t('dailyPick.subtitle', 'Yapay zekânın bugünkü en yüksek güvenli skoru')}
          </p>

          {/* Match teams */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <span className="text-sm font-semibold truncate">{cleanTeam(pick.homeTeam)}</span>
            <span className="text-micro text-muted-foreground/50">vs</span>
            <span className="text-sm font-semibold truncate text-right">{cleanTeam(pick.awayTeam)}</span>
          </div>
          <div className="text-micro text-muted-foreground/60 -mt-1">{pick.league}</div>

          {/* Prediction row / placeholder */}
          {!hasPrediction ? (
            <div className="rounded-xl bg-card/40 border border-border/30 px-3 py-2.5 text-center">
              <span className="text-xs text-muted-foreground">
                {t('dailyPick.placeholder', 'Günün skoru hazırlanıyor — birkaç saat içinde açılıyor')}
              </span>
            </div>
          ) : isPremium ? (
            <div className="flex items-center justify-between rounded-xl bg-card/40 border border-border/30 px-3 py-2.5">
              <div className="flex flex-col min-w-0">
                <span className="text-micro text-muted-foreground/70">{formatPredictionType(t, pick.predictionType)}</span>
                <span className="text-sm font-bold text-foreground truncate">{formatPredictionValue(t, pick.predictionValue)}</span>
              </div>
              <span className={cn('text-base font-extrabold tabular-nums', confColor)}>
                %{Math.round(pick.hybridConfidence)}
              </span>
            </div>
          ) : (
            <div className="relative rounded-xl bg-card/40 border border-border/30 px-3 py-2.5">
              <div className="flex items-center justify-between blur-[6px] select-none pointer-events-none">
                <div className="flex flex-col">
                  <span className="text-micro">{formatPredictionType(t, pick.predictionType)}</span>
                  <span className="text-sm font-bold">{formatPredictionValue(t, pick.predictionValue)}</span>
                </div>
                <span className="text-base font-extrabold tabular-nums">%{Math.round(pick.hybridConfidence)}</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-4 h-4 text-amber-500" />
              </div>
            </div>
          )}

          {/* CTA */}
          {!isPremium ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleClick}
              className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-amber-500 text-amber-950 font-bold text-sm shadow-md shadow-amber-500/25 active:bg-amber-400"
            >
              <Lock className="w-4 h-4" />
              {t('dailyPick.unlockCta', 'Premium ile Aç')}
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
};

export default DailyPickCard;
