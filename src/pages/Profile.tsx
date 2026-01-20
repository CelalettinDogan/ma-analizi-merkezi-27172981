import React from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Heart, 
  Trophy, 
  BarChart3, 
  Settings, 
  LogOut, 
  ChevronRight,
  RefreshCw,
  Mail,
  Calendar,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ProfileSkeleton } from '@/components/ui/skeletons';
import AppHeader from '@/components/layout/AppHeader';
import BottomNav from '@/components/navigation/BottomNav';
import { Link } from 'react-router-dom';
import SavedSlipsList from '@/components/betslip/SavedSlipsList';

const Profile: React.FC = () => {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { favorites, isLoading: favoritesLoading, getFavoritesByType } = useFavorites();

  // Fetch user prediction stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data: predictions, error } = await supabase
        .from('predictions')
        .select('is_correct')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const total = predictions?.length || 0;
      const correct = predictions?.filter(p => p.is_correct === true).length || 0;
      const pending = predictions?.filter(p => p.is_correct === null).length || 0;
      const verified = total - pending;
      const accuracy = verified > 0 ? Math.round((correct / verified) * 100) : 0;
      
      return { total, correct, pending, accuracy };
    },
    enabled: !!user,
  });

  // Fetch saved bet slips count
  const { data: slipsCount } = useQuery({
    queryKey: ['user-slips-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { count, error } = await supabase
        .from('bet_slips')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const handleResetOnboarding = () => {
    localStorage.removeItem('golmetrik_onboarding_completed');
    window.location.reload();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <ProfileSkeleton />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Kullanıcı';
  const initials = displayName.slice(0, 2).toUpperCase();
  const memberSince = user.created_at ? format(new Date(user.created_at), 'd MMMM yyyy', { locale: tr }) : '';

  const favoriteTeams = getFavoritesByType('team');
  const favoriteLeagues = getFavoritesByType('league');

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

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Profile Header */}
          <motion.div variants={itemVariants}>
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h1 className="text-2xl font-display font-bold text-foreground">{displayName}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>Üyelik: {memberSince}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{stats?.total || 0}</div>
                  <div className="text-xs text-muted-foreground">Toplam Tahmin</div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-500">{stats?.correct || 0}</div>
                  <div className="text-xs text-muted-foreground">Doğru</div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-amber-500">{stats?.accuracy || 0}%</div>
                  <div className="text-xs text-muted-foreground">Başarı</div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-500">{slipsCount || 0}</div>
                  <div className="text-xs text-muted-foreground">Kupon</div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Favorites Section */}
          <motion.div variants={itemVariants}>
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="w-5 h-5 text-red-500" />
                  Favorilerim
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {favoritesLoading ? (
                  <div className="text-sm text-muted-foreground">Yükleniyor...</div>
                ) : favorites.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Henüz favori eklenmemiş. Ligler ve takımlar sayfasından favorilerinizi ekleyebilirsiniz.
                  </div>
                ) : (
                  <>
                    {favoriteLeagues.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Ligler</h4>
                        <div className="flex flex-wrap gap-2">
                          {favoriteLeagues.map((fav) => (
                            <Badge key={fav.id} variant="secondary" className="gap-1">
                              <Trophy className="w-3 h-3" />
                              {fav.favorite_name || fav.favorite_id}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {favoriteTeams.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Takımlar</h4>
                        <div className="flex flex-wrap gap-2">
                          {favoriteTeams.map((fav) => (
                            <Badge key={fav.id} variant="outline" className="gap-1">
                              {fav.favorite_name || fav.favorite_id}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Kuponlarım Section */}
          <motion.div variants={itemVariants}>
            <SavedSlipsList />
          </motion.div>

          {/* Premium CTA */}
          <motion.div variants={itemVariants}>
            <Card className="p-4 bg-gradient-to-r from-amber-500/10 via-primary/5 to-amber-500/10 border-amber-500/30">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/20">
                  <Trophy className="w-6 h-6 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">Premium Üyelik</h4>
                  <p className="text-xs text-muted-foreground">
                    Daha yüksek doğruluk oranına sahip premium tahminlere erişin
                  </p>
                </div>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                  Keşfet
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="w-5 h-5" />
                  Hızlı Erişim
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Link to="/dashboard">
                  <Button variant="ghost" className="w-full justify-between rounded-none h-12 px-6">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      <span>İstatistiklerim</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </Link>
                <Separator />
                <Button 
                  variant="ghost" 
                  className="w-full justify-between rounded-none h-12 px-6"
                  onClick={handleResetOnboarding}
                >
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-blue-500" />
                    <span>Tanıtımı Tekrar Göster</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Separator />
                <Button 
                  variant="ghost" 
                  className="w-full justify-between rounded-none h-12 px-6 text-destructive hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5" />
                    <span>Çıkış Yap</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Legal Notice */}
          <motion.div variants={itemVariants}>
            <p className="text-xs text-center text-muted-foreground px-4">
              Bu platform yalnızca bilgilendirme amaçlıdır. Bahis tavsiyesi veya teşviki içermez.
              Kullanıcılar 18 yaşından büyük olmalıdır.
            </p>
          </motion.div>
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
