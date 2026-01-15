import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, TrendingUp, Brain, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { getMLModelPerformance } from '@/services/autoVerifyService';
import { Skeleton } from '@/components/ui/skeleton';

interface MLPerformance {
  predictionType: string;
  accuracy: number;
  total: number;
  correct: number;
}

const PREDICTION_TYPE_LABELS: Record<string, string> = {
  'Maç Sonucu': 'Maç Sonucu',
  'Toplam Gol Alt/Üst': 'Alt/Üst 2.5',
  'Karşılıklı Gol': 'KG Var/Yok',
  'Doğru Skor': 'Doğru Skor',
  'İlk Yarı Sonucu': 'İY Sonucu',
};

interface MLPerformanceCardProps {
  refreshTrigger?: number;
}

const MLPerformanceCard: React.FC<MLPerformanceCardProps> = ({ refreshTrigger }) => {
  const [performance, setPerformance] = useState<MLPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      setIsLoading(true);
      try {
        const data = await getMLModelPerformance();
        setPerformance(data);
      } catch (error) {
        console.error('Error fetching ML performance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerformance();
  }, [refreshTrigger]);

  const overallAccuracy = performance.length > 0
    ? performance.reduce((sum, p) => sum + p.accuracy * p.total, 0) / 
      performance.reduce((sum, p) => sum + p.total, 0)
    : 0;

  const totalPredictions = performance.reduce((sum, p) => sum + p.total, 0);
  const totalCorrect = performance.reduce((sum, p) => sum + p.correct, 0);

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Model Performansı
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (performance.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Model Performansı
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Henüz yeterli veri yok.</p>
            <p className="text-xs mt-1">Tahminler doğrulandıkça model öğrenmeye başlayacak.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Model Performansı
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Stats */}
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Genel Başarı</span>
            </div>
            <span className="text-2xl font-bold gradient-text">
              %{overallAccuracy.toFixed(1)}
            </span>
          </div>
          <Progress value={overallAccuracy} className="h-2 mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{totalCorrect} doğru tahmin</span>
            <span>{totalPredictions} toplam</span>
          </div>
        </div>

        {/* Per Type Performance */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Tahmin Türüne Göre
          </h4>
          
          {performance
            .sort((a, b) => b.accuracy - a.accuracy)
            .map((perf, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">
                    {PREDICTION_TYPE_LABELS[perf.predictionType] || perf.predictionType}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {perf.correct}/{perf.total}
                    </span>
                    <span className={`font-medium ${
                      perf.accuracy >= 60 ? 'text-win' : 
                      perf.accuracy >= 40 ? 'text-draw' : 'text-loss'
                    }`}>
                      %{perf.accuracy.toFixed(0)}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={perf.accuracy} 
                  className="h-1.5" 
                />
              </div>
            ))}
        </div>

        {/* Learning Info */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-xs text-muted-foreground">
            <Brain className="w-3 h-3 inline mr-1" />
            AI modeli her doğrulamada öğrenir. Düşük doğruluk oranlarında daha temkinli tahminler yapar.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MLPerformanceCard;
