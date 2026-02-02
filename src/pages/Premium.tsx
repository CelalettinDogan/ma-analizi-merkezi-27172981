import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Crown, Brain, Ban, History, Check, MessageSquare, Sparkles, Zap,
  ArrowLeft, Calendar, CreditCard, ExternalLink, Shield, Star, TrendingUp
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
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

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
  },
];

/**
 * Premium Page Component
 * 
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
    // Open Google Play subscriptions management
    window.open('https://play.google.com/store/account/subscriptions', '_blank');
  };

  // Get current plan config
  const currentPlanConfig = plans.find(p => p.id === planType);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-6 pb-24">
          <div className="animate-pulse space-y-4 max-w-lg mx-auto">
            <div className="h-40 bg-muted rounded-xl" />
            <div className="h-32 bg-muted rounded-xl" />
            <div className="h-48 bg-muted rounded-xl" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  // Render Premium User Dashboard
  if (isPremium || isAdmin) {
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
            {/* Plan Status Hero */}
            <motion.div variants={itemVariants}>
              <Card className={`overflow-hidden border-0 ${currentPlanConfig ? `bg-gradient-to-br ${currentPlanConfig.gradient}` : 'bg-gradient-to-br from-primary/20 to-accent/20'}`}>
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${currentPlanConfig?.color || 'from-primary to-accent'}`}>
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold">
                          {isAdmin ? 'Admin' : planDisplayName}
                        </h1>
                        <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                          <Check className="w-3 h-3 mr-1" />
                          Aktif
                        </Badge>
                      </div>
                      {subscription && daysRemaining !== null && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {daysRemaining > 30 
                            ? `${format(new Date(subscription.expires_at), 'd MMMM yyyy', { locale: tr })} tarihine kadar`
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
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      Günlük AI Asistan Kullanımı
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Kullanılan</span>
                        <span className="font-semibold">
                          {dailyChatLimit - chatRemaining} / {dailyChatLimit} mesaj
                        </span>
                      </div>
                      <Progress value={chatUsagePercent} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Limitler her gün gece yarısı sıfırlanır
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Plan Benefits */}
            <motion.div variants={itemVariants}>
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Plan Avantajları
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {premiumFeatures.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-3 rounded-xl bg-muted/30"
                      >
                        <div className="p-1.5 rounded-lg bg-primary/10">
                          <feature.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-xs">{feature.label}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Subscription Details */}
            {subscription && (
              <motion.div variants={itemVariants}>
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Abonelik Bilgileri
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        Başlangıç Tarihi
                      </div>
                      <span className="text-sm font-medium">
                        {format(new Date(subscription.starts_at), 'd MMMM yyyy', { locale: tr })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="w-4 h-4" />
                        Yenileme Tarihi
                      </div>
                      <span className="text-sm font-medium">
                        {format(new Date(subscription.expires_at), 'd MMMM yyyy', { locale: tr })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield className="w-4 h-4" />
                        Durum
                      </div>
                      <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-600">
                        Otomatik Yenileme Aktif
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
                  className="w-full gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Google Play Aboneliklerini Yönet
                </Button>
              </motion.div>
            )}

            {/* Upgrade Option (if not Pro) */}
            {planType !== 'premium_pro' && !isAdmin && (
              <motion.div variants={itemVariants}>
                <Card className="glass-card border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Pro'ya Yükselt</h3>
                        <p className="text-xs text-muted-foreground">
                          10 AI mesajı/gün + tüm premium özellikler
                        </p>
                      </div>
                      <Button size="sm" onClick={() => setSelectedPlan('premium_pro')}>
                        Yükselt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Legal Notice */}
            <motion.div variants={itemVariants} className="text-center">
              <p className="text-[10px] text-muted-foreground">
                Aboneliğinizi Google Play &gt; Abonelikler'den yönetebilirsiniz.
              </p>
            </motion.div>
          </motion.div>
        </main>
        <BottomNav />
      </div>
    );
  }

  // Render Free User Sales Landing Page
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-6 pb-32 lg:pb-6">
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={containerVariants}
          className="space-y-6 max-w-lg mx-auto"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-primary via-accent to-primary p-0.5"
            >
              <div className="w-full h-full rounded-3xl bg-background flex items-center justify-center">
                <Crown className="w-10 h-10 text-primary" />
              </div>
            </motion.div>
            
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                GolMetrik Premium
              </h1>
              <p className="text-muted-foreground mt-2">
                Kazanma şansını artır, sınırsız analize eriş
              </p>
            </div>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-center gap-4 p-4 rounded-2xl bg-muted/50">
              <Label 
                htmlFor="billing-toggle" 
                className={`text-sm cursor-pointer transition-colors ${!isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
              >
                Aylık
              </Label>
              <Switch
                id="billing-toggle"
                checked={isYearly}
                onCheckedChange={setIsYearly}
              />
              <div className="flex items-center gap-1.5">
                <Label 
                  htmlFor="billing-toggle" 
                  className={`text-sm cursor-pointer transition-colors ${isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                >
                  Yıllık
                </Label>
                {isYearly && (
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                    2 ay bedava
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>

          {/* Plan Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const displayPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              
              return (
                <motion.button
                  key={plan.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative p-4 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                      : 'border-border hover:border-primary/50 bg-card'
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] px-2">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Popüler
                    </Badge>
                  )}
                  
                  <div className={`w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                    {plan.id === 'premium_basic' && <Zap className="w-5 h-5 text-white" />}
                    {plan.id === 'premium_plus' && <Crown className="w-5 h-5 text-white" />}
                    {plan.id === 'premium_pro' && <Sparkles className="w-5 h-5 text-white" />}
                  </div>
                  
                  <p className="font-semibold">{plan.name}</p>
                  
                  <p className="text-xl font-bold text-primary mt-1">
                    ₺{displayPrice}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {isYearly ? '/yıl' : '/ay'}
                  </p>
                  
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <MessageSquare className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">
                      {plan.chatLimit}/gün
                    </span>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Selected Plan Summary */}
          <motion.div variants={itemVariants}>
            <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{planName}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedPlanConfig.chatLimit} AI mesajı/gün • Sınırsız analiz
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">₺{price}</p>
                    <p className="text-xs text-muted-foreground">
                      {isYearly ? '/yıl' : '/ay'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Features Grid */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-center">Tüm Premium Özellikleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {premiumFeatures.map((feature, index) => (
                    <motion.div
                      key={feature.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-2 p-3 rounded-xl bg-muted/30"
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <feature.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{feature.label}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Trust Badges */}
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="w-4 h-4 text-emerald-500" />
              Güvenli Ödeme
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap className="w-4 h-4 text-amber-500" />
              Anında Aktivasyon
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Fixed CTA */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent lg:hidden">
        <div className="max-w-lg mx-auto space-y-3">
          <Button
            onClick={handlePurchase}
            disabled={isLoading}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90"
            size="lg"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                İşleniyor...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Google Play ile Premium Ol
              </span>
            )}
          </Button>
          
          {isNative && (
            <Button
              variant="ghost"
              onClick={handleRestore}
              disabled={isLoading}
              className="w-full text-sm"
            >
              Satın Almaları Geri Yükle
            </Button>
          )}
        </div>
      </div>

      {/* Legal Terms */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-background border-t border-border/50 lg:hidden">
        <p className="text-[10px] text-muted-foreground text-center leading-relaxed max-w-lg mx-auto">
          Abonelik otomatik yenilenir. Google Play &gt; Abonelikler'den iptal edebilirsiniz.{' '}
          <Link to="/terms" className="underline">Kullanım Şartları</Link> ve{' '}
          <Link to="/privacy" className="underline">Gizlilik Politikası</Link>
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default Premium;
