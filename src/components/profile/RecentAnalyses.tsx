import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Heart, Star, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface RecentAnalysesProps {
  recentAnalyses: any[] | undefined;
  analysesLoading: boolean;
  favorites: any[];
  favoriteLeagues: any[];
  favoriteTeams: any[];
}

const getResultBadge = (isCorrect: boolean | null, verifiedAt: string | null) => {
  if (!verifiedAt) return { text: 'Bekliyor', className: 'bg-amber-500/20 text-amber-500 border-amber-500/30' };
  if (isCorrect) return { text: 'Doğru', className: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' };
  return { text: 'Yanlış', className: 'bg-red-500/20 text-red-500 border-red-500/30' };
};

const RecentAnalyses: React.FC<RecentAnalysesProps> = ({
  recentAnalyses, analysesLoading, favorites, favoriteLeagues, favoriteTeams,
}) => {
  const navigate = useNavigate();

  return (
    <Card className="glass-card">
      <CardContent className="p-4 space-y-4">
        <div>
          <h2 className="text-sm font-semibold font-display flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            Son Analizler
          </h2>
          {analysesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
            </div>
          ) : recentAnalyses && recentAnalyses.length > 0 ? (
            <div className="space-y-1.5">
              {recentAnalyses.map((analysis: any) => {
                const resultBadge = getResultBadge(analysis.is_correct, analysis.verified_at);
                const hasScore = analysis.home_score !== null && analysis.away_score !== null;
                return (
                  <div key={analysis.id} className="p-2.5 rounded-xl bg-muted/30 active:bg-muted/50 active:scale-[0.98] transition-all duration-150">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-medium truncate">
                            {analysis.home_team} vs {analysis.away_team}
                          </p>
                          {hasScore && (
                            <span className="text-micro text-muted-foreground flex-shrink-0">
                              ({analysis.home_score}-{analysis.away_score})
                            </span>
                          )}
                        </div>
                        <p className="text-micro text-muted-foreground mt-0.5">
                          {analysis.prediction_type}: {analysis.prediction_value}
                        </p>
                      </div>
                      <Badge variant="outline" className={`text-micro flex-shrink-0 ${resultBadge.className}`}>
                        {resultBadge.text}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <Sparkles className="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Henüz analiz yapılmamış</p>
              <Button variant="outline" size="sm" onClick={() => navigate('/')} className="mt-2 text-xs h-8">
                Analiz Yap
              </Button>
            </div>
          )}
        </div>

        <div className="border-t border-border/50 pt-4">
          <h2 className="text-sm font-semibold font-display flex items-center gap-2 mb-3">
            <Heart className="h-4 w-4 text-primary" />
            Favorilerim
          </h2>
          {favorites.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">Henüz favori eklenmedi</p>
          ) : (
            <div className="space-y-2.5">
              {favoriteLeagues.length > 0 && (
                <div>
                  <p className="text-micro text-muted-foreground mb-1.5">Ligler</p>
                  <div className="flex flex-wrap gap-1.5">
                    {favoriteLeagues.map((fav) => (
                      <Badge key={fav.id} variant="outline" className="gap-1 text-xs">
                        <Star className="h-2.5 w-2.5 text-primary" />
                        {fav.favorite_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {favoriteTeams.length > 0 && (
                <div>
                  <p className="text-micro text-muted-foreground mb-1.5">Takımlar</p>
                  <div className="flex flex-wrap gap-1.5">
                    {favoriteTeams.map((fav) => (
                      <Badge key={fav.id} variant="outline" className="gap-1 text-xs">
                        <Star className="h-2.5 w-2.5 text-primary" />
                        {fav.favorite_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentAnalyses;
