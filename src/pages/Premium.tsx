import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Crown, Check, Sparkles, Zap, Shield, Brain, MessageSquare, Ban, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessLevel } from '@/hooks/useAccessLevel';
import { usePlatformPremium } from '@/hooks/usePlatformPremium';
import { usePlatform } from '@/hooks/usePlatform';
import { purchaseService, PRODUCTS, PLAN_PRODUCTS } from '@/services/purchaseService';
import { PLAN_PRICES } from '@/constants/accessLevels';
import AppHeader from '@/components/layout/AppHeader';

import { toast } from 'sonner';

// ─── Plan data ─────────────────────────────────────────────
interface PlanConfig {
  id: 'premium_basic' | 'premium_plus' | 'premium_pro';
  name: string;
  tagline: string;
  monthlyId: string;
  yearlyId: string;
  monthlyPrice: number;
  yearlyPrice: number;
  chatLimit: number;
  popular: boolean;
  icon: React.ElementType;
}

const plans: PlanConfig[] = [
  {
    id: 'premium_basic', name: 'Basic', tagline: '3 AI/gün',
    monthlyId: PRODUCTS.PREMIUM_BASIC_MONTHLY, yearlyId: PRODUCTS.PREMIUM_BASIC_YEARLY,
    monthlyPrice: PLAN_PRICES.premium_basic.monthly, yearlyPrice: PLAN_PRICES.premium_basic.yearly,
    chatLimit: PLAN_PRODUCTS.premium_basic.chatLimit, popular: false, icon: Zap,
  },
  {
    id: 'premium_plus', name: 'Plus', tagline: '5 AI/gün',
    monthlyId: PRODUCTS.PREMIUM_PLUS_MONTHLY, yearlyId: PRODUCTS.PREMIUM_PLUS_YEARLY,
    monthlyPrice: PLAN_PRICES.premium_plus.monthly, yearlyPrice: PLAN_PRICES.premium_plus.yearly,
    chatLimit: PLAN_PRODUCTS.premium_plus.chatLimit, popular: true, icon: Crown,
  },
  {
    id: 'premium_pro', name: 'Pro', tagline: '10 AI/gün',
    monthlyId: PRODUCTS.PREMIUM_PRO_MONTHLY, yearlyId: PRODUCTS.PREMIUM_PRO_YEARLY,
    monthlyPrice: PLAN_PRICES.premium_pro.monthly, yearlyPrice: PLAN_PRICES.premium_pro.yearly,
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

  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig['id']>('premium_plus');
  const [isYearly, setIsYearly] = useState(true);

  const sel = plans.find(p => p.id === selectedPlan)!;
  const productId = isYearly ? sel.yearlyId : sel.monthlyId;
  const price = isYearly ? sel.yearlyPrice : sel.monthlyPrice;
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
          toast.error(result.error || 'Satın alma başarısız');
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
      if (r.success) toast.success('Geri yüklendi!');
      else toast.info(r.error || 'Bulunamadı');
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
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm text-center p-6 rounded-xl border border-border bg-card">
            <Crown className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold mb-1">Zaten Premium</h2>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? 'Admin olarak tüm özelliklere erişebilirsiniz.' : 'Premium aboneliğiniz aktif.'}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <AppHeader />

      {/* 
        Main content: uses flex-1 + justify-between to fill available space
        between header and bottom nav WITHOUT scrolling.
        Bottom padding accounts for fixed CTA + BottomNav.
      */}
      <main className="flex-1 flex flex-col justify-center px-4 sm:px-6"
        style={{ paddingBottom: 'calc(8.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="w-full max-w-md mx-auto space-y-4">

          {/* ── Mini Hero ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-1"
          >
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-primary p-[1.5px]">
                <div className="w-full h-full rounded-xl bg-background flex items-center justify-center">
                  <Crown className="w-4 h-4 text-primary" />
                </div>
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-amber-400 via-primary to-accent bg-clip-text text-transparent">
                GolMetrik AI Premium
              </h1>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Gelişmiş analiz ve AI destekli içgörüler
            </p>
          </motion.div>

          {/* ── Native Segmented Control (Aylık/Yıllık) ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
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
                className={`relative z-10 px-6 py-1.5 rounded-[10px] text-xs font-medium transition-colors ${
                  !isYearly ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Aylık
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`relative z-10 px-6 py-1.5 rounded-[10px] text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isYearly ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Yıllık
                <span className="text-[9px] font-bold text-emerald-500">2 ay🎁</span>
              </button>
            </div>
          </motion.div>

          {/* ── 3-Column Plan Cards ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-2"
          >
            {plans.map(plan => {
              const isSelected = selectedPlan === plan.id;
              const dp = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              const Icon = plan.icon;

              return (
                <motion.button
                  key={plan.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative rounded-2xl border-2 transition-all duration-200 flex flex-col items-center text-center overflow-hidden ${
                    plan.popular
                      ? isSelected
                        ? 'border-primary bg-primary/[0.06] shadow-[0_2px_20px_-4px_hsl(var(--primary)/0.3)]'
                        : 'border-primary/40 bg-primary/[0.02]'
                      : isSelected
                        ? 'border-primary bg-primary/[0.04] shadow-md'
                        : 'border-border/50 bg-card/60'
                  }`}
                >
                  {/* Popüler banner - inside card, no overflow */}
                  {plan.popular && (
                    <div className="w-full bg-primary text-primary-foreground text-[9px] xs:text-[10px] font-bold py-1 flex items-center justify-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      Popüler
                    </div>
                  )}

                  <div className={`flex flex-col items-center w-full px-2 pb-3 ${plan.popular ? 'pt-2' : 'pt-3'}`}>
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 ${
                      plan.popular ? 'bg-primary/15' : 'bg-muted'
                    }`}>
                      <Icon className={`w-4 h-4 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>

                    {/* Name */}
                    <p className="font-bold text-xs">{plan.name}</p>

                    {/* Price */}
                    <p className="text-lg xs:text-xl font-extrabold tracking-tight mt-0.5">
                      ₺{dp}
                    </p>
                    <p className="text-[9px] text-muted-foreground -mt-0.5">
                      {isYearly ? '/yıl' : '/ay'}
                    </p>

                    {isYearly && (
                      <p className="text-[8px] xs:text-[9px] text-emerald-500 font-medium mt-0.5">
                        aylık ₺{Math.round(dp / 12)}
                      </p>
                    )}

                    {/* Key differentiator */}
                    <p className="text-[9px] xs:text-[10px] text-muted-foreground mt-1.5">
                      {plan.tagline}
                    </p>

                    {/* Selection dot */}
                    <div className={`w-4 h-4 rounded-full border-2 mt-2 flex items-center justify-center transition-all ${
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/25'
                    }`}>
                      {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          {/* ── Included in all plans ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-center gap-3 flex-wrap"
          >
            {includedFeatures.map(f => (
              <div key={f.label} className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] text-muted-foreground">{f.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* ── Fixed CTA — above BottomNav ── */}
      <div
        className="fixed left-0 right-0 z-40 px-4 pt-2 pb-2 bg-background/95 backdrop-blur-sm border-t border-border/30 lg:hidden"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-md mx-auto space-y-1">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handlePurchase}
              disabled={isLoading}
              className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 relative overflow-hidden rounded-xl"
              style={{ boxShadow: '0 0 20px -4px hsl(var(--primary) / 0.3)' }}
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
                  <Crown className="h-4 w-4" /> Premium'a Geç
                </span>
              )}
            </Button>
          </motion.div>

          <div className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground leading-tight">
            <Shield className="w-3 h-3 text-emerald-500/70 shrink-0" />
            <span>Google Play güvencesiyle • İstediğin zaman iptal</span>
            <span className="mx-0.5">•</span>
            <button onClick={handleRestore} className="underline">Geri yükle</button>
          </div>

          <p className="text-[9px] text-muted-foreground/60 text-center leading-tight">
            Abonelik otomatik yenilenir.{' '}
            <Link to="/terms" className="underline">Şartlar</Link> ve{' '}
            <Link to="/privacy" className="underline">Gizlilik</Link>
          </p>
        </div>
      </div>

    </div>
  );
};

export default Premium;
