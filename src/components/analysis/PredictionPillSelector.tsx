import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Sparkles, Check, Star, AlertTriangle, Info } from 'lucide-react';
import { Prediction, MatchInput } from '@/types/match';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useBetSlip } from '@/contexts/BetSlipContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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

// Confidence level badge config
const confidenceLevelConfig = {
  'yüksek': { 
    icon: Star, 
    label: 'Yüksek', 
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
  },
  'orta': { 
    icon: Info, 
    label: 'Orta', 
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
  },
  'düşük': { 
    icon: AlertTriangle, 
    label: 'Düşük', 
    className: 'bg-muted text-muted-foreground border-border' 
  },
};

const confidenceColors = {
  'yüksek': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'orta': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'düşük': 'bg-muted text-muted-foreground border-border',
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
      {/* Pills Container */}
      <div className="flex flex-wrap gap-2">
        {sortedPredictions.map((prediction, index) => {
          const isSelected = selectedIndex === index;
          const inSlip = isInSlip(prediction);
          const hybridConfidence = getHybridConfidence(prediction);
          const confidenceLevel = getConfidenceLevel(hybridConfidence);
          const LevelIcon = confidenceLevelConfig[confidenceLevel].icon;
          
          return (
            <button
              key={index}
              onClick={() => setSelectedIndex(isSelected ? null : index)}
              className={cn(
                "relative px-3 py-2 rounded-xl text-sm font-medium transition-all border",
                "hover:scale-105 active:scale-95",
                isSelected 
                  ? "bg-primary/20 text-primary border-primary/40 shadow-lg shadow-primary/10" 
                  : confidenceLevelConfig[confidenceLevel].className,
                inSlip && "ring-2 ring-emerald-500/50"
              )}
            >
              <div className="flex items-center gap-2">
                {prediction.isAIPowered && <Sparkles className="w-3 h-3" />}
                <span>{prediction.type}</span>
                <LevelIcon className="w-3 h-3" />
                {inSlip && <Check className="w-3 h-3 text-emerald-400" />}
                <ChevronDown className={cn(
                  "w-3 h-3 transition-transform",
                  isSelected && "rotate-180"
                )} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded Detail */}
      <AnimatePresence>
        {selectedIndex !== null && sortedPredictions[selectedIndex] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {(() => {
              const selectedPrediction = sortedPredictions[selectedIndex];
              const hybridConfidence = getHybridConfidence(selectedPrediction);
              const confidenceLevel = getConfidenceLevel(hybridConfidence);
              const LevelIcon = confidenceLevelConfig[confidenceLevel].icon;
              
              return (
                <div className="p-4 rounded-xl bg-card border border-border/50 space-y-4">
                  {/* Prediction Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{selectedPrediction.type}</h4>
                      <p className="text-sm text-muted-foreground">Tahmin</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className={cn(
                        "px-4 py-2 rounded-lg text-lg font-bold",
                        confidenceLevelConfig[confidenceLevel].className
                      )}>
                        {selectedPrediction.prediction}
                      </div>
                      {/* Confidence Level Badge */}
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", confidenceLevelConfig[confidenceLevel].className)}
                      >
                        <LevelIcon className="w-3 h-3 mr-1" />
                        {confidenceLevelConfig[confidenceLevel].label} Güven (%{Math.round(hybridConfidence)})
                      </Badge>
                    </div>
                  </div>

                  {/* Confidence Bars */}
                  {selectedPrediction.isAIPowered && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> AI Güveni
                          </span>
                          <span className="font-medium">
                            %{Math.round((selectedPrediction.aiConfidence || 0) * 100)}
                          </span>
                        </div>
                        <Progress 
                          value={(selectedPrediction.aiConfidence || 0) * 100} 
                          className="h-1.5"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">📊 Matematik</span>
                          <span className="font-medium">
                            %{Math.round((selectedPrediction.mathConfidence || 0) * 100)}
                          </span>
                        </div>
                        <Progress 
                          value={(selectedPrediction.mathConfidence || 0) * 100} 
                          className="h-1.5"
                        />
                      </div>
                    </div>
                  )}

                  {/* Reasoning */}
                  <p className="text-sm text-muted-foreground">
                    {selectedPrediction.reasoning}
                  </p>

                  {/* Add to Slip */}
                  <Button
                    size="sm"
                    variant={isInSlip(selectedPrediction) ? "secondary" : "default"}
                    onClick={() => handleAddToSlipClick(selectedPrediction)}
                    disabled={isInSlip(selectedPrediction)}
                    className="w-full gap-2"
                  >
                    {isInSlip(selectedPrediction) ? (
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
