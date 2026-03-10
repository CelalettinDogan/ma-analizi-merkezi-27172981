import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, Star, AlertTriangle, Info, ChevronDown } from 'lucide-react';
import { Prediction, MatchInput } from '@/types/match';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAnalysisSet } from '@/contexts/AnalysisSetContext';
import { cn, getHybridConfidence, getConfidenceLevel } from '@/lib/utils';
import ShareCard from '@/components/ShareCard';
import { formatMatchDate } from '@/lib/utils';
import ConfidenceBreakdownTooltip from './ConfidenceBreakdownTooltip';

interface AIRecommendationCardProps {
  predictions: Prediction[];
  matchInput: MatchInput;
}

const confidenceConfig = {
  'yüksek': { icon: Star, label: 'Yüksek Güven', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  'orta': { icon: Info, label: 'Orta Güven', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  'düşük': { icon: AlertTriangle, label: 'Düşük Güven', color: 'text-muted-foreground', bg: 'bg-muted' },
};

const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({ predictions, matchInput }) => {
  const { addToSet, items } = useAnalysisSet();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showFullReasoning, setShowFullReasoning] = useState(false);
  
  const sortedPredictions = [...predictions].sort((a, b) => {
    if (a.marketScore !== undefined && b.marketScore !== undefined) {
      return (b.marketScore || 0) - (a.marketScore || 0);
    }
    return getHybridConfidence(b) - getHybridConfidence(a);
  });
  
  const mainPrediction = sortedPredictions[0];
  if (!mainPrediction) return null;

  const hybridConfidence = getHybridConfidence(mainPrediction);
  const confidenceLevel = getConfidenceLevel(hybridConfidence);
  const { icon: ConfidenceIcon, label: confidenceLabel, color, bg } = confidenceConfig[confidenceLevel];

  const isInSet = items.some(
    item => 
      item.homeTeam === matchInput.homeTeam &&
      item.awayTeam === matchInput.awayTeam &&
      item.predictionType === mainPrediction.type
  );

  const handleAddToSetClick = () => {
    addToSet({
      homeTeam: matchInput.homeTeam,
      awayTeam: matchInput.awayTeam,
      league: matchInput.league,
      matchDate: matchInput.matchDate,
      predictionType: mainPrediction.type,
      predictionValue: mainPrediction.prediction,
      confidence: mainPrediction.confidence,
      odds: null,
    });
  };

  const reasoning = mainPrediction.reasoning || '';
  const isLongReasoning = reasoning.length > 150;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl bg-primary/5 border border-primary/20"
    >
      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">AI Önerisi</span>
          </div>
          <div className={cn("px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5", bg, color)}>
            <ConfidenceIcon className="w-3.5 h-3.5" />
            {confidenceLabel}
          </div>
        </div>

        {/* Main Prediction */}
        <div className="text-center mb-5">
          <h3 className="text-2xl font-bold text-foreground mb-1">
            {mainPrediction.prediction}
          </h3>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">{mainPrediction.type}</p>
            {mainPrediction.riskLevel && (
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                mainPrediction.riskLevel === 'low' ? 'bg-emerald-500/20 text-emerald-400' :
                mainPrediction.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                'bg-red-500/20 text-red-400'
              )}>
                {mainPrediction.riskLevel === 'low' ? 'Düşük Risk' :
                 mainPrediction.riskLevel === 'medium' ? 'Orta Risk' : 'Yüksek Risk'}
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">
                {mainPrediction.marketScore !== undefined ? 'Market Skoru' : 'Hibrit Güven Skoru'}
              </span>
              <ConfidenceBreakdownTooltip prediction={mainPrediction} hybridConfidence={hybridConfidence} />
            </div>
            <span className={cn("font-bold text-sm", color)}>%{Math.round(hybridConfidence)}</span>
          </div>
          <Progress value={hybridConfidence} className="h-2" />
        </div>

        {/* Reasoning */}
        {reasoning && (
          <div className="mb-4">
            <p className={cn(
              "text-sm text-muted-foreground transition-all",
              !showFullReasoning && isLongReasoning && "line-clamp-2"
            )}>
              {reasoning}
            </p>
            {isLongReasoning && (
              <button
                onClick={() => setShowFullReasoning(!showFullReasoning)}
                className="min-h-[44px] text-xs text-primary active:opacity-70 mt-1 touch-manipulation flex items-center transition-opacity"
              >
                {showFullReasoning ? 'Daha az göster' : 'Devamını oku'}
              </button>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <button
          onClick={() => setShowDisclaimer(!showDisclaimer)}
          className="w-full min-h-[44px] flex items-center justify-between text-xs text-amber-400/70 active:bg-muted/20 rounded-lg px-1 transition-colors mb-4 touch-manipulation"
        >
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Dış faktörler hakkında
          </span>
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showDisclaimer && "rotate-180")} />
        </button>
        
        <AnimatePresence>
          {showDisclaimer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
                <p className="text-xs text-amber-300/80">
                  Bu analiz istatistiksel verilere dayanmaktadır. TD değişiklikleri, sakatlıklar ve 
                  takım içi sorunlar gibi dış faktörler dikkate alınamamaktadır.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            onClick={handleAddToSetClick}
            disabled={isInSet}
            size="lg"
            className={cn(
              "flex-1 gap-2 min-h-[48px] touch-manipulation",
              isInSet 
                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" 
                : "bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90"
            )}
          >
            {isInSet ? (
              <><Star className="w-4 h-4" /> Sette</>
            ) : (
              <><Plus className="w-4 h-4" /> Analize Ekle</>
            )}
          </Button>

          <ShareCard
            homeTeam={matchInput.homeTeam}
            awayTeam={matchInput.awayTeam}
            prediction={mainPrediction.prediction}
            confidence={mainPrediction.confidence}
            league={matchInput.league}
            matchDate={formatMatchDate(matchInput.matchDate)}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default AIRecommendationCard;
