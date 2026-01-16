import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Sparkles, Check } from 'lucide-react';
import { Prediction, MatchInput } from '@/types/match';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useBetSlip } from '@/contexts/BetSlipContext';
import { cn } from '@/lib/utils';

interface PredictionPillSelectorProps {
  predictions: Prediction[];
  matchInput: MatchInput;
}

const confidenceColors = {
  'yüksek': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'orta': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'düşük': 'bg-muted text-muted-foreground border-border',
};

const PredictionPillSelector: React.FC<PredictionPillSelectorProps> = ({ predictions, matchInput }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { addToSlip, items } = useBetSlip();

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
        {predictions.map((prediction, index) => {
          const isSelected = selectedIndex === index;
          const inSlip = isInSlip(prediction);
          
          return (
            <button
              key={index}
              onClick={() => setSelectedIndex(isSelected ? null : index)}
              className={cn(
                "relative px-3 py-2 rounded-xl text-sm font-medium transition-all border",
                "hover:scale-105 active:scale-95",
                isSelected 
                  ? "bg-primary/20 text-primary border-primary/40 shadow-lg shadow-primary/10" 
                  : confidenceColors[prediction.confidence],
                inSlip && "ring-2 ring-emerald-500/50"
              )}
            >
              <div className="flex items-center gap-2">
                {prediction.isAIPowered && <Sparkles className="w-3 h-3" />}
                <span>{prediction.type}</span>
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
        {selectedIndex !== null && predictions[selectedIndex] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-card border border-border/50 space-y-4">
              {/* Prediction Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">{predictions[selectedIndex].type}</h4>
                  <p className="text-sm text-muted-foreground">Tahmin</p>
                </div>
                <div className={cn(
                  "px-4 py-2 rounded-lg text-lg font-bold",
                  confidenceColors[predictions[selectedIndex].confidence]
                )}>
                  {predictions[selectedIndex].prediction}
                </div>
              </div>

              {/* Confidence Bars */}
              {predictions[selectedIndex].isAIPowered && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI Güveni
                      </span>
                      <span className="font-medium">
                        %{Math.round((predictions[selectedIndex].aiConfidence || 0) * 100)}
                      </span>
                    </div>
                    <Progress 
                      value={(predictions[selectedIndex].aiConfidence || 0) * 100} 
                      className="h-1.5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">📊 Matematik</span>
                      <span className="font-medium">
                        %{Math.round((predictions[selectedIndex].mathConfidence || 0) * 100)}
                      </span>
                    </div>
                    <Progress 
                      value={(predictions[selectedIndex].mathConfidence || 0) * 100} 
                      className="h-1.5"
                    />
                  </div>
                </div>
              )}

              {/* Reasoning */}
              <p className="text-sm text-muted-foreground">
                {predictions[selectedIndex].reasoning}
              </p>

              {/* Add to Slip */}
              <Button
                size="sm"
                variant={isInSlip(predictions[selectedIndex]) ? "secondary" : "default"}
                onClick={() => handleAddToSlipClick(predictions[selectedIndex])}
                disabled={isInSlip(predictions[selectedIndex])}
                className="w-full gap-2"
              >
                {isInSlip(predictions[selectedIndex]) ? (
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PredictionPillSelector;
