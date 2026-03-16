import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Crown, Check, Sparkles, Zap, Shield, Brain, MessageSquare, Ban, History } from 'lucide-react';
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
}

const plans: PlanConfig[] = [
  {
    id: 'premium_basic', name: 'Basic', tagline: '3 AI/gün',
    monthlyId: PRODUCTS.PREMIUM_BASIC_MONTHLY, yearlyId: PRODUCTS.PREMIUM_BASIC_YEARLY,
    chatLimit: PLAN_PRODUCTS.premium_basic.chatLimit, popular: false, icon: Zap,
  },
  {
    id: 'premium_plus', name: 'Plus', tagline: '5 AI/gün',
    monthlyId: PRODUCTS.PREMIUM_PLUS_MONTHLY, yearlyId: PRODUCTS.PREMIUM_PLUS_YEARLY,
    chatLimit: PLAN_PRODUCTS.premium_plus.chatLimit, popular: true, icon: Crown,
  },
  {
    id: 'premium_pro', name: 'Pro', tagline: '10 AI/gün',
    monthlyId: PRODUCTS.PREMIUM_PRO_MONTHLY, yearlyId: PRODUCTS.PREMIUM_PRO_YEARLY,
    chatLimit: PLAN_PRODUCTS.premium_pro.chatLimit, popular: false, icon: Sparkles,
  },
];

const includedFeatures = [
  { icon: Brain, label: 'Sınırsız analiz' },
  { icon: Ban, label: 'Reklamsız' },
  { icon: History, label: 'Geçmiş erişimi' },
  { icon: MessageSquare, label: 'AI yorumlar' },
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
            {/* Active Plan Card */}
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

            {/* Features Grid */}
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

            {/* Plan details */}
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

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4"
        style={{ paddingBottom: 'calc(10rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="w-full max-w-md mx-auto space-y-6">

          {/* ── Hero Section ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-3 pt-2"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-primary/20 border border-primary/20 flex items-center justify-center mx-auto">
              <Crown className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-amber-400 via-primary to-accent bg-clip-text text-transparent">
                  AI Premium
                </span>
              </h1>
              <p className="text-sm text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
                Gelişmiş analiz ve AI destekli içgörülerle maçları bir adım önde takip et
              </p>
            </div>
          </motion.div>

          {/* ── Segmented Control (Aylık/Yıllık) ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="flex justify-center"
          >
            <div className="relative inline-flex bg-muted/70 rounded-2xl p-[3px] border border-border/50">
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-y-[3px] rounded-[13px] bg-background shadow-sm border border-border/80"
                style={{
                  width: 'calc(50% - 3px)',
                  left: isYearly ? 'calc(50%)' : '3px',
                }}
              />
              <button
                onClick={() => setIsYearly(false)}
                className={`relative z-10 px-7 py-2 rounded-[13px] text-xs font-semibold transition-colors ${
                  !isYearly ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Aylık
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`relative z-10 px-7 py-2 rounded-[13px] text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  isYearly ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Yıllık
                <span className="text-micro font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">-17%</span>
              </button>
            </div>
          </motion.div>

          {/* ── Horizontal Scroll Plan Cards ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="-mx-4 px-4"
          >
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {plans.map(plan => {
                const isSelected = selectedPlan === plan.id;
                const currentProductId = isYearly ? plan.yearlyId : plan.monthlyId;
                const priceStr = getPrice(currentProductId);
                const priceNum = getPriceAmount(currentProductId);
                const Icon = plan.icon;

                return (
                  <motion.button
                    key={plan.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative rounded-2xl border-2 transition-all duration-200 flex flex-col items-center text-center snap-center shrink-0 overflow-hidden ${
                      plan.popular ? 'min-w-[140px]' : 'min-w-[130px]'
                    } ${
                      plan.popular
                        ? isSelected
                          ? 'border-primary bg-primary/[0.08] shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.35)]'
                          : 'border-primary/50 bg-primary/[0.03]'
                        : isSelected
                          ? 'border-primary bg-primary/[0.05] shadow-lg'
                          : 'border-border/40 bg-card/50'
                    }`}
                  >
                    {/* Popüler banner */}
                    {plan.popular && (
                      <div className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-micro font-bold py-1.5 flex items-center justify-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Önerilen
                      </div>
                    )}

                    <div className={`flex flex-col items-center w-full px-4 pb-4 ${plan.popular ? 'pt-3' : 'pt-4'}`}>
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 ${
                        plan.popular ? 'bg-primary/15' : 'bg-muted/80'
                      }`}>
                        <Icon className={`w-5 h-5 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>

                      {/* Name */}
                      <p className="font-bold text-sm">{plan.name}</p>

                      {/* Price */}
                      {pricesLoading ? (
                        <Skeleton className="h-7 w-16 mt-2 rounded" />
                      ) : (
                        <div className="mt-2">
                          <span className="text-xl font-extrabold tracking-tight">
                            {priceStr}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            / {isYearly ? 'yıl' : 'ay'}
                          </span>
                        </div>
                      )}

                      {isYearly && !pricesLoading && (
                        <p className="text-micro text-emerald-500 font-medium mt-1">
                          aylık ≈ ₺{Math.round(priceNum / 12)}
                        </p>
                      )}

                      {/* Tagline */}
                      <div className="flex items-center gap-1 mt-3 px-2 py-1 rounded-full bg-muted/50">
                        <MessageSquare className="w-3 h-3 text-muted-foreground" />
                        <span className="text-micro text-muted-foreground font-medium">{plan.tagline}</span>
                      </div>

                      {/* Selection indicator */}
                      <div className={`w-5 h-5 rounded-full border-2 mt-3 flex items-center justify-center transition-all ${
                        isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/20'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* ── Benefits Section ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-3"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
              Tüm planlarda dahil
            </p>
            <div className="space-y-2.5">
              {includedFeatures.map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18 + i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-muted/20 border border-border/20"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <f.icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground/90 font-medium">{f.label}</span>
                  <Check className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </main>

      {/* ── Fixed CTA — above BottomNav ── */}
      <div
        className="fixed left-0 right-0 z-40 px-4 pt-3 bg-background/95 backdrop-blur-lg border-t border-border/20"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))', paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-md mx-auto space-y-2">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handlePurchase}
              disabled={isLoading}
              className="w-full h-13 text-base font-bold bg-gradient-to-r from-primary to-accent active:opacity-90 relative overflow-hidden rounded-2xl"
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
                  <Crown className="h-5 w-5" /> AI Premium'u Başlat
                </span>
              )}
            </Button>
          </motion.div>

          <div className="flex items-center justify-center gap-1.5 text-micro text-muted-foreground leading-tight">
            <Shield className="w-3 h-3 text-emerald-500/70 shrink-0" />
            <span>Google Play güvencesi • İstediğin zaman iptal</span>
            <span className="mx-0.5">•</span>
            <button onClick={handleRestore} className="underline active:opacity-70">Geri yükle</button>
          </div>

          <p className="text-micro text-muted-foreground/50 text-center leading-tight">
            <Link to="/terms" className="underline">Şartlar</Link> ve{' '}
            <Link to="/privacy" className="underline">Gizlilik Politikası</Link> geçerlidir
          </p>
        </div>
      </div>

    </div>
  );
};

export default Premium;
