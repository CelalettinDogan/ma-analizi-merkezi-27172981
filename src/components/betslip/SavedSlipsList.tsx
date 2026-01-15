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
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface SavedSlipsListProps {
  isLoading?: boolean;
  onRefresh?: () => void;
}

const statusConfig = {
  pending: { label: 'Bekliyor', icon: Clock, className: 'bg-draw/20 text-draw border-draw/30' },
  won: { label: 'Kazandı', icon: CheckCircle, className: 'bg-win/20 text-win border-win/30' },
  lost: { label: 'Kaybetti', icon: XCircle, className: 'bg-loss/20 text-loss border-loss/30' },
  partial: { label: 'Kısmi', icon: TrendingUp, className: 'bg-muted text-muted-foreground border-muted' },
};

const confidenceLabels = {
  düşük: 'Düşük',
  orta: 'Orta', 
  yüksek: 'Yüksek',
};

const confidenceColors = {
  düşük: 'text-loss',
  orta: 'text-draw',
  yüksek: 'text-win',
};

const SavedSlipsList: React.FC<SavedSlipsListProps> = ({ isLoading: externalLoading, onRefresh }) => {
  const [slips, setSlips] = useState<BetSlip[]>([]);
  const [stats, setStats] = useState({ total: 0, won: 0, lost: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadSlips = async () => {
    setIsLoading(true);
    try {
      const [fetchedSlips, fetchedStats] = await Promise.all([
        getBetSlips(20),
        getBetSlipStats(),
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
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
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-foreground">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Kuponlarım
          </div>
          <div className="flex gap-2 text-sm font-normal">
            <Badge variant="outline" className="bg-win/20 text-win border-win/30">
              {stats.won} Kazanç
            </Badge>
            <Badge variant="outline" className="bg-loss/20 text-loss border-loss/30">
              {stats.lost} Kayıp
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {slips.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Henüz kaydedilmiş kupon yok</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tahminleri kupona ekleyerek başlayın
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {slips.map((slip) => {
                const StatusIcon = statusConfig[slip.status].icon;
                return (
                  <div
                    key={slip.id}
                    className="bg-muted/50 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(slip.created_at), 'dd MMM yyyy, HH:mm', { locale: tr })}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {slip.items?.length || 0} Tahmin
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={statusConfig[slip.status].className}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[slip.status].label}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(slip.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {slip.items && slip.items.length > 0 && (
                      <div className="space-y-2">
                        {slip.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground truncate flex-1">
                              {item.home_team} vs {item.away_team}
                            </span>
                            <span className="text-foreground mx-2">{item.prediction_value}</span>
                            <span className={`font-medium ${confidenceColors[item.confidence]}`}>
                              {confidenceLabels[item.confidence]}
                            </span>
                          </div>
                        ))}
                        {slip.items.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{slip.items.length - 3} daha fazla tahmin
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
