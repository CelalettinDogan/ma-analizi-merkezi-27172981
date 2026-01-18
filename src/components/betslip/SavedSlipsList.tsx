import React, { useEffect, useState } from 'react';
import { Receipt, Trash2, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getBetSlips, deleteBetSlip, getBetSlipStats } from '@/services/betSlipService';
import { BetSlip } from '@/types/betslip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SavedSlipsListProps {
  isLoading?: boolean;
  onRefresh?: () => void;
}

const statusConfig = {
  pending: { label: 'Bekliyor', shortLabel: 'Bekleniyor', icon: Clock, className: 'bg-draw/20 text-draw border-draw/30' },
  won: { label: 'Kazandı', shortLabel: 'Kazandı', icon: CheckCircle, className: 'bg-win/20 text-win border-win/30' },
  lost: { label: 'Kaybetti', shortLabel: 'Kaybetti', icon: XCircle, className: 'bg-loss/20 text-loss border-loss/30' },
  partial: { label: 'Kısmi', shortLabel: 'Kısmi', icon: TrendingUp, className: 'bg-muted text-muted-foreground border-muted' },
};

const confidenceLabels: Record<string, string> = {
  düşük: 'Düşük',
  orta: 'Orta', 
  yüksek: 'Yüksek',
};

const confidenceColors: Record<string, string> = {
  düşük: 'text-loss',
  orta: 'text-draw',
  yüksek: 'text-win',
};

const SavedSlipsList: React.FC<SavedSlipsListProps> = ({ isLoading: externalLoading, onRefresh }) => {
  const [slips, setSlips] = useState<BetSlip[]>([]);
  const [stats, setStats] = useState({ total: 0, won: 0, lost: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadSlips = async () => {
    setIsLoading(true);
    try {
      const [fetchedSlips, fetchedStats] = await Promise.all([
        getBetSlips(20),
        getBetSlipStats(user?.id),
      ]);
      setSlips(fetchedSlips);
      setStats(fetchedStats);
    } catch (error) {
      console.error('Error loading slips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSlips();
  }, []);

  const handleDelete = async (id: string) => {
    const success = await deleteBetSlip(id);
    if (success) {
      toast({ title: 'Kupon silindi' });
      loadSlips();
      onRefresh?.();
    } else {
      toast({ title: 'Hata', description: 'Kupon silinemedi', variant: 'destructive' });
    }
  };

  const loading = isLoading || externalLoading;

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg">
            <Receipt className="h-5 w-5 text-primary" />
            Kuponlarım
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-foreground">
          <div className="flex items-center gap-2 text-base sm:text-lg">
            <Receipt className="h-5 w-5 text-primary" />
            Kuponlarım
          </div>
          <div className="flex gap-2 text-xs sm:text-sm font-normal">
            <Badge variant="outline" className="bg-win/20 text-win border-win/30 px-2 py-0.5">
              <span className="hidden sm:inline">{stats.won} Kazanç</span>
              <span className="sm:hidden">{stats.won}K</span>
            </Badge>
            <Badge variant="outline" className="bg-loss/20 text-loss border-loss/30 px-2 py-0.5">
              <span className="hidden sm:inline">{stats.lost} Kayıp</span>
              <span className="sm:hidden">{stats.lost}L</span>
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        {slips.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Henüz kaydedilmiş kupon yok</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tahminleri kupona ekleyerek başlayın
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-2 sm:pr-4">
            <div className="space-y-3">
              {slips.map((slip) => {
                const StatusIcon = statusConfig[slip.status].icon;
                const totalItems = slip.items?.length || 0;
                const verifiedItems = slip.items?.filter(i => i.is_correct !== null).length || 0;
                const correctItems = slip.items?.filter(i => i.is_correct === true).length || 0;
                
                return (
                  <div
                    key={slip.id}
                    className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(slip.created_at), 'dd MMM yyyy, HH:mm', { locale: tr })}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {totalItems} Tahmin
                        </p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        {/* Status badge - responsive */}
                        {slip.is_verified ? (
                          <Badge
                            variant="outline"
                            className={cn("text-xs px-1.5 sm:px-2", statusConfig[slip.status].className)}
                          >
                            <StatusIcon className="h-3 w-3 mr-0.5 sm:mr-1" />
                            <span className="hidden sm:inline">
                              {correctItems}/{totalItems} - {statusConfig[slip.status].label}
                            </span>
                            <span className="sm:hidden">
                              {correctItems}/{totalItems}
                            </span>
                          </Badge>
                        ) : verifiedItems > 0 ? (
                          <Badge variant="outline" className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-xs px-1.5 sm:px-2">
                            <Clock className="h-3 w-3 mr-0.5 sm:mr-1" />
                            <span className="hidden sm:inline">{verifiedItems}/{totalItems} Doğrulandı</span>
                            <span className="sm:hidden">{verifiedItems}/{totalItems}</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className={cn("text-xs px-1.5 sm:px-2", statusConfig[slip.status].className)}
                          >
                            <StatusIcon className="h-3 w-3 mr-0.5 sm:mr-1" />
                            <span className="hidden sm:inline">{statusConfig[slip.status].label}</span>
                            <span className="sm:hidden">{statusConfig[slip.status].shortLabel.charAt(0)}</span>
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(slip.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Items - Mobile-first 2-row layout */}
                    {slip.items && slip.items.length > 0 && (
                      <div className="space-y-2">
                        {slip.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="space-y-1 py-1.5 border-b border-border/30 last:border-0">
                            {/* Row 1: Status + Teams + Score */}
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              {/* Result indicator */}
                              {item.is_correct === true && (
                                <CheckCircle className="w-3.5 h-3.5 text-win flex-shrink-0" />
                              )}
                              {item.is_correct === false && (
                                <XCircle className="w-3.5 h-3.5 text-loss flex-shrink-0" />
                              )}
                              {item.is_correct === null && (
                                <Clock className="w-3.5 h-3.5 text-draw flex-shrink-0" />
                              )}
                              
                              {/* Teams - truncate for mobile */}
                              <span className="text-xs sm:text-sm text-foreground truncate flex-1 min-w-0">
                                {item.home_team} - {item.away_team}
                              </span>
                              
                              {/* Score if available */}
                              {item.home_score !== null && item.away_score !== null && (
                                <span className="text-xs sm:text-sm font-semibold text-primary px-1.5 py-0.5 bg-primary/10 rounded flex-shrink-0">
                                  {item.home_score}-{item.away_score}
                                </span>
                              )}
                            </div>
                            
                            {/* Row 2: Prediction + Confidence */}
                            <div className="flex items-center justify-between pl-5 sm:pl-6 text-xs">
                              <span className="text-muted-foreground truncate">{item.prediction_value}</span>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs px-1.5 py-0 h-5 flex-shrink-0",
                                  confidenceColors[item.confidence] || 'text-muted-foreground'
                                )}
                              >
                                {confidenceLabels[item.confidence] || item.confidence}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {slip.items.length > 3 && (
                          <p className="text-xs text-muted-foreground pt-1">
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

export default SavedSlipsList;