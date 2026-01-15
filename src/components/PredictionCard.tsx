import React from 'react';
import { Target, TrendingUp, Sparkles } from 'lucide-react';
import { Prediction, MatchInput } from '@/types/match';
import AddToSlipButton from '@/components/betslip/AddToSlipButton';
import { Progress } from '@/components/ui/progress';

interface PredictionCardProps {
  prediction: Prediction;
  index: number;
  matchInput?: MatchInput;
}

const confidenceColors = {
  düşük: 'bg-loss/20 text-loss border-loss/30',
  orta: 'bg-draw/20 text-draw border-draw/30',
  yüksek: 'bg-win/20 text-win border-win/30',
};

const PredictionCard: React.FC<PredictionCardProps> = ({ prediction, index, matchInput }) => {
  const aiPercentage = prediction.aiConfidence ? Math.round(prediction.aiConfidence * 100) : 0;
  const mathPercentage = prediction.mathConfidence ? Math.round(prediction.mathConfidence * 100) : 0;

  return (
    <div 
      className="glass-card p-6 animate-fade-in hover:border-primary/50 transition-all duration-300"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground">{prediction.type}</h4>
              {prediction.isAIPowered && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                  <Sparkles className="w-3 h-3" />
                  AI
                </span>
              )}
            </div>
            <p className="text-lg font-display font-bold gradient-text">{prediction.prediction}</p>
          </div>
        </div>
        <span className={`prediction-badge border ${confidenceColors[prediction.confidence]}`}>
          {prediction.confidence.charAt(0).toUpperCase() + prediction.confidence.slice(1)}
        </span>
      </div>

      {/* AI & Math Confidence Bars */}
      {prediction.isAIPowered && (prediction.aiConfidence || prediction.mathConfidence) && (
        <div className="mb-4 space-y-2 p-3 rounded-lg bg-muted/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Güveni
            </span>
            <span className="font-medium text-foreground">{aiPercentage}%</span>
          </div>
          <Progress value={aiPercentage} className="h-1.5" />
          
          <div className="flex items-center justify-between text-xs mt-2">
            <span className="text-muted-foreground">📊 Matematik</span>
            <span className="font-medium text-foreground">{mathPercentage}%</span>
          </div>
          <Progress value={mathPercentage} className="h-1.5" />
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <div className="flex items-start gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            {prediction.reasoning}
          </p>
        </div>
        
        {matchInput && (
          <div className="flex justify-end">
            <AddToSlipButton prediction={prediction} matchInput={matchInput} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionCard;
