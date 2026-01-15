import React from 'react';
import { TrendingUp, TrendingDown, Clock, Target, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { OverallStats } from '@/types/prediction';

interface StatsOverviewProps {
  stats: OverallStats | null;
  isLoading: boolean;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted/50 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center text-muted-foreground">
          Henüz tahmin verisi bulunmuyor.
        </CardContent>
      </Card>
    );
  }

  const accuracy = stats.accuracy_percentage || 0;
  const highConfidenceAccuracy = stats.high_confidence_total > 0
    ? Math.round((stats.high_confidence_correct / stats.high_confidence_total) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Predictions */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Toplam Tahmin
          </CardTitle>
          <Target className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.total_predictions}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.pending_predictions} beklemede
          </p>
        </CardContent>
      </Card>

      {/* Accuracy Rate */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Doğruluk Oranı
          </CardTitle>
          {accuracy >= 50 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">%{accuracy}</div>
          <Progress value={accuracy} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {stats.correct_predictions}/{stats.correct_predictions + stats.incorrect_predictions} doğru
          </p>
        </CardContent>
      </Card>

      {/* Correct Predictions */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Doğru Tahminler
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">{stats.correct_predictions}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.incorrect_predictions} yanlış tahmin
          </p>
        </CardContent>
      </Card>

      {/* High Confidence Accuracy */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Yüksek Güvenli
          </CardTitle>
          <Award className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">%{highConfidenceAccuracy}</div>
          <Progress value={highConfidenceAccuracy} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {stats.high_confidence_correct}/{stats.high_confidence_total} yüksek güvenli
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsOverview;
