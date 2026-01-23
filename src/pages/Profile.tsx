import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Heart, Settings, LogOut, ChevronRight, Crown, Star, RefreshCw, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useOnboarding } from '@/hooks/useOnboarding';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import BottomNav from '@/components/navigation/BottomNav';
import { PremiumUpgrade } from '@/components/premium/PremiumUpgrade';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { favorites, getFavoritesByType } = useFavorites();
  const { isPremium } = usePremiumStatus();
  const { resetOnboarding } = useOnboarding();

  const handleResetOnboarding = () => {
    resetOnboarding();
    window.location.reload();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-6 pb-24 lg:pb-6">
          <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-lg mx-auto">
          {/* Profile Header */}
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

          {/* AI Chat */}
          <Link to="/chat">
            <Card className="glass-card hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10"><Bot className="h-6 w-6 text-primary" /></div>
                  <div className="flex-1"><p className="font-medium">AI Analiz Asistanı</p><p className="text-sm text-muted-foreground">Maç analizi için soru sor</p></div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Favorites */}
          <Card className="glass-card">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Heart className="h-5 w-5 text-primary" />Favorilerim</CardTitle></CardHeader>
            <CardContent>
              {favorites.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Henüz favori eklenmedi</p> : (
                <div className="space-y-3">
                  {favoriteLeagues.length > 0 && <div><p className="text-xs text-muted-foreground mb-2">Ligler</p><div className="flex flex-wrap gap-2">{favoriteLeagues.map((fav) => <Badge key={fav.id} variant="outline" className="gap-1"><Star className="h-3 w-3 text-primary" />{fav.favorite_name}</Badge>)}</div></div>}
                  {favoriteTeams.length > 0 && <div><p className="text-xs text-muted-foreground mb-2">Takımlar</p><div className="flex flex-wrap gap-2">{favoriteTeams.map((fav) => <Badge key={fav.id} variant="outline" className="gap-1"><Star className="h-3 w-3 text-primary" />{fav.favorite_name}</Badge>)}</div></div>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Premium */}
          {!isPremium && <PremiumUpgrade />}

          {/* Settings */}
          <Card className="glass-card">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Settings className="h-5 w-5 text-primary" />Ayarlar</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start gap-3 h-11" onClick={handleResetOnboarding}><RefreshCw className="h-4 w-4 text-muted-foreground" /><span>Tanıtımı Tekrar Göster</span></Button>
              <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleSignOut}><LogOut className="h-4 w-4" /><span>Çıkış Yap</span></Button>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center px-4">📊 Tüm içerikler istatistiksel analiz amaçlıdır ve tavsiye niteliği taşımaz.</p>
        </motion.div>
      </main>
      <AppFooter />
      <BottomNav />
    </div>
  );
};

export default Profile;
