import React from 'react';
import { motion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { MatchAnalysis, Prediction } from '@/types/match';
import { getHybridConfidence, getConfidenceLevel, cn } from '@/lib/utils';
import ConfidenceBreakdownTooltip from './ConfidenceBreakdownTooltip';

interface AnalysisHeroSummaryProps {
  analysis: MatchAnalysis;
}

const AnalysisHeroSummary: React.FC<AnalysisHeroSummaryProps> = ({ analysis }) => {
  const sortedPredictions = [...analysis.predictions].sort(
    (a, b) => getHybridConfidence(b) - getHybridConfidence(a)
  );
  const mainPrediction = sortedPredictions[0];
  if (!mainPrediction) return null;

  const hybridConfidence = getHybridConfidence(mainPrediction);
  const confidenceLevel = getConfidenceLevel(hybridConfidence);

  const xGTotal = analysis.poissonData
    ? (analysis.poissonData.expectedHomeGoals + analysis.poissonData.expectedAwayGoals)
    : null;

  const mostLikelyScore = analysis.poissonData?.scoreProbabilities?.[0];

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
    <div className="px-4 pb-4 space-y-3">
      {/* Teams row */}
      <div className="flex items-center justify-center gap-2.5 pt-2 min-w-0">
        {analysis.input.homeTeamCrest && (
          <img src={analysis.input.homeTeamCrest} alt="" className="w-8 h-8 object-contain shrink-0" />
        )}
        <span className="text-sm font-medium text-foreground truncate max-w-[120px] text-center">
          {analysis.input.homeTeam}
        </span>
        <span className="text-xs text-muted-foreground shrink-0">vs</span>
        <span className="text-sm font-medium text-foreground truncate max-w-[120px] text-center">
          {analysis.input.awayTeam}
        </span>
        {analysis.input.awayTeamCrest && (
          <img src={analysis.input.awayTeamCrest} alt="" className="w-8 h-8 object-contain shrink-0" />
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
        className="flex items-center justify-center gap-4 flex-wrap"
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
                style={{ willChange: 'stroke-dashoffset' }}
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

      {/* Tap hint — static chevron */}
      <div className="flex flex-col items-center gap-1 pt-1 pb-1">
        <ChevronUp className="w-5 h-5 text-muted-foreground/40" />
        <span className="text-[10px] text-muted-foreground/40 tracking-wide">
          Detaylar için dokun
        </span>
      </div>
    </div>
  );
};

export default AnalysisHeroSummary;
