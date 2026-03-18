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
  const { planType, refetch } = usePlatformPremium();
  const { getPrice, getPriceAmount, isLoading: pricesLoading } = useStoreProducts();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig['id']>('premium_plus');
  const [isYearly, setIsYearly] = useState(true);

  const sel = plans.find(p => p.id === selectedPlan)!;
  const productId = isYearly ? sel.yearlyId : sel.monthlyId;
  const planName = PLAN_PRODUCTS[selectedPlan].name;

  const handlePurchase = async () => {
    if (!user) { navigate('/auth'); return; }
    setIsLoading(true);
    try {
      if (isNative) {
        const result = await purchaseService.purchaseSubscription(productId);
        if (result.success) {
          toast.success(`${planName} aktif edildi!`);
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

  // ── Loading skeleton ──
  if (authLoading) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="animate-pulse space-y-4 w-full max-w-sm">
            <div className="h-12 bg-muted rounded-2xl" />
            <div className="h-8 bg-muted rounded-full w-36 mx-auto" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-36 bg-muted rounded-2xl" />
              <div className="h-40 bg-muted rounded-2xl" />
              <div className="h-36 bg-muted rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Already Premium ──
  if (isPremium || isAdmin) {
    const currentPlan = plans.find(p => p.id === planType) || plans[1];
    return (
      <div className="h-full flex flex-col bg-background">
        <main
          className="flex-1 overflow-y-auto px-4 py-6"
          style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="w-full max-w-sm mx-auto space-y-5">
            <div className="text-center p-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Crown className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-lg font-bold">
                {isAdmin ? 'Admin Erişimi' : (currentPlan?.name || 'Premium')}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {isAdmin ? 'Tüm özelliklere tam erişim' : 'Aktif abonelik'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Brain, label: 'Sınırsız Analiz', desc: 'Günlük limit yok' },
                { icon: MessageSquare, label: 'AI Asistan', desc: `${currentPlan?.chatLimit || '∞'} mesaj/gün` },
                { icon: Ban, label: 'Reklamsız', desc: 'Temiz deneyim' },
                { icon: History, label: 'Geçmiş Erişimi', desc: 'Tüm analizler' },
              ].map(f => (
                <div key={f.label} className="p-4 rounded-2xl bg-muted/20 border border-border/30">
                  <f.icon className="w-5 h-5 text-primary mb-2" />
                  <p className="text-sm font-semibold">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-muted/10 border border-border/20 text-center">
              <p className="text-xs text-muted-foreground">
                Abonelik Google Play üzerinden yönetilir
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Purchase flow ──
  return (
    <div className="h-full flex flex-col bg-background">
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: 'calc(140px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="w-full max-w-md mx-auto px-4 py-6 space-y-5">

          {/* ── Hero ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2 py-2"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center mx-auto">
              <Crown className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Premium'a Yükselt</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Gelişmiş analiz ve AI destekli içgörüler
            </p>
          </motion.div>

          {/* ── Billing Toggle ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="flex justify-center"
          >
            <div className="relative inline-flex bg-muted/60 rounded-xl p-[3px] border border-border/40">
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-y-[3px] rounded-[10px] bg-background shadow-sm border border-border/60"
                style={{
                  width: 'calc(50% - 3px)',
                  left: isYearly ? 'calc(50%)' : '3px',
                }}
              />
              <button
                onClick={() => setIsYearly(false)}
                className={`relative z-10 px-7 py-2 rounded-[10px] text-sm font-medium transition-colors active:opacity-85 ${
                  !isYearly ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Aylık
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`relative z-10 px-7 py-2 rounded-[10px] text-sm font-medium transition-colors flex items-center gap-1.5 active:opacity-85 ${
                  isYearly ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Yıllık
                <span className="text-xs font-bold text-emerald-500">2 ay bedava</span>
              </button>
            </div>
          </motion.div>

          {/* ── Plan Cards ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3"
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
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative rounded-2xl border-2 transition-all duration-200 flex flex-col items-center text-center overflow-hidden active:opacity-90 ${
                    isSelected
                      ? 'border-primary bg-primary/[0.04] shadow-lg'
                      : 'border-border/40 bg-card/50'
                  }`}
                >
                  {/* Popular banner */}
                  {plan.popular && (
                    <div className="w-full bg-primary text-primary-foreground text-[10px] font-bold py-1 flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Popüler
                    </div>
                  )}

                  <div className={`flex flex-col items-center w-full px-2 pb-4 ${plan.popular ? 'pt-3' : 'pt-4'}`}>
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                      isSelected ? 'bg-primary/15' : 'bg-muted/60'
                    }`}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>

                    {/* Name */}
                    <p className="font-bold text-sm">{plan.name}</p>

                    {/* Price */}
                    {pricesLoading ? (
                      <Skeleton className="h-7 w-16 mt-1.5 rounded" />
                    ) : (
                      <>
                        <p className="text-xl font-black tracking-tight tabular-nums mt-1">
                          {priceStr}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isYearly ? '/yıl' : '/ay'}
                        </p>
                      </>
                    )}

                    {isYearly && !pricesLoading && priceNum > 0 && (
                      <p className="text-[10px] text-emerald-500 font-medium mt-1">
                        aylık ≈ ₺{Math.round(priceNum / 12)}
                      </p>
                    )}

                    {/* Tagline */}
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {plan.tagline}
                    </p>

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
          </motion.div>

          {/* ── Feature Chips ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide"
          >
            {includedFeatures.map(f => (
              <div
                key={f.label}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-muted/30 border border-border/30 shrink-0"
              >
                <f.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">{f.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* ── Fixed CTA ── */}
      <div
        className="fixed left-0 right-0 z-40 px-4 pt-3 pb-2 bg-background/90 backdrop-blur-xl border-t border-border/20"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-md mx-auto space-y-2">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handlePurchase}
              disabled={isLoading}
              className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-primary to-accent rounded-xl relative overflow-hidden active:opacity-90"
              style={{ boxShadow: '0 0 24px -6px hsl(var(--primary) / 0.25)' }}
              size="lg"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 3 }}
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

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground leading-tight">
            <Shield className="w-3 h-3 text-emerald-500/70 shrink-0" />
            <span>Google Play güvencesi</span>
            <span className="text-border">·</span>
            <span>İstediğin zaman iptal</span>
            <span className="text-border">·</span>
            <button onClick={handleRestore} className="underline active:opacity-70">Geri yükle</button>
          </div>

          <p className="text-[10px] text-muted-foreground/50 text-center leading-tight">
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
