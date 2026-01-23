import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Activity, Calendar, ChevronRight, Sparkles, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import BottomNav from '@/components/navigation/BottomNav';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch recent analyses (predictions without betting terminology)
  const { data: recentAnalyses, isLoading: analysesLoading } = useQuery({
    queryKey: ['recent-analyses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch AI learning status (simplified for users)
  const { data: aiStatus, isLoading: aiLoading } = useQuery({
    queryKey: ['ai-learning-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select('id, is_correct')
        .not('is_correct', 'is', null);
      
      if (error) throw error;
      
      const total = data?.length || 0;
      let level: 'düşük' | 'orta' | 'yüksek' = 'düşük';
      let message = 'AI öğrenme aşamasında';
      
      if (total >= 100) {
        level = 'yüksek';
        message = 'Veri yeterliliği: Yüksek';
      } else if (total >= 30) {
        level = 'orta';
        message = 'Veri yeterliliği: Orta';
      }
      
      return { total, level, message };
    },
  });

  // Fetch upcoming matches
  const { data: upcomingMatches, isLoading: matchesLoading } = useQuery({
    queryKey: ['upcoming-matches-dashboard'],
    queryFn: async () => {
      const today = new Date().toISOString();
      const { data, error } = await supabase
        .from('cached_matches')
        .select('*')
        .gte('utc_date', today)
        .in('status', ['TIMED', 'SCHEDULED'])
        .order('utc_date', { ascending: true })
        .limit(4);
      
      if (error) throw error;
      return data || [];
    },
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'yüksek': return 'text-win bg-win/10 border-win/30';
      case 'orta': return 'text-draw bg-draw/10 border-draw/30';
      default: return 'text-loss bg-loss/10 border-loss/30';
    }
  };

  const getAIStatusColor = (level: string) => {
    switch (level) {
      case 'yüksek': return 'bg-win';
      case 'orta': return 'bg-draw';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      
      <main className="flex-1 container mx-auto px-4 py-6 pb-24 lg:pb-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Header */}
          <motion.div variants={itemVariants}>
            <h1 className="text-2xl font-bold text-foreground">Analiz Özeti</h1>
            <p className="text-muted-foreground text-sm mt-1">
              İstatistiksel maç analizleri ve eğilimler
            </p>
          </motion.div>

          {/* AI Status Card */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">AI Analiz Motoru</p>
                    {aiLoading ? (
                      <Skeleton className="h-4 w-32 mt-1" />
                    ) : (
                      <p className="text-sm text-muted-foreground">{aiStatus?.message}</p>
                    )}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${getAIStatusColor(aiStatus?.level || 'düşük')} text-white border-0`}
                  >
                    {aiStatus?.level === 'yüksek' ? 'Aktif' : aiStatus?.level === 'orta' ? 'Gelişiyor' : 'Öğreniyor'}
                  </Badge>
                </div>
                {/* Simple progress indicator */}
                <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${getAIStatusColor(aiStatus?.level || 'düşük')}`}
                    initial={{ width: 0 }}
                    animate={{ 
                      width: aiStatus?.level === 'yüksek' ? '100%' : aiStatus?.level === 'orta' ? '60%' : '25%' 
                    }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
            <Link to="/chat">
              <Card className="glass-card hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">AI Analiz</p>
                    <p className="text-xs text-muted-foreground">Maç sorgula</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to="/standings">
              <Card className="glass-card hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">İstatistikler</p>
                    <p className="text-xs text-muted-foreground">Lig verileri</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          {/* Upcoming Matches */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Yaklaşan Maçlar
                  </div>
                  <Link to="/live">
                    <Button variant="ghost" size="sm" className="text-xs gap-1">
                      Tümü <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {matchesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))
                ) : upcomingMatches && upcomingMatches.length > 0 ? (
                  upcomingMatches.map((match: any) => (
                    <div 
                      key={match.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {match.home_team_name} vs {match.away_team_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {match.competition_name || match.competition_code}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium text-primary">
                          {format(new Date(match.utc_date), 'dd MMM', { locale: tr })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(match.utc_date), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    Yaklaşan maç bulunamadı
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Analyses */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Son Analizler
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))
                ) : recentAnalyses && recentAnalyses.length > 0 ? (
                  recentAnalyses.map((analysis: any) => (
                    <div 
                      key={analysis.id}
                      className="p-3 rounded-lg bg-muted/50 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {analysis.home_team} vs {analysis.away_team}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {analysis.league} • {format(new Date(analysis.match_date), 'dd MMM', { locale: tr })}
                          </p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs flex-shrink-0 ${getConfidenceColor(analysis.confidence)}`}
                        >
                          {analysis.confidence === 'yüksek' ? 'Yüksek' : analysis.confidence === 'orta' ? 'Orta' : 'Düşük'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs text-muted-foreground">
                          {analysis.prediction_type}: <span className="text-foreground font-medium">{analysis.prediction_value}</span>
                        </span>
                      </div>
                      {analysis.reasoning && (
                        <p className="text-xs text-muted-foreground line-clamp-2 pl-5">
                          {analysis.reasoning}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">Henüz analiz yok</p>
                    <Link to="/">
                      <Button variant="link" size="sm" className="mt-2">
                        Maç analizi başlat
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Info Card */}
          <motion.div variants={itemVariants}>
            <Card className="bg-muted/30 border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground text-center">
                  📊 Tüm içerikler istatistiksel analiz amaçlıdır. Kesin sonuç garantisi verilmez.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>

      <AppFooter />
      <BottomNav />
    </div>
  );
};

export default Dashboard;
