import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PredictionStats, PREDICTION_TYPE_LABELS } from '@/types/prediction';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface PredictionTypeChartProps {
  stats: PredictionStats[];
  isLoading: boolean;
}

const PredictionTypeChart: React.FC<PredictionTypeChartProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Tahmin Türlerine Göre Başarı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stats.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Tahmin Türlerine Göre Başarı</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          Henüz veri bulunmuyor.
        </CardContent>
      </Card>
    );
  }

  // Sort by accuracy
  const sortedStats = [...stats].sort((a, b) => 
    (b.accuracy_percentage || 0) - (a.accuracy_percentage || 0)
  );

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Tahmin Türlerine Göre Başarı</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedStats.map((stat) => {
            const label = PREDICTION_TYPE_LABELS[stat.prediction_type] || stat.prediction_type;
            const accuracy = stat.accuracy_percentage || 0;
            const total = stat.correct_predictions + stat.incorrect_predictions;

            return (
              <div key={stat.prediction_type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <span className="text-sm font-bold text-primary">%{accuracy}</span>
                </div>
                <Progress 
                  value={accuracy} 
                  className="h-2"
                />
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    {stat.correct_predictions} doğru
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-red-500" />
                    {stat.incorrect_predictions} yanlış
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-yellow-500" />
                    {stat.pending_predictions} beklemede
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PredictionTypeChart;
