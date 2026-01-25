import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Calendar, Filter, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

type DateFilter = 'all' | 'today' | 'week' | 'month';
type StatusFilter = 'all' | 'correct' | 'wrong' | 'pending';

const AnalysisHistory: React.FC = () => {
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const getDateRange = (filter: DateFilter): Date | null => {
    const now = new Date();
    switch (filter) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0));
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return monthAgo;
      default:
        return null;
    }
  };

  const { data: analysisSlips, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['analysis-history', dateFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('bet_slips')
        .select(`
          *,
          items:bet_slip_items(*)
        `)
        .order('created_at', { ascending: false });

      const dateRange = getDateRange(dateFilter);
      if (dateRange) {
        query = query.gte('created_at', dateRange.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by status on client side
      let filtered = data || [];
      if (statusFilter !== 'all') {
        filtered = filtered.filter(slip => {
          const items = slip.items || [];
          if (statusFilter === 'pending') {
            return items.some((item: any) => item.is_correct === null);
          } else if (statusFilter === 'correct') {
            return items.every((item: any) => item.is_correct === true);
          } else if (statusFilter === 'wrong') {
            return items.some((item: any) => item.is_correct === false);
          }
          return true;
        });
      }

      return filtered;
    },
  });

  const getResultBadge = (isCorrect: boolean | null) => {
    if (isCorrect === null) {
      return { text: 'Bekliyor', icon: Clock, className: 'bg-amber-500/20 text-amber-500 border-amber-500/30' };
    }
    if (isCorrect) {
      return { text: 'Doğru', icon: CheckCircle2, className: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' };
    }
    return { text: 'Yanlış', icon: XCircle, className: 'bg-red-500/20 text-red-500 border-red-500/30' };
  };

  const getSlipSummary = (items: any[]) => {
    const verified = items.filter((item: any) => item.is_correct !== null);
    const correct = items.filter((item: any) => item.is_correct === true);
    return { verified: verified.length, correct: correct.length, total: items.length };
  };

  // Stats summary
  const stats = React.useMemo(() => {
    if (!analysisSlips) return { total: 0, correct: 0, wrong: 0, pending: 0 };
    
    let correct = 0, wrong = 0, pending = 0;
    analysisSlips.forEach(slip => {
      (slip.items || []).forEach((item: any) => {
        if (item.is_correct === null) pending++;
        else if (item.is_correct) correct++;
        else wrong++;
      });
    });
    
    return { total: correct + wrong + pending, correct, wrong, pending };
  }, [analysisSlips]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-9 w-9"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Analiz Geçmişi</h1>
                <p className="text-sm text-muted-foreground">
                  {stats.total} analiz • {stats.correct} doğru
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Güncelle
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-3">
          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tarih" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="today">Bugün</SelectItem>
              <SelectItem value="week">Bu Hafta</SelectItem>
              <SelectItem value="month">Bu Ay</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="correct">Doğru</SelectItem>
              <SelectItem value="wrong">Yanlış</SelectItem>
              <SelectItem value="pending">Bekliyor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : !analysisSlips || analysisSlips.length === 0 ? (
          <Card className="bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center">
                {dateFilter !== 'all' || statusFilter !== 'all'
                  ? 'Bu filtrelere uygun analiz bulunamadı.'
                  : 'Henüz kayıtlı analiz yok.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {analysisSlips.map((slip, index) => {
              const items = slip.items || [];
              const summary = getSlipSummary(items);

              return (
                <motion.div
                  key={slip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden">
                    <CardContent className="p-4">
                      {/* Slip Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {format(new Date(slip.created_at), 'd MMMM yyyy, HH:mm', { locale: tr })}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {summary.correct}/{summary.total} Doğru
                        </Badge>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {items.map((item: any) => {
                          const badge = getResultBadge(item.is_correct);
                          const BadgeIcon = badge.icon;

                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {item.home_team} vs {item.away_team}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.league} • {item.prediction_type}: {item.prediction_value}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                {item.home_score !== null && item.away_score !== null && (
                                  <span className="text-xs font-mono bg-background px-2 py-0.5 rounded">
                                    {item.home_score}-{item.away_score}
                                  </span>
                                )}
                                <Badge
                                  variant="outline"
                                  className={`text-xs flex items-center gap-1 ${badge.className}`}
                                >
                                  <BadgeIcon className="h-3 w-3" />
                                  {badge.text}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisHistory;
