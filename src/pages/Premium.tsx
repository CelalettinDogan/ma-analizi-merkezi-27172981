import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Crown, Brain, Ban, History, Check, MessageSquare, Sparkles, Zap,
  Calendar, CreditCard, ExternalLink, Shield, Star, TrendingUp, Users,
  Lock, Smartphone
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessLevel } from '@/hooks/useAccessLevel';
import { usePlatformPremium } from '@/hooks/usePlatformPremium';
import { useChatbot } from '@/hooks/useChatbot';
import { usePlatform } from '@/hooks/usePlatform';
import { purchaseService, PRODUCTS, PLAN_PRODUCTS } from '@/services/purchaseService';
import { PLAN_PRICES } from '@/constants/accessLevels';
import AppHeader from '@/components/layout/AppHeader';
import BottomNav from '@/components/navigation/BottomNav';
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

// Floating Orbs Animation Component
const FloatingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 blur-3xl"
      animate={{
        y: [0, -20, 0],
        x: [0, 10, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    <motion.div
      className="absolute top-1/3 -right-12 w-40 h-40 rounded-full bg-gradient-to-br from-amber-500/15 to-primary/10 blur-3xl"
      animate={{
        y: [0, 15, 0],
        x: [0, -15, 0],
        scale: [1, 1.15, 1],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1
      }}
    />
    <motion.div
      className="absolute bottom-1/4 left-1/4 w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/15 to-pink-500/10 blur-2xl"
      animate={{
        y: [0, -10, 0],
        x: [0, 8, 0],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 2
      }}
    />
  </div>
);

// Animated Crown Component with Glow
const AnimatedCrown = () => (
  <motion.div
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
    className="relative w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 mx-auto"
  >
    {/* Outer Glow Ring */}
    <motion.div 
      className="absolute inset-0 rounded-3xl sm:rounded-[2rem]"
      animate={{
        boxShadow: [
          '0 0 20px 0 rgba(234, 179, 8, 0.3)',
          '0 0 40px 10px rgba(234, 179, 8, 0.4)',
          '0 0 20px 0 rgba(234, 179, 8, 0.3)',
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
    
    {/* Background Pulse */}
    <motion.div 
      className="absolute inset-0 rounded-3xl sm:rounded-[2rem] bg-gradient-to-br from-amber-400 via-primary to-accent"
      animate={{ 
        opacity: [0.5, 0.8, 0.5],
        scale: [1, 1.05, 1],
      }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    
    {/* Inner Container */}
    <div className="relative w-full h-full rounded-3xl sm:rounded-[2rem] bg-gradient-to-br from-amber-400 via-primary to-accent p-0.5 sm:p-1">
      <div className="w-full h-full rounded-3xl sm:rounded-[2rem] bg-background/95 backdrop-blur-sm flex items-center justify-center">
        <motion.div
          animate={{ 
            rotate: [0, -5, 5, -5, 0],
            scale: [1, 1.08, 1]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2
          }}
        >
          <Crown className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 text-primary drop-shadow-lg" />
        </motion.div>
      </div>
    </div>
    
    {/* Sparkles */}
    <motion.div
      className="absolute -top-1 -right-1"
      animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
    >
      <Sparkles className="w-4 h-4 text-amber-400" />
    </motion.div>
    <motion.div
      className="absolute -bottom-1 -left-1"
      animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
      transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
    >
      <Sparkles className="w-3 h-3 text-primary" />
    </motion.div>
  </motion.div>
);

// Social Proof Badge
const SocialProofBadge = () => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
    className="flex items-center justify-center gap-1.5 xs:gap-2"
  >
    <div className="flex -space-x-1">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-3 h-3 xs:w-3.5 xs:h-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
    <span className="text-[10px] xs:text-xs text-muted-foreground font-medium">
      4.9/5 • <span className="text-foreground">2.500+</span> Değerlendirme
    </span>
  </motion.div>
);

// Premium Features for Bento Grid
const bentoFeatures = [
  { icon: Brain, label: 'Sınırsız Analiz', description: 'Günlük limit yok', gradient: 'from-emerald-500/20 to-teal-500/10' },
  { icon: MessageSquare, label: 'AI Asistan', description: 'Günlük mesaj hakkı', gradient: 'from-blue-500/20 to-indigo-500/10' },
  { icon: Ban, label: 'Reklamsız', description: 'Kesintisiz deneyim', gradient: 'from-purple-500/20 to-pink-500/10' },
  { icon: History, label: 'Geçmiş', description: 'Tüm analizlere erişim', gradient: 'from-amber-500/20 to-orange-500/10' },
];

// Premium Features List
const premiumFeatures = [
  { icon: Brain, label: 'Sınırsız Analiz', description: 'Günlük limit olmadan maç analizi' },
  { icon: MessageSquare, label: 'AI Asistan', description: 'Planına göre günlük AI mesaj hakkı' },
  { icon: Ban, label: 'Reklamsız Deneyim', description: 'Kesintisiz, temiz deneyim' },
  { icon: History, label: 'Analiz Geçmişi', description: 'Tüm geçmiş analizlerine erişim' },
];

// Plan Configurations
interface PlanConfig {
  id: 'premium_basic' | 'premium_plus' | 'premium_pro';
  name: string;
  monthlyId: string;
  yearlyId: string;
  monthlyPrice: number;
  yearlyPrice: number;
  chatLimit: number;
  popular: boolean;
  color: string;
  gradient: string;
  glowColor: string;
}

const plans: PlanConfig[] = [
  {
    id: 'premium_basic',
    name: 'Basic',
    monthlyId: PRODUCTS.PREMIUM_BASIC_MONTHLY,
    yearlyId: PRODUCTS.PREMIUM_BASIC_YEARLY,
    monthlyPrice: PLAN_PRICES.premium_basic.monthly,
    yearlyPrice: PLAN_PRICES.premium_basic.yearly,
    chatLimit: PLAN_PRODUCTS.premium_basic.chatLimit,
    popular: false,
    color: 'from-blue-500 to-blue-600',
    gradient: 'from-blue-500/20 to-blue-600/20',
    glowColor: 'shadow-blue-500/30',
  },
  {
    id: 'premium_plus',
    name: 'Plus',
    monthlyId: PRODUCTS.PREMIUM_PLUS_MONTHLY,
    yearlyId: PRODUCTS.PREMIUM_PLUS_YEARLY,
    monthlyPrice: PLAN_PRICES.premium_plus.monthly,
    yearlyPrice: PLAN_PRICES.premium_plus.yearly,
    chatLimit: PLAN_PRODUCTS.premium_plus.chatLimit,
    popular: true,
    color: 'from-purple-500 to-purple-600',
    gradient: 'from-purple-500/20 to-purple-600/20',
    glowColor: 'shadow-purple-500/30',
  },
  {
    id: 'premium_pro',
    name: 'Pro',
    monthlyId: PRODUCTS.PREMIUM_PRO_MONTHLY,
    yearlyId: PRODUCTS.PREMIUM_PRO_YEARLY,
    monthlyPrice: PLAN_PRICES.premium_pro.monthly,
    yearlyPrice: PLAN_PRICES.premium_pro.yearly,
    chatLimit: PLAN_PRODUCTS.premium_pro.chatLimit,
    popular: false,
    color: 'from-amber-500 to-orange-600',
    gradient: 'from-amber-500/20 to-orange-500/20',
    glowColor: 'shadow-amber-500/30',
  },
];

/**
 * Premium Page Component
 * 
 * Modern 2026 UI/UX - Fully responsive for all mobile sizes (320px+)
 * - Free Users: Sales landing page with plan comparison
 * - Premium Users: Subscription management dashboard
 */
const Premium = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isNative } = usePlatform();
  const { 
    isPremium, 
    planDisplayName, 
    dailyChatLimit, 
    isAdmin,
    canUseAIChat
  } = useAccessLevel();
  const { subscription, daysRemaining, planType } = usePlatformPremium();
  const { usage: chatUsage } = useChatbot();
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig['id']>('premium_plus');
  const [isYearly, setIsYearly] = useState(true);

  const selectedPlanConfig = plans.find(p => p.id === selectedPlan)!;
  const productId = isYearly ? selectedPlanConfig.yearlyId : selectedPlanConfig.monthlyId;
  const price = isYearly ? selectedPlanConfig.yearlyPrice : selectedPlanConfig.monthlyPrice;
  const planName = PLAN_PRODUCTS[selectedPlan].name;

  // Calculate yearly savings
  const yearlySavings = selectedPlanConfig.monthlyPrice * 2; // 2 months free

  // Chat remaining calculation
  const chatRemaining = chatUsage 
    ? (typeof chatUsage.remaining === 'number' ? chatUsage.remaining : dailyChatLimit)
    : dailyChatLimit;
  const chatUsagePercent = dailyChatLimit > 0 
    ? Math.max(0, ((dailyChatLimit - chatRemaining) / dailyChatLimit) * 100)
    : 0;

  const handlePurchase = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setIsLoading(true);

    try {
      if (isNative) {
        const result = await purchaseService.purchaseSubscription(productId);
        
        if (result.success) {
          toast.success(`${planName} üyeliğin aktif edildi!`);
        } else {
          toast.error(result.error || 'Satın alma başarısız');
        }
      } else {
        console.log('Purchase simulation - native platform required for real purchases');
        toast.info('Satın alma testi: Gerçek satın alma için mobil uygulama gerekli');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);

    try {
      const result = await purchaseService.restorePurchases();
      
      if (result.success) {
        toast.success('Satın almalar geri yüklendi!');
      } else {
        toast.info(result.error || 'Geri yüklenecek satın alma bulunamadı');
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Geri yükleme başarısız');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = () => {
    window.open('https://play.google.com/store/account/subscriptions', '_blank');
  };

  const currentPlanConfig = plans.find(p => p.id === planType);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-3 py-4 pb-24">
          <div className="animate-pulse space-y-3 max-w-lg mx-auto">
            <div className="h-32 bg-muted rounded-2xl" />
            <div className="h-24 bg-muted rounded-2xl" />
            <div className="h-40 bg-muted rounded-2xl" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  // ============================================
  // PREMIUM USER DASHBOARD
  // ============================================
  if (isPremium || isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 pb-24 lg:pb-6">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={containerVariants}
            className="space-y-3 max-w-lg mx-auto"
          >
            {/* Plan Status Hero */}
            <motion.div variants={itemVariants}>
              <Card className={`overflow-hidden border-0 ${currentPlanConfig ? `bg-gradient-to-br ${currentPlanConfig.gradient}` : 'bg-gradient-to-br from-primary/20 to-accent/20'}`}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <motion.div 
                      className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${currentPlanConfig?.color || 'from-primary to-accent'}`}
                      animate={{ 
                        boxShadow: [
                          '0 0 0 0 rgba(34, 197, 94, 0)',
                          '0 0 20px 5px rgba(34, 197, 94, 0.3)',
                          '0 0 0 0 rgba(34, 197, 94, 0)',
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg sm:text-xl font-bold truncate">
                          {isAdmin ? 'Admin' : planDisplayName}
                        </h1>
                        <motion.div
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-[10px] sm:text-xs shrink-0">
                            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />
                            Aktif
                          </Badge>
                        </motion.div>
                      </div>
                      {subscription && daysRemaining !== null && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                          {daysRemaining > 30 
                            ? `${format(new Date(subscription.expires_at), 'd MMM yyyy', { locale: tr })} tarihine kadar`
                            : `${daysRemaining} gün kaldı`
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Usage Stats */}
            {canUseAIChat && !isAdmin && (
              <motion.div variants={itemVariants}>
                <Card className="glass-card">
                  <CardHeader className="p-3 sm:p-4 pb-2">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      Günlük AI Asistan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Kullanılan</span>
                        <span className="font-semibold text-base sm:text-lg">
                          {dailyChatLimit - chatRemaining} / {dailyChatLimit}
                        </span>
                      </div>
                      <div className="relative">
                        <Progress 
                          value={chatUsagePercent} 
                          className={`h-2.5 sm:h-3 ${
                            chatUsagePercent > 80 ? '[&>div]:bg-red-500' : 
                            chatUsagePercent > 50 ? '[&>div]:bg-amber-500' : ''
                          }`} 
                        />
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Her gece yarısı sıfırlanır
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Plan Benefits - Compact Grid */}
            <motion.div variants={itemVariants}>
              <Card className="glass-card">
                <CardHeader className="p-3 sm:p-4 pb-2">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    Plan Avantajları
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="grid grid-cols-2 gap-2">
                    {bentoFeatures.map((feature, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        className={`flex items-start gap-2 p-2.5 sm:p-3 rounded-xl bg-gradient-to-br ${feature.gradient} border border-border/50`}
                      >
                        <div className="p-1.5 sm:p-2 rounded-lg bg-background/50 shrink-0">
                          <feature.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[10px] sm:text-xs truncate">{feature.label}</p>
                          <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">{feature.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Subscription Details */}
            {subscription && (
              <motion.div variants={itemVariants}>
                <Card className="glass-card">
                  <CardHeader className="p-3 sm:p-4 pb-2">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      Abonelik Bilgileri
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
                    <div className="flex items-center justify-between py-1.5 sm:py-2 border-b border-border/50">
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Başlangıç</span>
                        <span className="xs:hidden">Başlangıç</span>
                      </div>
                      <span className="text-xs sm:text-sm font-medium">
                        {format(new Date(subscription.starts_at), 'd MMM yyyy', { locale: tr })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 sm:py-2 border-b border-border/50">
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                        Yenileme
                      </div>
                      <span className="text-xs sm:text-sm font-medium">
                        {format(new Date(subscription.expires_at), 'd MMM yyyy', { locale: tr })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 sm:py-2">
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                        <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                        Durum
                      </div>
                      <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-600 text-[10px] sm:text-xs">
                        Otomatik Yenileme
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Manage Subscription Button */}
            {!isAdmin && (
              <motion.div variants={itemVariants}>
                <Button
                  onClick={handleManageSubscription}
                  variant="outline"
                  className="w-full gap-2 h-10 sm:h-11 text-xs sm:text-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Google Play Aboneliklerini Yönet
                </Button>
              </motion.div>
            )}

            {/* Upgrade Option */}
            {planType !== 'premium_pro' && !isAdmin && (
              <motion.div variants={itemVariants}>
                <Card className="glass-card border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
                  <CardContent className="p-3 sm:p-4 relative">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                    />
                    <div className="flex items-center gap-3 relative">
                      <motion.div 
                        className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shrink-0"
                        animate={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Star className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base">Pro'ya Yükselt</h3>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          10 AI mesajı/gün + tüm özellikler
                        </p>
                      </div>
                      <Button size="sm" onClick={() => setSelectedPlan('premium_pro')} className="shrink-0 text-xs h-8 px-3">
                        Yükselt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Legal Notice */}
            <motion.div variants={itemVariants} className="text-center pb-2">
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                Aboneliğinizi Google Play &gt; Abonelikler'den yönetebilirsiniz.
              </p>
            </motion.div>
          </motion.div>
        </main>
        <BottomNav />
      </div>
    );
  }

  // ============================================
  // FREE USER SALES LANDING PAGE
  // ============================================
  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <FloatingOrbs />
      <AppHeader />
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 pb-44 sm:pb-48 lg:pb-6 relative z-10">
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={containerVariants}
          className="space-y-4 sm:space-y-5 max-w-lg mx-auto"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center space-y-3 sm:space-y-4">
            {/* Animated Crown */}
            <AnimatedCrown />
            
            <div className="space-y-2">
              <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-400 via-primary to-accent bg-clip-text text-transparent">
                GolMetrik Premium
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground px-4">
                Kazanma şansını artır, sınırsız analize eriş
              </p>
            </div>
            
            {/* Social Proof */}
            <SocialProofBadge />
          </motion.div>

          {/* User Stats Banner */}
          <motion.div 
            variants={itemVariants}
            className="flex items-center justify-center gap-2 xs:gap-3 py-2 px-3 rounded-xl bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border border-border/50"
          >
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] xs:text-xs font-medium">10K+</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <span className="text-[10px] xs:text-xs text-muted-foreground">Aktif kullanıcı güveniyle</span>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/30 backdrop-blur-sm border border-border/50">
              <Label 
                htmlFor="billing-toggle" 
                className={`text-xs sm:text-sm cursor-pointer transition-colors ${!isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
              >
                Aylık
              </Label>
              <Switch
                id="billing-toggle"
                checked={isYearly}
                onCheckedChange={setIsYearly}
              />
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Label 
                  htmlFor="billing-toggle" 
                  className={`text-xs sm:text-sm cursor-pointer transition-colors ${isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                >
                  Yıllık
                </Label>
                {isYearly && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Badge variant="secondary" className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/30 relative overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                      />
                      <span className="relative">2 ay bedava</span>
                    </Badge>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Plan Cards - Responsive Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-1.5 xs:gap-2 sm:gap-3">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const displayPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              
              return (
                <motion.button
                  key={plan.id}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative p-2 xs:p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 ${
                    isSelected
                      ? `border-primary bg-primary/5 shadow-lg ${plan.glowColor}`
                      : 'border-border hover:border-primary/50 bg-card/80 backdrop-blur-sm'
                  }`}
                  style={{
                    boxShadow: isSelected ? `0 0 25px 0 var(--primary-glow, rgba(34, 197, 94, 0.2))` : undefined
                  }}
                >
                  {plan.popular && (
                    <motion.div
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="absolute -top-2 sm:-top-2.5 left-1/2 -translate-x-1/2"
                    >
                      <Badge className="text-[7px] xs:text-[8px] sm:text-[10px] px-1 xs:px-1.5 sm:px-2 py-0.5 whitespace-nowrap relative overflow-hidden">
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                        />
                        <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5" />
                        <span className="relative">Popüler</span>
                      </Badge>
                    </motion.div>
                  )}
                  
                  <motion.div 
                    className={`w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 mx-auto mb-1.5 xs:mb-2 sm:mb-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}
                    animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {plan.id === 'premium_basic' && <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                    {plan.id === 'premium_plus' && <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                    {plan.id === 'premium_pro' && <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                  </motion.div>
                  
                  <p className="font-semibold text-[10px] xs:text-xs sm:text-sm">{plan.name}</p>
                  
                  <p className="text-sm xs:text-base sm:text-xl font-bold text-primary mt-0.5 sm:mt-1">
                    ₺{displayPrice}
                  </p>
                  <p className="text-[8px] xs:text-[9px] sm:text-[10px] text-muted-foreground">
                    {isYearly ? '/yıl' : '/ay'}
                  </p>
                  
                  <div className="flex items-center justify-center gap-0.5 sm:gap-1 mt-1 xs:mt-1.5 sm:mt-2">
                    <MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
                    <span className="text-[8px] xs:text-[9px] sm:text-[11px] text-muted-foreground">
                      {plan.chatLimit}/gün
                    </span>
                  </div>
                  
                  {isSelected && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1 right-1 xs:top-1.5 xs:right-1.5 sm:top-2 sm:right-2"
                    >
                      <div className="p-0.5 rounded-full bg-primary">
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                      </div>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Selected Plan Summary with Savings */}
          <motion.div variants={itemVariants}>
            <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 overflow-hidden">
              <CardContent className="p-3 sm:p-4 relative">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                />
                <div className="flex items-center justify-between gap-3 relative">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-primary shrink-0" />
                      <p className="font-semibold text-sm sm:text-lg truncate">{planName}</p>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                      {selectedPlanConfig.chatLimit} AI mesajı/gün • Sınırsız analiz
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg sm:text-2xl font-bold text-primary">₺{price}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {isYearly ? '/yıl' : '/ay'}
                    </p>
                    {isYearly && (
                      <p className="text-[9px] sm:text-[10px] text-emerald-500 font-medium">
                        ₺{yearlySavings} tasarruf
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Features Bento Grid */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {bentoFeatures.map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.gradient} border border-border/50 backdrop-blur-sm`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-background/60 shrink-0">
                      <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <p className="font-semibold text-xs sm:text-sm">{feature.label}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/30">
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-[9px] sm:text-[10px] text-emerald-600 font-medium">Premium</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Trust Badges - Enhanced */}
          <motion.div variants={itemVariants}>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted/50 border border-border/50">
                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground">SSL Güvenli</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted/50 border border-border/50">
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground">Anında Aktif</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted/50 border border-border/50">
                <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground">Güvenilir</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted/50 border border-border/50">
                <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground">Google Play</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Fixed CTA - Positioned above BottomNav */}
      <div 
        className="fixed left-0 right-0 z-40 p-3 sm:p-4 bg-gradient-to-t from-background via-background to-transparent lg:hidden"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-lg mx-auto space-y-2 sm:space-y-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handlePurchase}
              disabled={isLoading}
              className="w-full h-12 sm:h-14 text-sm sm:text-lg font-semibold bg-gradient-to-r from-amber-500 via-primary to-accent hover:opacity-90 relative overflow-hidden"
              style={{
                boxShadow: '0 0 30px 0 rgba(34, 197, 94, 0.3)'
              }}
              size="lg"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
              {isLoading ? (
                <span className="flex items-center gap-2 relative">
                  <span className="animate-spin">⏳</span>
                  İşleniyor...
                </span>
              ) : (
                <span className="flex items-center gap-2 relative">
                  <Crown className="h-4 w-4 sm:h-5 sm:w-5" />
                  Premium Yolculuğuna Başla
                </span>
              )}
            </Button>
          </motion.div>
          
          {isNative && (
            <Button
              variant="ghost"
              onClick={handleRestore}
              disabled={isLoading}
              className="w-full text-[10px] sm:text-xs h-8 sm:h-9"
            >
              Satın Almaları Geri Yükle
            </Button>
          )}
          
          {/* Legal Terms - Inline */}
          <p className="text-[9px] sm:text-[10px] text-muted-foreground text-center leading-relaxed">
            Abonelik otomatik yenilenir. Google Play &gt; Abonelikler'den iptal edebilirsiniz.{' '}
            <Link to="/terms" className="underline">Şartlar</Link> ve{' '}
            <Link to="/privacy" className="underline">Gizlilik</Link>
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Premium;
