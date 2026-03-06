import React from 'react';
import { motion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { MatchAnalysis, Prediction } from '@/types/match';
import { getHybridConfidence, getConfidenceLevel, cn } from '@/lib/utils';
import ConfidenceBreakdownTooltip from './ConfidenceBreakdownTooltip';

interface AnalysisHeroSummaryProps {
  analysis: MatchAnalysis;
}

const AnalysisHeroSummary: React.FC<AnalysisHeroSummaryProps> = ({ analysis, onExpand }) => {
  // Best prediction
  const sortedPredictions = [...analysis.predictions].sort(
    (a, b) => getHybridConfidence(b) - getHybridConfidence(a)
  );
  const mainPrediction = sortedPredictions[0];
  if (!mainPrediction) return null;

  const hybridConfidence = getHybridConfidence(mainPrediction);
  const confidenceLevel = getConfidenceLevel(hybridConfidence);

  // xG total
  const xGTotal = analysis.poissonData
    ? (analysis.poissonData.expectedHomeGoals + analysis.poissonData.expectedAwayGoals)
    : null;

  // Most likely score
  const mostLikelyScore = analysis.poissonData?.scoreProbabilities?.[0];

  // Confidence color
  const confColor = {
    yüksek: 'text-emerald-400',
    orta: 'text-amber-400',
    düşük: 'text-muted-foreground',
  }[confidenceLevel];

  const confRingColor = {
    yüksek: 'stroke-emerald-400',
    orta: 'stroke-amber-400',
    düşük: 'stroke-muted-foreground',
  }[confidenceLevel];

  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference - (hybridConfidence / 100) * circumference;

  return (
    <div className="px-4 pb-4 space-y-4">
      {/* Teams row */}
      <div className="flex items-center justify-center gap-3 pt-2">
        {analysis.input.homeTeamCrest && (
          <img src={analysis.input.homeTeamCrest} alt="" className="w-8 h-8 object-contain" />
        )}
        <span className="text-sm font-medium text-foreground break-words min-w-0 text-center">
          {analysis.input.homeTeam}
        </span>
        <span className="text-xs text-muted-foreground">vs</span>
        <span className="text-sm font-medium text-foreground break-words min-w-0 text-center">
          {analysis.input.awayTeam}
        </span>
        {analysis.input.awayTeamCrest && (
          <img src={analysis.input.awayTeamCrest} alt="" className="w-8 h-8 object-contain" />
        )}
      </div>

      {/* Main prediction */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center"
      >
        <h2 className="text-xl font-bold text-foreground mb-1">
          {mainPrediction.prediction}
        </h2>
        <p className="text-xs text-muted-foreground">{mainPrediction.type}</p>
      </motion.div>

      {/* Stats row: Confidence + xG + Score */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center gap-6"
      >
        {/* Circular confidence */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" className="stroke-muted/30" strokeWidth="4" />
              <motion.circle
                cx="32" cy="32" r="28" fill="none"
                className={confRingColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn("text-sm font-bold", confColor)}>
                %{Math.round(hybridConfidence)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-micro text-muted-foreground">Güven</span>
            <ConfidenceBreakdownTooltip prediction={mainPrediction} hybridConfidence={hybridConfidence} />
          </div>
        </div>

        {/* xG Total */}
        {xGTotal !== null && (
          <div className="flex flex-col items-center gap-1">
            <div className="w-16 h-16 rounded-2xl bg-muted/30 border border-border/30 flex items-center justify-center">
              <span className="text-lg font-bold text-foreground">{xGTotal.toFixed(1)}</span>
            </div>
            <span className="text-micro text-muted-foreground">xG Toplam</span>
          </div>
        )}

        {/* Most likely score */}
        {mostLikelyScore && (
          <div className="flex flex-col items-center gap-1">
            <div className="w-16 h-16 rounded-2xl bg-muted/30 border border-border/30 flex items-center justify-center">
              <span className="text-lg font-bold text-foreground">
                {mostLikelyScore.homeGoals}-{mostLikelyScore.awayGoals}
              </span>
            </div>
            <span className="text-micro text-muted-foreground">Olası Skor</span>
          </div>
        )}
      </motion.div>

      {/* Expand button */}
      <Button
        variant="outline"
        onClick={onExpand}
        className="w-full gap-2 rounded-xl border-primary/30 text-primary hover:bg-primary/10 min-h-[44px]"
      >
        <Target className="w-4 h-4" />
        Detaylı Analiz
        <ChevronUp className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default AnalysisHeroSummary;
