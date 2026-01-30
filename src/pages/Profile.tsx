import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Heart, Settings, LogOut, ChevronRight, Crown, Star, RefreshCw, 
  Brain, Calendar, TrendingUp, Clock, Sparkles, Info, FileText, Shield
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useOnboarding } from '@/hooks/useOnboarding';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import BottomNav from '@/components/navigation/BottomNav';
import { PremiumUpgrade } from '@/components/premium/PremiumUpgrade';
import { supabase } from '@/integrations/supabase/client';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { favorites, getFavoritesByType } = useFavorites();
  const { isPremium } = usePremiumStatus();
  const { resetOnboarding } = useOnboarding();

  // AI Learning Status Query
  const { data: aiStatus, isLoading: aiStatusLoading } = useQuery({
    queryKey: ['ai-learning-status'],
    queryFn: async () => {
      const { data } = await supabase
        .from('predictions')
        .select('is_correct')
        .not('is_correct', 'is', null);
      
      const total = data?.length || 0;
      const correct = data?.filter(p => p.is_correct).length || 0;
      
      let level = 'düşük';
      let progress = 25;
      if (total >= 100) {
        level = 'yüksek';
        progress = 100;
      } else if (total >= 50) {
        level = 'orta';
        progress = 65;
      } else if (total >= 20) {
        level = 'gelişiyor';
        progress = 45;
      }
      
      return { total, correct, level, progress };
    },
    staleTime: 5 * 60 * 1000
  });

  // Upcoming Matches Query
  const { data: upcomingMatches, isLoading: matchesLoading } = useQuery({
    queryKey: ['upcoming-matches-profile'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('cached_matches')
        .select('*')
        .in('status', ['SCHEDULED', 'TIMED'])
        .gte('utc_date', now)
        .order('utc_date', { ascending: true })
        .limit(4);
      return data || [];
    },
    staleTime: 5 * 60 * 1000
  });

  // Recent Analyses Query - Last 7 days
  const { data: recentAnalyses, isLoading: analysesLoading } = useQuery({
    queryKey: ['recent-analyses-profile'],
    queryFn: async () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { data } = await supabase
        .from('predictions')
        .select('*')
        .gte('created_at', oneWeekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    staleTime: 5 * 60 * 1000
  });

  const getResultBadge = (isCorrect: boolean | null, verifiedAt: string | null) => {
    if (!verifiedAt) {
      return { text: 'Bekliyor', className: 'bg-amber-500/20 text-amber-500 border-amber-500/30' };
    }
    if (isCorrect) {
      return { text: 'Doğru', className: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' };
    }
    return { text: 'Yanlış', className: 'bg-red-500/20 text-red-500 border-red-500/30' };
  };

  const handleResetOnboarding = () => {
    resetOnboarding();
    window.location.reload();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence?.toLowerCase()) {
      case 'yüksek': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
      case 'orta': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
      default: return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
    }
  };

  const getAIStatusColor = (level: string) => {
    switch (level) {
      case 'yüksek': return 'text-emerald-500';
      case 'orta': return 'text-amber-500';
      case 'gelişiyor': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-6 pb-24 lg:pb-6">
          <div className="space-y-4 max-w-lg mx-auto">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <main className="flex-1 container mx-auto px-4 py-6 pb-24 lg:pb-6 flex items-center justify-center">
          <Card className="w-full max-w-md glass-card">
            <CardContent className="pt-6 text-center">
              <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Giriş Yapın</h2>
              <p className="text-muted-foreground mb-6">Profilinizi görüntülemek için lütfen giriş yapın</p>
              <Link to="/auth"><Button className="w-full">Giriş Yap</Button></Link>
            </CardContent>
          </Card>
        </main>
        <AppFooter />
        <BottomNav />
      </div>
    );
  }

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Kullanıcı';
  const initials = displayName.slice(0, 2).toUpperCase();
  const memberSince = user.created_at ? format(new Date(user.created_at), 'MMMM yyyy', { locale: tr }) : null;
  const favoriteLeagues = getFavoritesByType('league');
  const favoriteTeams = getFavoritesByType('team');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-6 pb-24 lg:pb-6">
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={containerVariants}
          className="space-y-4 max-w-lg mx-auto"
        >
          {/* Profile Header */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary/30">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold truncate">{displayName}</h1>
                      {isPremium && <Crown className="h-5 w-5 text-amber-500 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    {memberSince && <p className="text-xs text-muted-foreground mt-1">Üye: {memberSince}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Learning Status */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  AI Öğrenme Durumu
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiStatusLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Veri yeterliliği</span>
                      <span className={`font-medium capitalize ${getAIStatusColor(aiStatus?.level || 'düşük')}`}>
                        {aiStatus?.level || 'Düşük'}
                      </span>
                    </div>
                    <Progress value={aiStatus?.progress || 25} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      AI, istatistiksel analizleri daha doğru yapabilmek için maç verilerinden öğrenmeye devam ediyor.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Matches */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Yaklaşan Maçlar
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/live')} className="text-xs h-7 px-2">
                    Tümü <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {matchesLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : upcomingMatches && upcomingMatches.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingMatches.map((match: any) => (
                      <div 
                        key={match.id} 
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {match.home_team_name} vs {match.away_team_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {match.competition_name}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {format(new Date(match.utc_date), 'dd MMM HH:mm', { locale: tr })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Yaklaşan maç bulunamadı
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Analyses */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Son Analizler
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/analysis-history')} className="text-xs h-7 px-2">
                    Tümü <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {analysesLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </div>
                ) : recentAnalyses && recentAnalyses.length > 0 ? (
                  <div className="space-y-2">
                    {recentAnalyses.map((analysis: any) => {
                      const resultBadge = getResultBadge(analysis.is_correct, analysis.verified_at);
                      const hasScore = analysis.home_score !== null && analysis.away_score !== null;
                      
                      return (
                        <div 
                          key={analysis.id} 
                          className="p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">
                                  {analysis.home_team} vs {analysis.away_team}
                                </p>
                                {hasScore && (
                                  <span className="text-xs text-muted-foreground flex-shrink-0">
                                    ({analysis.home_score}-{analysis.away_score})
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {analysis.prediction_type}: {analysis.prediction_value}
                              </p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-xs flex-shrink-0 ${resultBadge.className}`}
                            >
                              {resultBadge.text}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Henüz analiz yapılmamış
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate('/')}
                      className="mt-2"
                    >
                      Analiz Yap
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Favorites */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Heart className="h-5 w-5 text-primary" />
                  Favorilerim
                </CardTitle>
              </CardHeader>
              <CardContent>
                {favorites.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Henüz favori eklenmedi</p>
                ) : (
                  <div className="space-y-3">
                    {favoriteLeagues.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Ligler</p>
                        <div className="flex flex-wrap gap-2">
                          {favoriteLeagues.map((fav) => (
                            <Badge key={fav.id} variant="outline" className="gap-1">
                              <Star className="h-3 w-3 text-primary" />
                              {fav.favorite_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {favoriteTeams.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Takımlar</p>
                        <div className="flex flex-wrap gap-2">
                          {favoriteTeams.map((fav) => (
                            <Badge key={fav.id} variant="outline" className="gap-1">
                              <Star className="h-3 w-3 text-primary" />
                              {fav.favorite_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Premium */}
          {!isPremium && (
            <motion.div variants={itemVariants}>
              <PremiumUpgrade />
            </motion.div>
          )}

          {/* Settings */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-5 w-5 text-primary" />
                  Ayarlar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start gap-3 h-11" onClick={handleResetOnboarding}>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <span>Tanıtımı Tekrar Göster</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  <span>Çıkış Yap</span>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* About Section */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Info className="h-5 w-5 text-primary" />
                  Hakkında
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center pb-2">
                  <p className="font-semibold">Gol Metrik</p>
                  <p className="text-xs text-muted-foreground">Versiyon 1.0.0</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI destekli futbol analiz platformu
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between h-11" 
                    onClick={() => navigate('/privacy')}
                  >
                    <span className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      Gizlilik Politikası
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between h-11" 
                    onClick={() => navigate('/terms')}
                  >
                    <span className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Kullanım Şartları
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    ⚠️ Sunulan analizler bilgilendirme amaçlıdır ve kesin kazanç garantisi vermez.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <p className="text-xs text-muted-foreground text-center px-4">
            📊 Tüm içerikler istatistiksel analiz amaçlıdır ve tavsiye niteliği taşımaz.
          </p>
        </motion.div>
      </main>
      <AppFooter />
      <BottomNav />
    </div>
  );
};

export default Profile;
