import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, TrendingUp, Plus } from 'lucide-react';
import { Prediction, MatchInput } from '@/types/match';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useBetSlip } from '@/contexts/BetSlipContext';
import { cn } from '@/lib/utils';

interface AIRecommendationCardProps {
  predictions: Prediction[];
  matchInput: MatchInput;
}

const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({ predictions, matchInput }) => {
  const { addToSlip } = useBetSlip();
  
  // Get the main AI prediction (match result or highest confidence)
  const mainPrediction = predictions.find(p => p.type === 'Maç Sonucu') || predictions[0];
  
  if (!mainPrediction) return null;

  const aiConfidence = (mainPrediction.aiConfidence || 0) * 100;
  const mathConfidence = (mainPrediction.mathConfidence || 0) * 100;
  const avgConfidence = (aiConfidence + mathConfidence) / 2;

  const getConfidenceColor = (value: number) => {
    if (value >= 70) return 'text-emerald-400';
    if (value >= 50) return 'text-amber-400';
    return 'text-muted-foreground';
  };

  const handleAddToSlipClick = () => {
    addToSlip({
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-secondary/10 border border-primary/20 p-4 md:p-6"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">AI Önerisi</span>
          </div>
          <div className={cn(
            "px-3 py-1 rounded-full text-sm font-bold",
            avgConfidence >= 70 ? "bg-emerald-500/20 text-emerald-400" :
            avgConfidence >= 50 ? "bg-amber-500/20 text-amber-400" :
            "bg-muted text-muted-foreground"
          )}>
            %{Math.round(avgConfidence)} Güven
          </div>
        </div>

        {/* Main Prediction */}
        <div className="text-center mb-6">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {mainPrediction.prediction}
          </h3>
          <p className="text-sm text-muted-foreground">{mainPrediction.type}</p>
        </div>

        {/* Dual Progress Bars */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Sparkles className="w-3 h-3" /> AI
              </span>
              <span className={cn("font-semibold", getConfidenceColor(aiConfidence))}>
                %{Math.round(aiConfidence)}
              </span>
            </div>
            <Progress value={aiConfidence} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Brain className="w-3 h-3" /> Matematik
              </span>
              <span className={cn("font-semibold", getConfidenceColor(mathConfidence))}>
                %{Math.round(mathConfidence)}
              </span>
            </div>
            <Progress value={mathConfidence} className="h-2" />
          </div>
        </div>

        {/* Reasoning */}
        <p className="text-sm text-muted-foreground mb-6 line-clamp-2 md:line-clamp-3">
          {mainPrediction.reasoning}
        </p>

        {/* Add to Slip Button */}
        <Button 
          onClick={handleAddToSlipClick}
          className="w-full gap-2 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90"
        >
          <Plus className="w-4 h-4" />
          Kupona Ekle
        </Button>
      </div>
    </motion.div>
  );
};

export default AIRecommendationCard;
