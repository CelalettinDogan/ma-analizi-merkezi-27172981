import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Heart, Settings, LogOut, ChevronRight, Crown, Star, 
  Brain, Calendar, TrendingUp, Clock, Sparkles, Info, FileText, Shield,
  Bell, Palette, HelpCircle, Trash2, AlertTriangle, Zap, MessageCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useAccessLevel } from '@/hooks/useAccessLevel';
import { useAnalysisLimit } from '@/hooks/useAnalysisLimit';
import { useChatbot } from '@/hooks/useChatbot';
import { useTheme } from 'next-themes';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import BottomNav from '@/components/navigation/BottomNav';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const { theme, setTheme } = useTheme();
  
  // Access Level & Limits
  const {
    isPremium,
    planDisplayName,
    dailyAnalysisLimit,
    dailyChatLimit,
    hasUnlimitedAnalyses,
    canUseAIChat,
    isAdmin
  } = useAccessLevel();
  
  const { remaining: analysisRemaining, usageCount: analysisUsed } = useAnalysisLimit();
  const { usage: chatUsage } = useChatbot();
  
  // Sheet States
  const [showPrivacySheet, setShowPrivacySheet] = useState(false);
  const [showTermsSheet, setShowTermsSheet] = useState(false);
  const [showNotificationSheet, setShowNotificationSheet] = useState(false);
  const [showThemeSheet, setShowThemeSheet] = useState(false);
  const [showAIInfoSheet, setShowAIInfoSheet] = useState(false);
  const [showDeleteAccountSheet, setShowDeleteAccountSheet] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Notification Settings with localStorage persistence
  const [notificationSettings, setNotificationSettings] = useState(() => {
    const saved = localStorage.getItem('golmetrik-notification-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          matchReminders: true,
          resultNotifications: true,
          premiumOffers: false,
        };
      }
    }
    return {
      matchReminders: true,
      resultNotifications: true,
      premiumOffers: false,
    };
  });

  // Update notification settings helper
  const updateNotificationSetting = (key: string, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    localStorage.setItem('golmetrik-notification-settings', JSON.stringify(newSettings));
  };

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SİL' || !user) return;
    
    setIsDeleting(true);
    try {
      // Call edge function to delete account
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Hesap silinemedi');
      }

      toast.success('Hesabınız başarıyla silindi');
      await signOut();
      navigate('/');
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast.error(error.message || 'Hesap silinirken bir hata oluştu');
    } finally {
      setIsDeleting(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence?.toLowerCase()) {
      case 'yüksek': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
      case 'orta': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
      default: return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
    }
  };

  // Get plan badge styling
  const getPlanBadgeStyle = () => {
    if (isAdmin) return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
    switch (planDisplayName) {
      case 'Premium Pro': return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-600 border-purple-500/30';
      case 'Premium Plus': return 'bg-primary/20 text-primary border-primary/30';
      case 'Premium Basic': return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
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

  // Chat remaining calculation
  const chatRemaining = chatUsage 
    ? (typeof chatUsage.remaining === 'number' ? chatUsage.remaining : '∞')
    : (canUseAIChat ? dailyChatLimit : 0);

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
                      {(isPremium || isAdmin) && <Crown className="h-5 w-5 text-amber-500 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    {memberSince && <p className="text-xs text-muted-foreground mt-1">Üye: {memberSince}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* User Status Card - NEW */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card border-primary/20">
              <CardContent className="pt-5 pb-5">
                <div className="space-y-4">
                  {/* Plan Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isAdmin ? (
                        <Badge variant="outline" className={getPlanBadgeStyle()}>
                          <Crown className="w-3.5 h-3.5 mr-1" />
                          Admin
                        </Badge>
                      ) : isPremium ? (
                        <Badge variant="outline" className={getPlanBadgeStyle()}>
                          <Crown className="w-3.5 h-3.5 mr-1" />
                          {planDisplayName}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className={getPlanBadgeStyle()}>
                          <User className="w-3.5 h-3.5 mr-1" />
                          Ücretsiz Kullanıcı
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Usage Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Analysis Stats */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Günlük Analiz</p>
                        <p className="font-semibold">
                          {hasUnlimitedAnalyses ? (
                            <span className="text-emerald-500">Sınırsız</span>
                          ) : (
                            <span>{analysisRemaining}/{dailyAnalysisLimit}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Chat Stats */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <MessageCircle className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">AI Asistan</p>
                        <p className="font-semibold">
                          {!canUseAIChat ? (
                            <span className="text-muted-foreground">Kapalı</span>
                          ) : dailyChatLimit >= 999 ? (
                            <span className="text-emerald-500">Sınırsız</span>
                          ) : (
                            <span>{chatRemaining}/{dailyChatLimit}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Analysis Engine Info - Safe Text */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Analiz Motoru
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Analiz motoru, en güncel maç verileriyle düzenli olarak iyileştirilmektedir.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Analyses */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Son Analizler
                </CardTitle>
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

          {/* Settings - Enhanced */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-5 w-5 text-primary" />
                  Ayarlar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {/* Notification Settings */}
                <Button 
                  variant="ghost" 
                  className="w-full justify-between h-11" 
                  onClick={() => setShowNotificationSheet(true)}
                >
                  <span className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    Bildirim Ayarları
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>

                {/* Theme Settings */}
                <Button 
                  variant="ghost" 
                  className="w-full justify-between h-11" 
                  onClick={() => setShowThemeSheet(true)}
                >
                  <span className="flex items-center gap-3">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    Tema
                  </span>
                  <span className="text-sm text-muted-foreground capitalize">
                    {theme === 'dark' ? 'Koyu' : theme === 'light' ? 'Açık' : 'Sistem'}
                  </span>
                </Button>

                {/* AI Info */}
                <Button 
                  variant="ghost" 
                  className="w-full justify-between h-11" 
                  onClick={() => setShowAIInfoSheet(true)}
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    AI Nasıl Çalışır?
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>

                {/* Delete Account */}
                <Button 
                  variant="ghost" 
                  className="w-full justify-between h-11 text-destructive hover:text-destructive hover:bg-destructive/10" 
                  onClick={() => setShowDeleteAccountSheet(true)}
                >
                  <span className="flex items-center gap-3">
                    <Trash2 className="h-4 w-4" />
                    Hesabı Sil
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Sign Out */}
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10" 
                  onClick={handleSignOut}
                >
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
                    İstatistik destekli futbol analiz platformu
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between h-11" 
                    onClick={() => setShowPrivacySheet(true)}
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
                    onClick={() => setShowTermsSheet(true)}
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

      {/* Notification Settings Sheet */}
      <Sheet open={showNotificationSheet} onOpenChange={setShowNotificationSheet}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Bildirim Ayarları
            </SheetTitle>
            <SheetDescription>
              Hangi bildirimleri almak istediğinizi seçin
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-4 pb-6">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">Maç Hatırlatıcıları</p>
                <p className="text-sm text-muted-foreground">Takip ettiğiniz maçlar başlamadan önce</p>
              </div>
              <Switch 
                checked={notificationSettings.matchReminders}
                onCheckedChange={(checked) => updateNotificationSetting('matchReminders', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">Sonuç Bildirimleri</p>
                <p className="text-sm text-muted-foreground">Analiz sonuçları doğrulandığında</p>
              </div>
              <Switch 
                checked={notificationSettings.resultNotifications}
                onCheckedChange={(checked) => updateNotificationSetting('resultNotifications', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Premium Teklifleri</p>
                <p className="text-sm text-muted-foreground">Özel kampanya ve indirimler</p>
              </div>
              <Switch 
                checked={notificationSettings.premiumOffers}
                onCheckedChange={(checked) => updateNotificationSetting('premiumOffers', checked)}
              />
            </div>

            <p className="text-xs text-muted-foreground pt-2">
              📱 Bildirim ayarları cihaz ayarlarınızdan da yönetilebilir.
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Theme Settings Sheet */}
      <Sheet open={showThemeSheet} onOpenChange={setShowThemeSheet}>
        <SheetContent side="bottom" className="h-auto max-h-[60vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Tema Seçimi
            </SheetTitle>
            <SheetDescription>
              Uygulama görünümünü kişiselleştirin
            </SheetDescription>
          </SheetHeader>
          
          <RadioGroup value={theme} onValueChange={setTheme} className="space-y-3 pb-6">
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex-1 cursor-pointer">
                <span className="font-medium">☀️ Açık Tema</span>
                <p className="text-sm text-muted-foreground">Gündüz kullanımı için ideal</p>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex-1 cursor-pointer">
                <span className="font-medium">🌙 Koyu Tema</span>
                <p className="text-sm text-muted-foreground">Göz yorgunluğunu azaltır</p>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="flex-1 cursor-pointer">
                <span className="font-medium">📱 Sistem</span>
                <p className="text-sm text-muted-foreground">Cihaz ayarlarını takip eder</p>
              </Label>
            </div>
          </RadioGroup>
        </SheetContent>
      </Sheet>

      {/* AI Info Sheet */}
      <Sheet open={showAIInfoSheet} onOpenChange={setShowAIInfoSheet}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Analiz Motoru Hakkında
            </SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="h-full max-h-[60vh]">
            <div className="space-y-4 pb-6">
              <p className="text-sm text-muted-foreground">
                Gol Metrik, maç analizleri için istatistiksel modeller kullanmaktadır:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Takım Performans Verileri</p>
                    <p className="text-sm text-muted-foreground">Son maç formları ve istatistikleri</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Heart className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">H2H İstatistikleri</p>
                    <p className="text-sm text-muted-foreground">Kafa kafaya geçmiş karşılaşmalar</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Lig Sıralama Bilgileri</p>
                    <p className="text-sm text-muted-foreground">Güncel puan durumu ve konumlar</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Form Analizleri</p>
                    <p className="text-sm text-muted-foreground">Ev/deplasman performans farkları</p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Analiz motoru, en güncel maç verileriyle düzenli olarak iyileştirilmektedir.
              </p>
              
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  <strong>Önemli:</strong> Sunulan analizler bilgilendirme amaçlıdır ve kesin kazanç garantisi vermez.
                </p>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Delete Account Sheet - GDPR Compliant */}
      <Sheet open={showDeleteAccountSheet} onOpenChange={setShowDeleteAccountSheet}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Hesabı Sil
            </SheetTitle>
            <SheetDescription>
              Bu işlem geri alınamaz
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-4 pb-6">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Dikkat!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Hesabınızı sildiğinizde aşağıdaki veriler kalıcı olarak silinecektir:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Tüm analiz geçmişiniz</li>
                  <li>Favorileriniz</li>
                  <li>AI Asistan sohbet geçmişiniz</li>
                  <li>Premium abonelik bilgileriniz</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Onaylamak için <strong className="text-destructive">SİL</strong> yazın:
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                placeholder="SİL"
                className="uppercase"
              />
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowDeleteAccountSheet(false);
                  setDeleteConfirmText('');
                }}
              >
                Vazgeç
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                disabled={deleteConfirmText !== 'SİL' || isDeleting}
                onClick={handleDeleteAccount}
              >
                {isDeleting ? 'Siliniyor...' : 'Hesabı Sil'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              KVKK/GDPR kapsamında verileriniz kalıcı olarak silinecektir.
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Privacy Policy Sheet */}
      <Sheet open={showPrivacySheet} onOpenChange={setShowPrivacySheet}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <ScrollArea className="h-full px-6 py-6">
            <div className="space-y-6 pb-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Gizlilik Politikası</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowPrivacySheet(false)}>
                  Kapat
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Son güncelleme: 25 Ocak 2026</p>
              
              <div className="space-y-4">
                <section>
                  <h3 className="font-semibold mb-2">1. Veri Toplama</h3>
                  <p className="text-sm text-muted-foreground">
                    GolMetrik olarak, hizmetlerimizi sunabilmek için belirli kişisel verilerinizi topluyoruz. Bu veriler arasında e-posta adresiniz, kullanıcı tercihleri ve uygulama kullanım istatistikleri yer almaktadır.
                  </p>
                </section>
                
                <section>
                  <h3 className="font-semibold mb-2">2. Veri Kullanımı</h3>
                  <p className="text-sm text-muted-foreground">
                    Topladığımız veriler, size kişiselleştirilmiş futbol analizi sunmak, uygulama deneyimini iyileştirmek ve teknik destek sağlamak amacıyla kullanılmaktadır.
                  </p>
                </section>
                
                <section>
                  <h3 className="font-semibold mb-2">3. Veri Güvenliği</h3>
                  <p className="text-sm text-muted-foreground">
                    Verileriniz endüstri standardı güvenlik protokolleri ile korunmaktadır. SSL şifreleme ve güvenli sunucu altyapısı kullanıyoruz.
                  </p>
                </section>
                
                <section>
                  <h3 className="font-semibold mb-2">4. Üçüncü Taraf Paylaşımı</h3>
                  <p className="text-sm text-muted-foreground">
                    Kişisel verileriniz, yasal zorunluluklar dışında üçüncü taraflarla paylaşılmaz. Analiz hizmetleri için anonim ve toplu veriler kullanılabilir.
                  </p>
                </section>
                
                <section>
                  <h3 className="font-semibold mb-2">5. Çerezler</h3>
                  <p className="text-sm text-muted-foreground">
                    Uygulamamız, oturum yönetimi ve kullanıcı tercihlerini saklamak için gerekli çerezleri kullanmaktadır.
                  </p>
                </section>
                
                <section>
                  <h3 className="font-semibold mb-2">6. Kullanıcı Hakları</h3>
                  <p className="text-sm text-muted-foreground">
                    Verilerinize erişim, düzeltme veya silme talep etme hakkına sahipsiniz. Bu talepler için destek ekibimizle iletişime geçebilirsiniz.
                  </p>
                </section>
                
                <section>
                  <h3 className="font-semibold mb-2">7. İletişim</h3>
                  <p className="text-sm text-muted-foreground">
                    Gizlilik politikamız hakkında sorularınız için: destek@golmetrik.com
                  </p>
                </section>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Terms of Use Sheet */}
      <Sheet open={showTermsSheet} onOpenChange={setShowTermsSheet}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <ScrollArea className="h-full px-6 py-6">
            <div className="space-y-6 pb-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Kullanım Şartları</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowTermsSheet(false)}>
                  Kapat
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Son güncelleme: 25 Ocak 2026</p>
              
              <div className="space-y-4">
                <section>
                  <h3 className="font-semibold mb-2">1. Hizmet Tanımı</h3>
                  <p className="text-sm text-muted-foreground">
                    GolMetrik, istatistik destekli futbol analiz platformudur. Sunulan tüm analizler istatistiksel değerlendirmeler olup, kesin sonuç garantisi vermez.
                  </p>
                </section>
                
                <section>
                  <h3 className="font-semibold mb-2">2. Kullanım Koşulları</h3>
                  <p className="text-sm text-muted-foreground">
                    Uygulamayı kullanarak bu şartları kabul etmiş olursunuz. Platform 18 yaş üstü kullanıcılar içindir. Yasal olmayan amaçlarla kullanım yasaktır.
                  </p>
                </section>
                
                <section>
                  <h3 className="font-semibold mb-2">3. Sorumluluk Reddi</h3>
                  <p className="text-sm text-muted-foreground">
                    Sunulan analizler bilgilendirme amaçlıdır. Bahis veya finansal kararlar için tavsiye niteliği taşımaz. Kullanıcılar kendi kararlarından sorumludur.
                  </p>
                </section>
                
                <section>
                  <h3 className="font-semibold mb-2">4. Fikri Mülkiyet</h3>
                  <p className="text-sm text-muted-foreground">
                    Uygulama içeriği, algoritmaları ve tasarımı GolMetrik'e aittir. İzinsiz kopyalama veya dağıtım yasaktır.
                  </p>
                </section>
                
                <section>
                  <h3 className="font-semibold mb-2">5. Hesap Güvenliği</h3>
                  <p className="text-sm text-muted-foreground">
                    Kullanıcılar hesap bilgilerini güvende tutmakla yükümlüdür. Şüpheli aktivite durumunda derhal bildirim yapılmalıdır.
                  </p>
                </section>
                
                <section>
                  <h3 className="font-semibold mb-2">6. Premium Üyelik</h3>
                  <p className="text-sm text-muted-foreground">
                    Premium özellikler ücretli abonelik gerektirir. İptal ve iade koşulları uygulama mağazası politikalarına tabidir.
                  </p>
                </section>
                
                <section>
                  <h3 className="font-semibold mb-2">7. Değişiklikler</h3>
                  <p className="text-sm text-muted-foreground">
                    Bu şartlar önceden bildirimle güncellenebilir. Güncel versiyonu uygulama içinden takip edebilirsiniz.
                  </p>
                </section>
                
                <section>
                  <h3 className="font-semibold mb-2">8. İletişim</h3>
                  <p className="text-sm text-muted-foreground">
                    Sorularınız için: destek@golmetrik.com
                  </p>
                </section>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Profile;
