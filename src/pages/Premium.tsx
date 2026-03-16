import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Crown, Check, Sparkles, Zap, Shield, Brain, MessageSquare, Ban, History, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessLevel } from '@/hooks/useAccessLevel';
import { usePlatformPremium } from '@/hooks/usePlatformPremium';
import { usePlatform } from '@/hooks/usePlatform';
import { useStoreProducts } from '@/hooks/useStoreProducts';
import { purchaseService, PRODUCTS, PLAN_PRODUCTS } from '@/services/purchaseService';
import AppHeader from '@/components/layout/AppHeader';
import { toast } from 'sonner';

// ─── Plan data ─────────────────────────────────────────────
interface PlanConfig {
  id: 'premium_basic' | 'premium_plus' | 'premium_pro';
  name: string;
  tagline: string;
  monthlyId: string;
  yearlyId: string;
  chatLimit: number;
  popular: boolean;
  icon: React.ElementType;
  features: string[];
}

const plans: PlanConfig[] = [
  {
    id: 'premium_basic', name: 'Basic', tagline: '3 AI mesaj/gün',
    monthlyId: PRODUCTS.PREMIUM_BASIC_MONTHLY, yearlyId: PRODUCTS.PREMIUM_BASIC_YEARLY,
    chatLimit: PLAN_PRODUCTS.premium_basic.chatLimit, popular: false, icon: Zap,
    features: ['Sınırsız analiz', 'Reklamsız', '3 AI mesaj'],
  },
  {
    id: 'premium_plus', name: 'Plus', tagline: '5 AI mesaj/gün',
    monthlyId: PRODUCTS.PREMIUM_PLUS_MONTHLY, yearlyId: PRODUCTS.PREMIUM_PLUS_YEARLY,
    chatLimit: PLAN_PRODUCTS.premium_plus.chatLimit, popular: true, icon: Crown,
    features: ['Sınırsız analiz', 'Reklamsız', '5 AI mesaj', 'Geçmiş erişimi'],
  },
  {
    id: 'premium_pro', name: 'Pro', tagline: '10 AI mesaj/gün',
    monthlyId: PRODUCTS.PREMIUM_PRO_MONTHLY, yearlyId: PRODUCTS.PREMIUM_PRO_YEARLY,
    chatLimit: PLAN_PRODUCTS.premium_pro.chatLimit, popular: false, icon: Sparkles,
    features: ['Sınırsız analiz', 'Reklamsız', '10 AI mesaj', 'Geçmiş erişimi', 'Öncelikli destek'],
  },
];

const Premium = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isNative } = usePlatform();
  const { isPremium, isAdmin } = useAccessLevel();
  const { planType } = usePlatformPremium();
  const { getPrice, getPriceAmount, isLoading: pricesLoading } = useStoreProducts();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig['id']>('premium_plus');
  const [isYearly, setIsYearly] = useState(true);

  const sel = plans.find(p => p.id === selectedPlan)!;
  const productId = isYearly ? sel.yearlyId : sel.monthlyId;
  const planName = PLAN_PRODUCTS[selectedPlan].name;

  const { refetch } = usePlatformPremium();

  const handlePurchase = async () => {
    if (!user) { navigate('/auth'); return; }
    setIsLoading(true);
    try {
      if (isNative) {
        const result = await purchaseService.purchaseSubscription(productId);
        if (result.success) {
          toast.success(`${planName} aktif edildi! 🎉`);
          refetch();
        } else {
          const isActivationError = result.error?.includes('doğrulanamadı') || result.error?.includes('kaydedilemedi');
          if (isActivationError) {
            toast.error('Ödemeniz alındı ancak aktivasyon başarısız oldu. "Geri yükle" ile tekrar deneyin.');
          } else {
            toast.error(result.error || 'Satın alma başarısız');
          }
        }
      } else {
        toast.info('Gerçek satın alma için mobil uygulama gerekli');
      }
    } catch { toast.error('Bir hata oluştu'); }
    finally { setIsLoading(false); }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      const r = await purchaseService.restorePurchases();
      if (r.success) {
        refetch();
        toast.success('Geri yüklendi!');
      } else {
        toast.info(r.error || 'Bulunamadı');
      }
    } catch { toast.error('Hata'); }
    finally { setIsLoading(false); }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center flex-1 py-20">
          <div className="animate-pulse space-y-3 w-full max-w-sm px-4">
            <div className="h-10 bg-muted rounded-xl" />
            <div className="h-8 bg-muted rounded-full w-40 mx-auto" />
            <div className="grid grid-cols-3 gap-2">
              <div className="h-28 bg-muted rounded-xl" />
              <div className="h-32 bg-muted rounded-xl" />
              <div className="h-28 bg-muted rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isPremium || isAdmin) {
    const currentPlan = plans.find(p => p.id === planType) || plans[1];
    return (
      <div className="h-screen bg-background flex flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
          <div className="w-full max-w-sm mx-auto space-y-4">
            <div className="text-center p-5 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-bold mb-0.5">
                {isAdmin ? 'Admin Erişimi' : (currentPlan?.name || 'Premium')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'Tüm özelliklere tam erişim' : 'Aktif abonelik'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Brain, label: 'Sınırsız Analiz', desc: 'Günlük limit yok' },
                { icon: MessageSquare, label: 'AI Asistan', desc: `${currentPlan?.chatLimit || '∞'} mesaj/gün` },
                { icon: Ban, label: 'Reklamsız', desc: 'Temiz deneyim' },
                { icon: History, label: 'Geçmiş Erişimi', desc: 'Tüm analizler' },
              ].map(f => (
                <div key={f.label} className="p-3 rounded-xl bg-muted/20 border border-border/30">
                  <f.icon className="w-4 h-4 text-primary mb-1.5" />
                  <p className="text-xs font-semibold">{f.label}</p>
                  <p className="text-micro text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-xl bg-muted/10 border border-border/20 text-center">
              <p className="text-micro text-muted-foreground">
                Abonelik Google Play üzerinden yönetilir
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1 overflow-y-auto px-4 sm:px-6"
        style={{ paddingBottom: 'calc(10rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="w-full max-w-md mx-auto space-y-5 py-4">

          {/* ── Hero ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400/20 to-primary/20 border border-primary/20 flex items-center justify-center mx-auto"
              style={{ boxShadow: '0 0 30px -6px hsl(var(--primary) / 0.25)' }}
            >
              <Crown className="w-7 h-7 text-primary" />
            </motion.div>
            <h1 className="text-xl font-bold">
              <span className="bg-gradient-to-r from-amber-400 via-primary to-accent bg-clip-text text-transparent">
                GolMetrik AI Premium
              </span>
            </h1>
            <p className="text-xs text-muted-foreground max-w-[260px] mx-auto">
              Gelişmiş analiz, AI destekli içgörüler ve reklamsız deneyim
            </p>
          </motion.div>

          {/* ── Social Proof ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-2 py-1.5"
          >
            <div className="flex -space-x-1.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-background flex items-center justify-center">
                  <Users className="w-2.5 h-2.5 text-primary/60" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <span className="text-micro text-muted-foreground font-medium">
                Binlerce kullanıcı Premium kullanıyor
              </span>
            </div>
          </motion.div>

          {/* ── Native Segmented Control ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 }}
            className="flex justify-center"
          >
            <div className="relative inline-flex bg-muted/70 rounded-xl p-[3px] border border-border/50">
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-y-[3px] rounded-[10px] bg-background shadow-sm border border-border/80"
                style={{
                  width: 'calc(50% - 3px)',
                  left: isYearly ? 'calc(50%)' : '3px',
                }}
              />
              <button
                onClick={() => setIsYearly(false)}
                className={`relative z-10 px-6 py-2 rounded-[10px] text-xs font-medium transition-colors ${
                  !isYearly ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Aylık
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`relative z-10 px-6 py-2 rounded-[10px] text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isYearly ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Yıllık
                <span className="text-micro font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  2 ay bedava
                </span>
              </button>
            </div>
          </motion.div>

          {/* ── 3-Column Plan Cards ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="grid grid-cols-3 gap-2.5"
          >
            {plans.map((plan, index) => {
              const isSelected = selectedPlan === plan.id;
              const currentProductId = isYearly ? plan.yearlyId : plan.monthlyId;
              const priceStr = getPrice(currentProductId);
              const priceNum = getPriceAmount(currentProductId);
              const Icon = plan.icon;

              return (
                <motion.button
                  key={plan.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative rounded-2xl border-2 transition-all duration-300 flex flex-col items-center text-center overflow-hidden ${
                    plan.popular
                      ? isSelected
                        ? 'border-primary bg-primary/[0.06]'
                        : 'border-primary/40 bg-primary/[0.02]'
                      : isSelected
                        ? 'border-primary bg-primary/[0.04]'
                        : 'border-border/50 bg-card/60'
                  }`}
                  style={isSelected ? {
                    boxShadow: plan.popular
                      ? '0 4px 24px -4px hsl(var(--primary) / 0.35), 0 0 0 1px hsl(var(--primary) / 0.1)'
                      : '0 4px 20px -4px hsl(var(--primary) / 0.2)',
                  } : undefined}
                >
                  {/* Popular banner */}
                  {plan.popular && (
                    <div className="w-full bg-primary text-primary-foreground text-micro font-bold py-1 flex items-center justify-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      En Popüler
                    </div>
                  )}

                  <div className={`flex flex-col items-center w-full px-2.5 pb-3.5 ${plan.popular ? 'pt-2.5' : 'pt-3.5'}`}>
                    {/* Icon — larger */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-colors ${
                      isSelected
                        ? 'bg-primary/15'
                        : plan.popular ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Icon className={`w-5 h-5 transition-colors ${
                        isSelected || plan.popular ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>

                    {/* Name */}
                    <p className="font-bold text-sm">{plan.name}</p>

                    {/* Price */}
                    {pricesLoading ? (
                      <Skeleton className="h-7 w-14 mt-1.5 rounded" />
                    ) : (
                      <>
                        <p className="text-xl font-extrabold tracking-tight mt-1 text-foreground">
                          {priceStr}
                        </p>
                        <p className="text-micro text-muted-foreground -mt-0.5">
                          {isYearly ? '/yıl' : '/ay'}
                        </p>
                      </>
                    )}

                    {isYearly && !pricesLoading && (
                      <p className="text-micro text-emerald-500 font-semibold mt-0.5">
                        ≈ ₺{Math.round(priceNum / 12)}/ay
                      </p>
                    )}

                    {/* Tagline */}
                    <p className="text-micro text-muted-foreground mt-2 font-medium">
                      {plan.tagline}
                    </p>

                    {/* Selection indicator */}
                    <div className={`w-5 h-5 rounded-full border-2 mt-2.5 flex items-center justify-center transition-all duration-200 ${
                      isSelected ? 'border-primary bg-primary scale-110' : 'border-muted-foreground/25'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          {/* ── Feature list for selected plan ── */}
          <motion.div
            key={selectedPlan}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="p-3.5 rounded-2xl bg-muted/20 border border-border/30"
          >
            <p className="text-micro font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              {sel.name} planına dahil
            </p>
            <div className="space-y-1.5">
              {sel.features.map(f => (
                <div key={f} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                  </div>
                  <span className="text-xs text-foreground/80">{f}</span>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </main>

      {/* ── Fixed CTA — above BottomNav ── */}
      <div
        className="fixed left-0 right-0 z-40 px-4 pt-3 bg-background/95 backdrop-blur-md border-t border-border/30 lg:hidden"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))', paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-md mx-auto space-y-2">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handlePurchase}
              disabled={isLoading}
              className="w-full h-12 text-sm font-bold bg-gradient-to-r from-primary to-accent active:opacity-90 relative overflow-hidden rounded-xl"
              style={{ boxShadow: '0 4px 24px -4px hsl(var(--primary) / 0.4)' }}
              size="lg"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
              />
              {isLoading ? (
                <span className="flex items-center gap-2 relative">
                  <span className="animate-spin">⏳</span> İşleniyor...
                </span>
              ) : (
                <span className="flex items-center gap-2 relative">
                  <Crown className="h-5 w-5" />
                  {sel.name} ile Başla
                </span>
              )}
            </Button>
          </motion.div>

          {/* Trust message */}
          <div className="flex items-center justify-center gap-1.5 text-micro text-muted-foreground">
            <Shield className="w-3 h-3 text-emerald-500/70 shrink-0" />
            <span>İstediğin zaman iptal et • Google Play güvencesi</span>
          </div>

          <div className="flex items-center justify-center gap-2 text-micro text-muted-foreground/60">
            <button onClick={handleRestore} className="underline">Geri yükle</button>
            <span>•</span>
            <Link to="/terms" className="underline">Şartlar</Link>
            <span>•</span>
            <Link to="/privacy" className="underline">Gizlilik</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Premium;
