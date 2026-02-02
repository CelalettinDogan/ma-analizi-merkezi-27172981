import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, Star, AlertTriangle, Info, ChevronDown } from 'lucide-react';
import { Prediction, MatchInput } from '@/types/match';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAnalysisSet } from '@/contexts/AnalysisSetContext';
import { cn } from '@/lib/utils';
import ShareCard from '@/components/ShareCard';
import { formatMatchDate } from '@/lib/utils';
import { CONFIDENCE_THRESHOLDS } from '@/constants/predictions';

interface AIRecommendationCardProps {
  predictions: Prediction[];
  matchInput: MatchInput;
}

// Helper to calculate hybrid confidence value
const getHybridConfidence = (prediction: Prediction): number => {
  const ai = prediction.aiConfidence || 0;
  const math = prediction.mathConfidence || 0;
  return (ai + math) / 2;
};

// Helper to get confidence level
const getConfidenceLevel = (value: number): 'yüksek' | 'orta' | 'düşük' => {
  const percentage = value * 100;
  if (percentage >= CONFIDENCE_THRESHOLDS.HIGH) return 'yüksek';
  if (percentage >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'orta';
  return 'düşük';
};

const confidenceConfig = {
  'yüksek': { icon: Star, label: 'Yüksek Güven', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  'orta': { icon: Info, label: 'Orta Güven', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  'düşük': { icon: AlertTriangle, label: 'Düşük Güven', color: 'text-muted-foreground', bg: 'bg-muted' },
};

const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({ predictions, matchInput }) => {
  const { addToSet, items } = useAnalysisSet();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showFullReasoning, setShowFullReasoning] = useState(false);
  
  // Sort predictions by hybrid confidence (highest first) and select best one
  const sortedPredictions = [...predictions].sort((a, b) => {
    const aHybrid = getHybridConfidence(a);
    const bHybrid = getHybridConfidence(b);
    return bHybrid - aHybrid;
  });
  
  const mainPrediction = sortedPredictions[0];
  
  if (!mainPrediction) return null;

  const hybridConfidence = getHybridConfidence(mainPrediction) * 100;
  const confidenceLevel = getConfidenceLevel(getHybridConfidence(mainPrediction));
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
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-secondary/10 border border-primary/20"
    >
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      <div className="relative z-10 p-4 md:p-5">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">AI Önerisi</span>
          </div>
          {/* Single Confidence Badge */}
          <div className={cn("px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5", bg, color)}>
            <ConfidenceIcon className="w-3.5 h-3.5" />
            {confidenceLabel}
          </div>
        </div>

        {/* Main Prediction - Cleaner */}
        <div className="text-center mb-5">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            {mainPrediction.prediction}
          </h3>
          <p className="text-sm text-muted-foreground">{mainPrediction.type}</p>
        </div>

        {/* Single Hybrid Confidence Bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">Hibrit Güven Skoru</span>
            <span className={cn("font-bold text-sm", color)}>%{Math.round(hybridConfidence)}</span>
          </div>
          <Progress value={hybridConfidence} className="h-2.5" />
        </div>

        {/* Reasoning - Expandable */}
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
                className="text-xs text-primary hover:underline mt-1"
              >
                {showFullReasoning ? 'Daha az göster' : 'Devamını oku'}
              </button>
            )}
          </div>
        )}

        {/* Collapsible Disclaimer */}
        <button
          onClick={() => setShowDisclaimer(!showDisclaimer)}
          className="w-full flex items-center justify-between text-xs text-amber-400/70 hover:text-amber-400 transition-colors mb-4"
        >
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Dış faktörler hakkında
          </span>
          <ChevronDown className={cn("w-3 h-3 transition-transform", showDisclaimer && "rotate-180")} />
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

        {/* Action Buttons - Simplified with single CTA */}
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleAddToSetClick}
            disabled={isInSet}
            className={cn(
              "flex-1 gap-2",
              isInSet 
                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" 
                : "bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90"
            )}
          >
            {isInSet ? (
              <>
                <Star className="w-4 h-4" />
                Sette
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Analize Ekle
              </>
            )}
          </Button>

          {/* Share Icon - Compact */}
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
