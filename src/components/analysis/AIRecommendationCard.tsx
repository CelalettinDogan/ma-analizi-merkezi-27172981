import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, Plus, Star, AlertTriangle, Info } from 'lucide-react';
import { Prediction, MatchInput } from '@/types/match';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useBetSlip } from '@/contexts/BetSlipContext';
import { cn } from '@/lib/utils';
import ShareCard from '@/components/ShareCard';
import { formatMatchDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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

const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({ predictions, matchInput }) => {
  const { addToSlip } = useBetSlip();
  
  // Sort predictions by hybrid confidence (highest first) and select best one
  const sortedPredictions = [...predictions].sort((a, b) => {
    const aHybrid = getHybridConfidence(a);
    const bHybrid = getHybridConfidence(b);
    return bHybrid - aHybrid;
  });
  
  const mainPrediction = sortedPredictions[0];
  
  if (!mainPrediction) return null;

  const aiConfidence = (mainPrediction.aiConfidence || 0) * 100;
  const mathConfidence = (mainPrediction.mathConfidence || 0) * 100;
  const avgConfidence = (aiConfidence + mathConfidence) / 2;
  const confidenceLevel = getConfidenceLevel((aiConfidence + mathConfidence) / 200);

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
            {/* Best Pick Badge */}
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
              <Star className="w-3 h-3 mr-1" />
              En İyi Seçim
            </Badge>
          </div>
          {/* Confidence Level Badge */}
          <div className={cn(
            "px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5",
            confidenceLevel === 'yüksek' ? "bg-emerald-500/20 text-emerald-400" :
            confidenceLevel === 'orta' ? "bg-amber-500/20 text-amber-400" :
            "bg-muted text-muted-foreground"
          )}>
            {confidenceLevel === 'yüksek' && <Star className="w-3 h-3" />}
            {confidenceLevel === 'orta' && <Info className="w-3 h-3" />}
            {confidenceLevel === 'düşük' && <AlertTriangle className="w-3 h-3" />}
            {confidenceLevel === 'yüksek' ? 'Yüksek' : confidenceLevel === 'orta' ? 'Orta' : 'Düşük'} Güven
          </div>
        </div>

        {/* Main Prediction */}
        <div className="text-center mb-6">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {mainPrediction.prediction}
          </h3>
          <div className="flex items-center justify-center gap-2">
            <p className="text-sm text-muted-foreground">{mainPrediction.type}</p>
            <span className="text-xs text-primary font-medium">%{Math.round(avgConfidence)}</span>
          </div>
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
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 md:line-clamp-3">
          {mainPrediction.reasoning}
        </p>

        {/* External Factors Disclaimer */}
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-300/80">
              Bu analiz istatistiksel verilere dayanmaktadır. TD değişiklikleri, sakatlıklar ve 
              takım içi sorunlar gibi dış faktörler dikkate alınamamaktadır.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleAddToSlipClick}
            className="flex-1 gap-2 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90"
          >
            <Plus className="w-4 h-4" />
            Kupona Ekle
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
