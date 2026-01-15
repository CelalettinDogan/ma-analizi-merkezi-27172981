import React, { useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PredictionRecord } from '@/types/prediction';
import { verifyPrediction } from '@/services/predictionService';
import { CheckCircle2, XCircle, Clock, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RecentPredictionsProps {
  predictions: PredictionRecord[];
  isLoading: boolean;
  onRefresh: () => void;
}

const RecentPredictions: React.FC<RecentPredictionsProps> = ({ 
  predictions, 
  isLoading,
  onRefresh 
}) => {
  const { toast } = useToast();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerify = async () => {
    if (!verifyingId || homeScore === '' || awayScore === '') return;

    setIsSubmitting(true);
    try {
      await verifyPrediction(verifyingId, parseInt(homeScore), parseInt(awayScore));
      toast({
        title: 'Başarılı',
        description: 'Tahmin doğrulandı.',
      });
      setVerifyingId(null);
      setHomeScore('');
      setAwayScore('');
      onRefresh();
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Tahmin doğrulanamadı.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (isCorrect: boolean | null) => {
    if (isCorrect === null) return <Clock className="w-4 h-4 text-yellow-500" />;
    if (isCorrect) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      'yüksek': 'default',
      'orta': 'secondary',
      'düşük': 'destructive',
    };
    return (
      <Badge variant={variants[confidence] || 'secondary'} className="text-xs">
        {confidence}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Son Tahminler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group predictions by match
  const groupedByMatch = predictions.reduce((acc, pred) => {
    const key = `${pred.home_team}-${pred.away_team}-${pred.match_date}`;
    if (!acc[key]) {
      acc[key] = {
        homeTeam: pred.home_team,
        awayTeam: pred.away_team,
        matchDate: pred.match_date,
        league: pred.league,
        predictions: [],
        homeScore: pred.home_score,
        awayScore: pred.away_score,
      };
    }
    acc[key].predictions.push(pred);
    return acc;
  }, {} as Record<string, { homeTeam: string; awayTeam: string; matchDate: string; league: string; predictions: PredictionRecord[]; homeScore: number | null; awayScore: number | null }>);

  const matches = Object.values(groupedByMatch).slice(0, 10);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Son Tahminler</CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Henüz tahmin bulunmuyor.
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match, idx) => (
              <div key={idx} className="p-4 bg-muted/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {match.homeTeam} vs {match.awayTeam}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {match.league} • {format(new Date(match.matchDate), 'dd MMMM yyyy', { locale: tr })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {match.homeScore !== null && match.awayScore !== null ? (
                      <Badge variant="outline" className="text-sm">
                        {match.homeScore} - {match.awayScore}
                      </Badge>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setVerifyingId(match.predictions[0]?.id)}
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Sonuç Gir
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border">
                          <DialogHeader>
                            <DialogTitle>Maç Sonucunu Girin</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <p className="text-sm text-muted-foreground">
                              {match.homeTeam} vs {match.awayTeam}
                            </p>
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <label className="text-xs text-muted-foreground">{match.homeTeam}</label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={homeScore}
                                  onChange={(e) => setHomeScore(e.target.value)}
                                  className="bg-muted/50"
                                />
                              </div>
                              <span className="text-muted-foreground">-</span>
                              <div className="flex-1">
                                <label className="text-xs text-muted-foreground">{match.awayTeam}</label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={awayScore}
                                  onChange={(e) => setAwayScore(e.target.value)}
                                  className="bg-muted/50"
                                />
                              </div>
                            </div>
                            <Button 
                              onClick={handleVerify}
                              disabled={isSubmitting || homeScore === '' || awayScore === ''}
                              className="w-full"
                            >
                              {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {match.predictions.map((pred) => (
                    <div 
                      key={pred.id} 
                      className="flex items-center justify-between p-2 bg-background/50 rounded text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon(pred.is_correct)}
                        <span className="text-muted-foreground">{pred.prediction_type}:</span>
                        <span className="font-medium text-foreground">{pred.prediction_value}</span>
                      </div>
                      {getConfidenceBadge(pred.confidence)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentPredictions;
