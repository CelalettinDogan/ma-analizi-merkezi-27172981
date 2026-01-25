import React, { useEffect, useState } from 'react';
import { FileText, Trash2, Clock, TrendingUp, RefreshCw, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getAnalysisSets, deleteAnalysisSet } from '@/services/analysisSetService';
import { AnalysisSet } from '@/types/analysisSet';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface SavedAnalysisListProps {
  isLoading?: boolean;
  onRefresh?: () => void;
  compact?: boolean;
}

const getResultBadge = (isCorrect: boolean | null) => {
  if (isCorrect === null) {
    return { text: 'Bekliyor', className: 'bg-amber-500/20 text-amber-500 border-amber-500/30' };
  }
  if (isCorrect) {
    return { text: 'Doğru', className: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' };
  }
  return { text: 'Yanlış', className: 'bg-red-500/20 text-red-500 border-red-500/30' };
};

const SavedAnalysisList: React.FC<SavedAnalysisListProps> = ({ isLoading: externalLoading, onRefresh, compact = false }) => {
  const [slips, setSlips] = useState<AnalysisSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadSlips = async () => {
    setIsLoading(true);
    try {
      const fetchedSets = await getAnalysisSets(compact ? 5 : 20);
      setSlips(fetchedSets);
    } catch (error) {
      console.error('Error loading analysis sets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSlips();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-verify');
      
      if (error) throw error;
      
      const verified = (data?.backfillVerified || 0) + (data?.verified || 0);
      
      if (verified > 0) {
        toast({ 
          title: 'Sonuçlar güncellendi', 
          description: `${verified} analiz doğrulandı` 
        });
      } else {
        toast({ 
          title: 'Güncel', 
          description: 'Tüm sonuçlar zaten güncel' 
        });
      }
      
      await loadSlips();
      onRefresh?.();
    } catch (error) {
      console.error('Refresh error:', error);
      toast({ 
        title: 'Hata', 
        description: 'Sonuçlar kontrol edilemedi', 
        variant: 'destructive' 
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteAnalysisSet(id);
    if (success) {
      toast({ title: 'Analiz seti silindi' });
      loadSlips();
      onRefresh?.();
    } else {
      toast({ title: 'Hata', description: 'Analiz seti silinemedi', variant: 'destructive' });
    }
  };

  const loading = isLoading || externalLoading;

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <FileText className="h-5 w-5 text-primary" />
            İncelenen Maçlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-foreground">
          <div className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-primary" />
            İncelenen Maçlar
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-primary"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Sonuçları kontrol et"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
          {compact && slips.length > 0 && (
            <Link to="/analysis-history">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                Tümü <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        {slips.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Henüz kaydedilmiş analiz yok</p>
            <p className="text-sm text-muted-foreground mt-1">
              Maç analizlerini kaydederek başlayın
            </p>
          </div>
        ) : (
          <ScrollArea className={cn("pr-2 sm:pr-4", compact ? "max-h-[300px]" : "max-h-[400px]")}>
            <div className="space-y-3">
          {slips.map((slip) => {
                const totalItems = slip.items?.length || 0;
                const verifiedItems = slip.items?.filter(i => i.is_correct !== null) || [];
                const correctItems = verifiedItems.filter(i => i.is_correct === true);
                const hasResults = verifiedItems.length > 0;
                
                return (
                  <div
                    key={slip.id}
                    className="bg-muted/50 rounded-lg p-3 space-y-2"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(slip.created_at), 'dd MMM yyyy, HH:mm', { locale: tr })}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {totalItems} Analiz
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {hasResults ? (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs px-1.5",
                              correctItems.length === verifiedItems.length 
                                ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                                : correctItems.length > 0
                                  ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
                                  : "bg-red-500/20 text-red-500 border-red-500/30"
                            )}
                          >
                            {correctItems.length}/{verifiedItems.length} Doğru
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs px-1.5">
                            <Clock className="h-3 w-3 mr-0.5" />
                            Bekliyor
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(slip.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Items preview */}
                    {slip.items && slip.items.length > 0 && (
                      <div className="space-y-1.5">
                        {slip.items.slice(0, 3).map((item) => {
                          const resultBadge = getResultBadge(item.is_correct);
                          const hasScore = item.home_score !== null && item.away_score !== null;
                          
                          return (
                            <div key={item.id} className="flex items-center gap-2 text-xs">
                              <TrendingUp className="h-3 w-3 text-primary flex-shrink-0" />
                              <span className="truncate text-muted-foreground flex-1">
                                {item.home_team} vs {item.away_team}
                                {hasScore && (
                                  <span className="ml-1 text-foreground">
                                    ({item.home_score}-{item.away_score})
                                  </span>
                                )}
                              </span>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs px-1 py-0 h-4 flex-shrink-0",
                                  resultBadge.className
                                )}
                              >
                                {resultBadge.text}
                              </Badge>
                            </div>
                          );
                        })}
                        {slip.items.length > 3 && (
                          <p className="text-xs text-muted-foreground pl-5">
                            +{slip.items.length - 3} daha fazla
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default SavedAnalysisList;
