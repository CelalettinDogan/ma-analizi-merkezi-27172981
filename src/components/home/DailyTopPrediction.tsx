import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { getSmartPicks, SmartPick } from '@/services/smartPicksService';
import PremiumTeaserOverlay from '@/components/premium/PremiumTeaserOverlay';
import { cn } from '@/lib/utils';

interface DailyTopPredictionProps {
  isPremium: boolean;
}

const TEAM_SHORT: Record<string, string> = {
  'FC Internazionale Milano': 'Inter', 'Manchester United FC': 'Man Utd',
  'Manchester City FC': 'Man City', 'FC Barcelona': 'Barcelona',
  'Paris Saint-Germain FC': 'PSG', 'FC Bayern München': 'Bayern',
  'Borussia Dortmund': 'Dortmund', 'Atletico de Madrid': 'Atlético',
  'Bayer 04 Leverkusen': 'Leverkusen', 'Real Sociedad de Fútbol': 'R. Sociedad',
};

const shorten = (name: string) => TEAM_SHORT[name] || name.replace(/ FC$| CF$| SC$/i, '').trim();

const DailyTopPrediction: React.FC<DailyTopPredictionProps> = ({ isPremium }) => {
  const { t } = useTranslation('home');

  const { data: picks, isLoading } = useQuery({
    queryKey: ['daily-top-prediction'],
    queryFn: () => getSmartPicks(1),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const pick = picks?.[0];
  if (isLoading || !pick) return null;

  const confidenceColor =
    pick.hybridConfidence >= 70 ? 'text-emerald-400' :
    pick.hybridConfidence >= 50 ? 'text-amber-400' : 'text-muted-foreground';

  const barColor =
    pick.hybridConfidence >= 70 ? 'bg-emerald-500' :
    pick.hybridConfidence >= 50 ? 'bg-amber-500' : 'bg-muted-foreground';

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
    >
      <Card className="relative overflow-hidden bg-card/60 backdrop-blur-sm border border-border/50">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-amber-500" />
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-foreground">
                {t('dailyPick.title', 'Günün Seçimi')}
              </span>
            </div>
            <span className={cn('text-xs font-bold tabular-nums', confidenceColor)}>
              %{Math.round(pick.hybridConfidence)}
            </span>
          </div>

          {/* Content — blurred for free users */}
          <div className={cn('transition-all duration-300', !isPremium && 'blur-lg select-none')}>
            {/* Teams */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-sm font-semibold text-foreground truncate flex-1 text-left">
                {shorten(pick.homeTeam)}
              </span>
              <span className="text-xs text-muted-foreground font-medium px-2">vs</span>
              <span className="text-sm font-semibold text-foreground truncate flex-1 text-right">
                {shorten(pick.awayTeam)}
              </span>
            </div>

            {/* Prediction */}
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground">
                {pick.predictionType}:
              </span>
              <span className="text-xs font-bold text-foreground">
                {pick.predictionValue}
              </span>
            </div>

            {/* Confidence bar */}
            <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', barColor)}
                initial={{ width: 0 }}
                animate={{ width: `${pick.hybridConfidence}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {pick.league} · {pick.matchDate}
            </p>
          </div>

          {/* Premium Teaser Overlay for free users */}
          {!isPremium && (
            <PremiumTeaserOverlay
              className="h-full top-0"
              label={t('dailyPick.unlockCta', 'Premium ile Gör')}
              source="daily-pick"
            />
          )}
        </CardContent>
      </Card>
    </motion.section>
  );
};

export default DailyTopPrediction;
