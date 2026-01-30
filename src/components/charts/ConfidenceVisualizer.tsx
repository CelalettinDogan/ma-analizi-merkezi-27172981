import React from 'react';
import { motion } from 'framer-motion';
import { Prediction } from '@/types/match';
import { Card } from '@/components/ui/card';
import { Target, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfidenceVisualizerProps {
  predictions: Prediction[];
}

const ConfidenceVisualizer: React.FC<ConfidenceVisualizerProps> = ({ predictions }) => {
  const getConfidenceValue = (confidence: string): number => {
    switch (confidence.toLowerCase()) {
      case 'yüksek': return 85;
      case 'orta': return 55;
      case 'düşük': return 25;
      default: return 50;
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'yüksek': return 'bg-win';
      case 'orta': return 'bg-draw';
      case 'düşük': return 'bg-loss';
      default: return 'bg-muted';
    }
  };

  const getConfidenceTextColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'yüksek': return 'text-win';
      case 'orta': return 'text-draw';
      case 'düşük': return 'text-loss';
      default: return 'text-muted-foreground';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'yüksek': return <CheckCircle2 className="w-4 h-4 text-win" />;
      case 'orta': return <Target className="w-4 h-4 text-draw" />;
      case 'düşük': return <AlertCircle className="w-4 h-4 text-loss" />;
      default: return null;
    }
  };

  // Calculate overall confidence
  const avgConfidence = predictions.reduce((acc, p) => acc + getConfidenceValue(p.confidence), 0) / predictions.length;
  
  // Count by confidence level
  const confidenceCounts = predictions.reduce((acc, p) => {
    const level = p.confidence.toLowerCase();
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-display font-bold text-foreground">
            Güven Skoru Analizi
          </h3>
          <p className="text-sm text-muted-foreground">
            Tahminlerin güvenilirlik değerlendirmesi
          </p>
        </div>
      </div>

      {/* Overall Confidence Gauge */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Ortalama Güven</span>
          <span className={cn(
            "font-bold text-lg",
            avgConfidence >= 70 ? "text-win" : avgConfidence >= 40 ? "text-draw" : "text-loss"
          )}>
            %{avgConfidence.toFixed(0)}
          </span>
        </div>
        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${avgConfidence}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              avgConfidence >= 70 ? "bg-gradient-to-r from-win/50 to-win" : 
              avgConfidence >= 40 ? "bg-gradient-to-r from-draw/50 to-draw" : 
              "bg-gradient-to-r from-loss/50 to-loss"
            )}
          />
          {/* Markers */}
          <div className="absolute inset-0 flex items-center">
            <div className="w-1/3 border-r border-background/50" />
            <div className="w-1/3 border-r border-background/50" />
            <div className="w-1/3" />
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Düşük</span>
          <span>Orta</span>
          <span>Yüksek</span>
        </div>
      </div>

      {/* Confidence Distribution */}
      <div className="grid grid-cols-3 gap-2 xs:gap-4 mb-6">
        <div className="text-center p-2 xs:p-3 rounded-lg bg-win/10 border border-win/20">
          <p className="text-xl xs:text-2xl font-bold text-win">{confidenceCounts['yüksek'] || 0}</p>
          <p className="text-[10px] xs:text-xs text-muted-foreground">Yüksek</p>
        </div>
        <div className="text-center p-2 xs:p-3 rounded-lg bg-draw/10 border border-draw/20">
          <p className="text-xl xs:text-2xl font-bold text-draw">{confidenceCounts['orta'] || 0}</p>
          <p className="text-[10px] xs:text-xs text-muted-foreground">Orta</p>
        </div>
        <div className="text-center p-2 xs:p-3 rounded-lg bg-loss/10 border border-loss/20">
          <p className="text-xl xs:text-2xl font-bold text-loss">{confidenceCounts['düşük'] || 0}</p>
          <p className="text-[10px] xs:text-xs text-muted-foreground">Düşük</p>
        </div>
      </div>

      {/* Individual Predictions */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Tahmin Detayları</h4>
        {predictions.map((prediction, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 xs:gap-2 min-w-0 flex-1">
                {getConfidenceIcon(prediction.confidence)}
                <span className="text-xs xs:text-sm font-medium truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[180px]">
                  {prediction.type}
                </span>
              </div>
              <span className={cn("text-xs xs:text-sm font-bold whitespace-nowrap shrink-0", getConfidenceTextColor(prediction.confidence))}>
                {prediction.prediction}
              </span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getConfidenceValue(prediction.confidence)}%` }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  getConfidenceColor(prediction.confidence)
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ConfidenceVisualizer;
