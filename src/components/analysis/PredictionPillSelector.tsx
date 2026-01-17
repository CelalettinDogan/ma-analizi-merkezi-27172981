import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Check, Star, AlertTriangle, Info } from 'lucide-react';
import { Prediction, MatchInput } from '@/types/match';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useBetSlip } from '@/contexts/BetSlipContext';
import { cn } from '@/lib/utils';
import { CONFIDENCE_THRESHOLDS } from '@/constants/predictions';

interface PredictionPillSelectorProps {
  predictions: Prediction[];
  matchInput: MatchInput;
}

// Helper to calculate hybrid confidence value
const getHybridConfidence = (prediction: Prediction): number => {
  const ai = prediction.aiConfidence || 0;
  const math = prediction.mathConfidence || 0;
  return ((ai + math) / 2) * 100;
};

// Helper to get confidence level
const getConfidenceLevel = (percentage: number): 'yüksek' | 'orta' | 'düşük' => {
  if (percentage >= CONFIDENCE_THRESHOLDS.HIGH) return 'yüksek';
  if (percentage >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'orta';
  return 'düşük';
};

// Confidence level config - simplified
const confidenceConfig = {
  'yüksek': { 
    icon: Star, 
    color: 'text-emerald-400',
    pillClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
    inSlipClass: 'bg-emerald-500/30 text-emerald-300 border-emerald-400'
  },
  'orta': { 
    icon: Info, 
    color: 'text-amber-400',
    pillClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20',
    inSlipClass: 'bg-amber-500/30 text-amber-300 border-amber-400'
  },
  'düşük': { 
    icon: AlertTriangle, 
    color: 'text-muted-foreground',
    pillClass: 'bg-muted/50 text-muted-foreground border-border hover:bg-muted',
    inSlipClass: 'bg-muted text-foreground border-muted-foreground'
  },
};

const PredictionPillSelector: React.FC<PredictionPillSelectorProps> = ({ predictions, matchInput }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { addToSlip, items } = useBetSlip();

  // Sort predictions by hybrid confidence (highest first)
  const sortedPredictions = useMemo(() => {
    return [...predictions].sort((a, b) => getHybridConfidence(b) - getHybridConfidence(a));
  }, [predictions]);

  const isInSlip = (prediction: Prediction) => {
    return items.some(
      item => 
        item.homeTeam === matchInput.homeTeam &&
        item.awayTeam === matchInput.awayTeam &&
        item.predictionType === prediction.type
    );
  };

  const handleAddToSlipClick = (prediction: Prediction) => {
    addToSlip({
      homeTeam: matchInput.homeTeam,
      awayTeam: matchInput.awayTeam,
      league: matchInput.league,
      matchDate: matchInput.matchDate,
      predictionType: prediction.type,
      predictionValue: prediction.prediction,
      confidence: prediction.confidence,
      odds: null,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      {/* Section Title */}
      <h4 className="text-sm font-medium text-muted-foreground">Diğer Tahminler</h4>

      {/* Pills Container - Horizontal Scroll on Mobile with hint */}
      <div className="relative">
        <div className="overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
          <div className="flex gap-2 min-w-max">
          {sortedPredictions.map((prediction, index) => {
            const isSelected = selectedIndex === index;
            const inSlip = isInSlip(prediction);
            const hybridConfidence = getHybridConfidence(prediction);
            const confidenceLevel = getConfidenceLevel(hybridConfidence);
            const { icon: LevelIcon, pillClass, inSlipClass } = confidenceConfig[confidenceLevel];
            
            return (
              <button
                key={index}
                onClick={() => setSelectedIndex(isSelected ? null : index)}
                className={cn(
                  "relative px-3 py-2 rounded-xl text-sm font-medium transition-all border whitespace-nowrap",
                  "active:scale-95",
                  isSelected 
                    ? "bg-primary/20 text-primary border-primary/50 shadow-lg shadow-primary/10" 
                    : inSlip 
                      ? inSlipClass
                      : pillClass
                )}
              >
                <div className="flex items-center gap-2">
                  {/* Simplified: just type + confidence icon */}
                  <span>{prediction.type}</span>
                  <LevelIcon className="w-3.5 h-3.5" />
                  {inSlip && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>
            );
          })}
          </div>
        </div>
        {/* Scroll hint gradient for mobile */}
        <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none md:hidden" />
      </div>

      {/* Expanded Detail - Slide Up Animation */}
      <AnimatePresence>
        {selectedIndex !== null && sortedPredictions[selectedIndex] && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {(() => {
              const selectedPrediction = sortedPredictions[selectedIndex];
              const hybridConfidence = getHybridConfidence(selectedPrediction);
              const confidenceLevel = getConfidenceLevel(hybridConfidence);
              const { color } = confidenceConfig[confidenceLevel];
              const inSlip = isInSlip(selectedPrediction);
              
              return (
                <div className="p-4 rounded-xl bg-card border border-border/50 space-y-4">
                  {/* Prediction Header - Cleaner */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{selectedPrediction.type}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Tahmin Detayı</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-foreground">
                        {selectedPrediction.prediction}
                      </div>
                      <span className={cn("text-sm font-medium", color)}>
                        %{Math.round(hybridConfidence)} güven
                      </span>
                    </div>
                  </div>

                  {/* Single Hybrid Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Hibrit Skor
                      </span>
                      <span className={cn("font-medium", color)}>%{Math.round(hybridConfidence)}</span>
                    </div>
                    <Progress value={hybridConfidence} className="h-2" />
                  </div>

                  {/* Reasoning */}
                  {selectedPrediction.reasoning && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedPrediction.reasoning}
                    </p>
                  )}

                  {/* Add to Slip */}
                  <Button
                    size="sm"
                    onClick={() => handleAddToSlipClick(selectedPrediction)}
                    disabled={inSlip}
                    className={cn(
                      "w-full gap-2",
                      inSlip && "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                    )}
                  >
                    {inSlip ? (
                      <>
                        <Check className="w-4 h-4" />
                        Kuponda
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Kupona Ekle
                      </>
                    )}
                  </Button>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PredictionPillSelector;
