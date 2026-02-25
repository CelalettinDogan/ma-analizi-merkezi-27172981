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

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { favorites, getFavoritesByType } = useFavorites();
  const { theme, setTheme } = useTheme();
  
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
  
  const [notificationSettings, setNotificationSettings] = useState(() => {
    const saved = localStorage.getItem('golmetrik-notification-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { matchReminders: true, resultNotifications: true, premiumOffers: false };
      }
    }
    return { matchReminders: true, resultNotifications: true, premiumOffers: false };
  });

  const updateNotificationSetting = (key: string, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    localStorage.setItem('golmetrik-notification-settings', JSON.stringify(newSettings));
  };

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
    if (!verifiedAt) return { text: 'Bekliyor', className: 'bg-amber-500/20 text-amber-500 border-amber-500/30' };
    if (isCorrect) return { text: 'Doğru', className: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' };
    return { text: 'Yanlış', className: 'bg-red-500/20 text-red-500 border-red-500/30' };
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SİL' || !user) return;
    setIsDeleting(true);
    try {
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
      if (!response.ok) throw new Error(data.error || 'Hesap silinemedi');
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
      <div className="h-[100dvh] bg-background flex flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 lg:pb-6">
          <div className="space-y-3 max-w-lg mx-auto">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 lg:pb-6 flex items-center justify-center">
          <Card className="w-full max-w-md glass-card">
            <CardContent className="pt-6 text-center">
              <User className="h-14 w-14 text-muted-foreground mx-auto mb-3" />
              <h2 className="text-lg font-bold mb-2">Giriş Yapın</h2>
              <p className="text-sm text-muted-foreground mb-4">Profilinizi görüntülemek için lütfen giriş yapın</p>
              <Link to="/auth"><Button className="w-full">Giriş Yap</Button></Link>
            </CardContent>
          </Card>
        </main>
        
      </div>
    );
  }

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Kullanıcı';
  const initials = displayName.slice(0, 2).toUpperCase();
  const memberSince = user.created_at ? format(new Date(user.created_at), 'MMMM yyyy', { locale: tr }) : null;
  const favoriteLeagues = getFavoritesByType('league');
  const favoriteTeams = getFavoritesByType('team');

  const chatRemaining = chatUsage 
    ? (typeof chatUsage.remaining === 'number' ? chatUsage.remaining : '∞')
    : (canUseAIChat ? dailyChatLimit : 0);

  return (
    <div className="h-[100dvh] bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1 overflow-y-auto px-3 xs:px-4 py-3 xs:py-4 pb-24 lg:pb-6">
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={containerVariants}
          className="space-y-3 max-w-lg mx-auto"
        >
          {/* Profile + Status — Single unified card */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardContent className="p-4 space-y-4">
                {/* User info row */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 xs:h-14 xs:w-14 border-2 border-primary/30 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-base font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h1 className="text-base font-bold truncate font-display">{displayName}</h1>
                      {(isPremium || isAdmin) && <Crown className="h-4 w-4 text-amber-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    {memberSince && <p className="text-micro text-muted-foreground mt-0.5">Üye: {memberSince}</p>}
                  </div>
                </div>

                {/* Plan badge */}
                <div className="flex items-center">
                  {isAdmin ? (
                    <Badge variant="outline" className={`text-xs ${getPlanBadgeStyle()}`}>
                      <Crown className="w-3 h-3 mr-1" /> Admin
                    </Badge>
                  ) : isPremium ? (
                    <Badge variant="outline" className={`text-xs ${getPlanBadgeStyle()}`}>
                      <Crown className="w-3 h-3 mr-1" /> {planDisplayName}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className={`text-xs ${getPlanBadgeStyle()}`}>
                      <User className="w-3 h-3 mr-1" /> Ücretsiz Kullanıcı
                    </Badge>
                  )}
                </div>

                {/* Usage stats grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30">
                    <div className="p-1.5 rounded-xl bg-primary/10">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-micro text-muted-foreground leading-tight">Günlük Analiz</p>
                      <p className="text-sm font-semibold leading-tight">
                        {hasUnlimitedAnalyses ? (
                          <span className="text-emerald-500">Sınırsız</span>
                        ) : (
                          <span>{analysisRemaining}/{dailyAnalysisLimit}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30">
                    <div className="p-1.5 rounded-xl bg-primary/10">
                      <MessageCircle className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-micro text-muted-foreground leading-tight">AI Asistan</p>
                      <p className="text-sm font-semibold leading-tight">
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

                {/* Analysis engine info inline */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/30">
                  <Brain className="w-4 h-4 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Analiz Motoru</p>
                    <p className="text-micro text-muted-foreground">En güncel verilerle düzenli olarak iyileştirilmektedir.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Analyses + Favorites — Combined card */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardContent className="p-4 space-y-4">
                {/* Recent Analyses section */}
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
                          <div key={analysis.id} className="p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
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

                {/* Favorites section */}
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
          </motion.div>

          {/* Settings + About — Combined card */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardContent className="p-4 space-y-1">
                <h2 className="text-sm font-semibold font-display flex items-center gap-2 mb-2">
                  <Settings className="h-4 w-4 text-primary" />
                  Ayarlar
                </h2>

                <Button variant="ghost" className="w-full justify-between h-11 text-sm rounded-xl" onClick={() => setShowNotificationSheet(true)}>
                  <span className="flex items-center gap-2.5"><Bell className="h-4 w-4 text-muted-foreground" />Bildirim Ayarları</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" className="w-full justify-between h-11 text-sm rounded-xl" onClick={() => setShowThemeSheet(true)}>
                  <span className="flex items-center gap-2.5"><Palette className="h-4 w-4 text-muted-foreground" />Tema</span>
                  <span className="text-xs text-muted-foreground capitalize">{theme === 'dark' ? 'Koyu' : theme === 'light' ? 'Açık' : 'Sistem'}</span>
                </Button>
                <Button variant="ghost" className="w-full justify-between h-11 text-sm rounded-xl" onClick={() => setShowAIInfoSheet(true)}>
                  <span className="flex items-center gap-2.5"><HelpCircle className="h-4 w-4 text-muted-foreground" />AI Nasıl Çalışır?</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>

                <div className="border-t border-border/50 my-2" />

                <div className="text-center pb-2">
                  <p className="font-semibold text-sm font-display">GolMetrik AI</p>
                  <p className="text-micro text-muted-foreground">v1.0.0 • İstatistik destekli futbol analiz platformu</p>
                </div>
                <Button variant="ghost" className="w-full justify-between h-11 text-sm rounded-xl" onClick={() => setShowPrivacySheet(true)}>
                  <span className="flex items-center gap-2.5"><Shield className="h-4 w-4 text-muted-foreground" />Gizlilik Politikası</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" className="w-full justify-between h-11 text-sm rounded-xl" onClick={() => setShowTermsSheet(true)}>
                  <span className="flex items-center gap-2.5"><FileText className="h-4 w-4 text-muted-foreground" />Kullanım Şartları</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>

                <div className="border-t border-border/50 my-2" />

                <Button variant="ghost" className="w-full justify-between h-11 text-sm rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setShowDeleteAccountSheet(true)}>
                  <span className="flex items-center gap-2.5"><Trash2 className="h-4 w-4" />Hesabı Sil</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2.5 h-11 text-sm rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" /><span>Çıkış Yap</span>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <p className="text-micro text-muted-foreground text-center px-4 pb-2">
            ⚠️ Tüm içerikler istatistiksel analiz amaçlıdır ve tavsiye niteliği taşımaz.
          </p>
        </motion.div>
      </main>

      {/* Notification Settings Sheet */}
      <Sheet open={showNotificationSheet} onOpenChange={setShowNotificationSheet}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Bildirim Ayarları
            </SheetTitle>
            <SheetDescription>Hangi bildirimleri almak istediğinizi seçin</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 pb-6">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-sm">Maç Hatırlatıcıları</p>
                <p className="text-xs text-muted-foreground">Takip ettiğiniz maçlar başlamadan önce</p>
              </div>
              <Switch checked={notificationSettings.matchReminders} onCheckedChange={(checked) => updateNotificationSetting('matchReminders', checked)} />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-sm">Sonuç Bildirimleri</p>
                <p className="text-xs text-muted-foreground">Analiz sonuçları doğrulandığında</p>
              </div>
              <Switch checked={notificationSettings.resultNotifications} onCheckedChange={(checked) => updateNotificationSetting('resultNotifications', checked)} />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-sm">Premium Teklifleri</p>
                <p className="text-xs text-muted-foreground">Özel kampanya ve indirimler</p>
              </div>
              <Switch checked={notificationSettings.premiumOffers} onCheckedChange={(checked) => updateNotificationSetting('premiumOffers', checked)} />
            </div>
            <p className="text-micro text-muted-foreground pt-2">📱 Bildirim ayarları cihaz ayarlarınızdan da yönetilebilir.</p>
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
            <SheetDescription>Uygulama görünümünü kişiselleştirin</SheetDescription>
          </SheetHeader>
          <RadioGroup value={theme} onValueChange={setTheme} className="space-y-3 pb-6">
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex-1 cursor-pointer">
                <span className="font-medium text-sm">☀️ Açık Tema</span>
                <p className="text-xs text-muted-foreground">Gündüz kullanımı için ideal</p>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex-1 cursor-pointer">
                <span className="font-medium text-sm">🌙 Koyu Tema</span>
                <p className="text-xs text-muted-foreground">Göz yorgunluğunu azaltır</p>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="flex-1 cursor-pointer">
                <span className="font-medium text-sm">📱 Sistem</span>
                <p className="text-xs text-muted-foreground">Cihaz ayarlarını takip eder</p>
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
              <p className="text-sm text-muted-foreground">GolMetrik AI, maç analizleri için istatistiksel modeller kullanmaktadır:</p>
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30">
                  <TrendingUp className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Takım Performans Verileri</p>
                    <p className="text-xs text-muted-foreground">Son maç formları ve istatistikleri</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30">
                  <Heart className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">H2H İstatistikleri</p>
                    <p className="text-xs text-muted-foreground">Kafa kafaya geçmiş karşılaşmalar</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30">
                  <Calendar className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Lig Sıralama Bilgileri</p>
                    <p className="text-xs text-muted-foreground">Güncel puan durumu ve konumlar</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Form Analizleri</p>
                    <p className="text-xs text-muted-foreground">Ev/deplasman performans farkları</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Analiz motoru, en güncel maç verileriyle düzenli olarak iyileştirilmektedir.</p>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  <strong>Önemli:</strong> Sunulan analizler bilgilendirme amaçlıdır ve kesin kazanç garantisi vermez.
                </p>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Delete Account Sheet */}
      <Sheet open={showDeleteAccountSheet} onOpenChange={setShowDeleteAccountSheet}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Hesabı Sil
            </SheetTitle>
            <SheetDescription>Bu işlem geri alınamaz</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 pb-6">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-destructive">Dikkat!</p>
                <p className="text-xs text-muted-foreground mt-1">Hesabınızı sildiğinizde aşağıdaki veriler kalıcı olarak silinecektir:</p>
                <ul className="text-xs text-muted-foreground mt-1.5 space-y-0.5 list-disc list-inside">
                  <li>Tüm analiz geçmişiniz</li>
                  <li>Favorileriniz</li>
                  <li>AI Asistan sohbet geçmişiniz</li>
                  <li>Premium abonelik bilgileriniz</li>
                </ul>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delete-confirm" className="text-sm">
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
              <Button variant="outline" className="flex-1" onClick={() => { setShowDeleteAccountSheet(false); setDeleteConfirmText(''); }}>
                Vazgeç
              </Button>
              <Button variant="destructive" className="flex-1" disabled={deleteConfirmText !== 'SİL' || isDeleting} onClick={handleDeleteAccount}>
                {isDeleting ? 'Siliniyor...' : 'Hesabı Sil'}
              </Button>
            </div>
            <p className="text-micro text-muted-foreground text-center">KVKK/GDPR kapsamında verileriniz kalıcı olarak silinecektir.</p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Privacy Policy Sheet */}
      <Sheet open={showPrivacySheet} onOpenChange={setShowPrivacySheet}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <ScrollArea className="h-full px-6 py-6">
            <div className="space-y-6 pb-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Gizlilik Politikası</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowPrivacySheet(false)}>Kapat</Button>
              </div>
              <p className="text-xs text-muted-foreground">Son güncelleme: 25 Ocak 2026</p>
              <div className="space-y-4">
                {[
                  { t: '1. Veri Toplama', d: 'GolMetrik AI olarak, hizmetlerimizi sunabilmek için belirli kişisel verilerinizi topluyoruz. Bu veriler arasında e-posta adresiniz, kullanıcı tercihleri ve uygulama kullanım istatistikleri yer almaktadır.' },
                  { t: '2. Veri Kullanımı', d: 'Topladığımız veriler, size kişiselleştirilmiş futbol analizi sunmak, uygulama deneyimini iyileştirmek ve teknik destek sağlamak amacıyla kullanılmaktadır.' },
                  { t: '3. Veri Güvenliği', d: 'Verileriniz endüstri standardı güvenlik protokolleri ile korunmaktadır. SSL şifreleme ve güvenli sunucu altyapısı kullanıyoruz.' },
                  { t: '4. Üçüncü Taraf Paylaşımı', d: 'Kişisel verileriniz, yasal zorunluluklar dışında üçüncü taraflarla paylaşılmaz. Analiz hizmetleri için anonim ve toplu veriler kullanılabilir.' },
                  { t: '5. Çerezler', d: 'Uygulamamız, oturum yönetimi ve kullanıcı tercihlerini saklamak için gerekli çerezleri kullanmaktadır.' },
                  { t: '6. Kullanıcı Hakları', d: 'Verilerinize erişim, düzeltme veya silme talep etme hakkına sahipsiniz. Bu talepler için destek ekibimizle iletişime geçebilirsiniz.' },
                  { t: '7. İletişim', d: 'Gizlilik politikamız hakkında sorularınız için: destek@golmetrik.com' },
                ].map(s => (
                  <section key={s.t}>
                    <h3 className="font-semibold text-sm mb-1">{s.t}</h3>
                    <p className="text-xs text-muted-foreground">{s.d}</p>
                  </section>
                ))}
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
                <h2 className="text-lg font-bold">Kullanım Şartları</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowTermsSheet(false)}>Kapat</Button>
              </div>
              <p className="text-xs text-muted-foreground">Son güncelleme: 25 Ocak 2026</p>
              <div className="space-y-4">
                {[
                  { t: '1. Hizmet Tanımı', d: 'GolMetrik AI, istatistik destekli futbol analiz platformudur. Sunulan tüm analizler istatistiksel değerlendirmeler olup, kesin sonuç garantisi vermez.' },
                  { t: '2. Kullanım Koşulları', d: 'Uygulamayı kullanarak bu şartları kabul etmiş olursunuz. Platform 18 yaş üstü kullanıcılar içindir. Yasal olmayan amaçlarla kullanım yasaktır.' },
                  { t: '3. Sorumluluk Reddi', d: 'Sunulan analizler bilgilendirme amaçlıdır. Bahis veya finansal kararlar için tavsiye niteliği taşımaz. Kullanıcılar kendi kararlarından sorumludur.' },
                  { t: '4. Fikri Mülkiyet', d: 'Uygulama içeriği, algoritmaları ve tasarımı GolMetrik AI\'a aittir. İzinsiz kopyalama veya dağıtım yasaktır.' },
                  { t: '5. Hesap Güvenliği', d: 'Kullanıcılar hesap bilgilerini güvende tutmakla yükümlüdür. Şüpheli aktivite durumunda derhal bildirim yapılmalıdır.' },
                  { t: '6. Premium Üyelik', d: 'Premium özellikler ücretli abonelik gerektirir. İptal ve iade koşulları uygulama mağazası politikalarına tabidir.' },
                  { t: '7. Değişiklikler', d: 'Bu şartlar önceden bildirimle güncellenebilir. Güncel versiyonu uygulama içinden takip edebilirsiniz.' },
                  { t: '8. İletişim', d: 'Sorularınız için: destek@golmetrik.com' },
                ].map(s => (
                  <section key={s.t}>
                    <h3 className="font-semibold text-sm mb-1">{s.t}</h3>
                    <p className="text-xs text-muted-foreground">{s.d}</p>
                  </section>
                ))}
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Profile;
