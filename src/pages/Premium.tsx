import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Crown, Check, Sparkles, Zap, Shield, Brain, MessageSquare, Ban, History, Users, Target, Gift } from 'lucide-react';
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

const trustItems = [
  { icon: Users, label: '10.000+ kullanıcı güveniyor' },
  { icon: Target, label: '%61 doğruluk oranı' },
];

// ─── Active Plan View (for premium/admin users) ───────────
const ActivePlanView = ({ plans, planType, isAdmin }: { plans: PlanConfig[]; planType: string; isAdmin: boolean }) => {
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
                <p className="text-[10px] text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-xl bg-muted/10 border border-border/20 text-center">
            <p className="text-[10px] text-muted-foreground">
              Abonelik Google Play üzerinden yönetilir
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

// ─── Main Premium Page ────────────────────────────────────
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
      if (r.success) { refetch(); toast.success('Geri yüklendi!'); }
      else { toast.info(r.error || 'Bulunamadı'); }
    } catch { toast.error('Hata'); }
    finally { setIsLoading(false); }
  };

  // ── Loading skeleton ──
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

  // ── Already premium ──
  if (isPremium || isAdmin) {
    return <ActivePlanView plans={plans} planType={planType} isAdmin={isAdmin} />;
  }

  // ── Free user — subscription screen ──
  return (
    <div className="h-screen bg-muted/30 flex flex-col">
      <AppHeader />

      <main
        className="flex-1 overflow-y-auto px-4 sm:px-6"
        style={{ paddingBottom: 'calc(10rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="w-full max-w-md mx-auto space-y-5 py-4">

          {/* ── Mini Hero ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-1.5"
          >
            <div className="flex items-center justify-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-primary p-[1.5px]">
                <div className="w-full h-full rounded-xl bg-background flex items-center justify-center">
                  <Crown className="w-4.5 h-4.5 text-primary" />
                </div>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 via-primary to-accent bg-clip-text text-transparent">
                Premium
              </h1>
            </div>
            <p className="text-xs text-muted-foreground max-w-[260px] mx-auto">
              Gelişmiş analiz ve AI destekli içgörülerle fark yarat
            </p>
          </motion.div>

          {/* ── Period Toggle ── */}
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
                <span className="text-[10px] font-bold text-emerald-500">2 ay 🎁</span>
              </button>
            </div>
          </motion.div>

          {/* ── Plan Cards ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-2.5"
          >
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const currentProductId = isYearly ? plan.yearlyId : plan.monthlyId;
              const priceStr = getPrice(currentProductId);
              const priceNum = getPriceAmount(currentProductId);
              const Icon = plan.icon;
              const isPopular = plan.popular;

              return (
                <motion.button
                  key={plan.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative flex flex-col items-center text-center rounded-2xl border transition-all duration-200 min-w-0 ${
                    isPopular
                      ? 'flex-[1.15] z-10'
                      : 'flex-1 z-0'
                  } ${
                    isPopular
                      ? isSelected
                        ? 'border-primary bg-card shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.25)] scale-[1.03]'
                        : 'border-primary/40 bg-card shadow-lg'
                      : isSelected
                        ? 'border-primary/60 bg-card shadow-md'
                        : 'border-border/40 bg-card/80 shadow-sm opacity-90'
                  }`}
                >
                  {/* Popular badge */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      <div className="bg-gradient-to-r from-primary to-emerald-500 text-primary-foreground text-[10px] font-bold px-3 py-0.5 rounded-full shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.4)] flex items-center gap-1 whitespace-nowrap">
                        <Sparkles className="w-2.5 h-2.5" />
                        Popüler
                      </div>
                    </div>
                  )}

                  <div className={`flex flex-col items-center w-full px-3 pb-4 ${isPopular ? 'pt-5' : 'pt-4'}`}>
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${
                      isPopular ? 'bg-primary/10' : 'bg-muted/60'
                    }`}>
                      <Icon className={`w-4.5 h-4.5 ${isPopular ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>

                    {/* Name */}
                    <p className="font-bold text-sm truncate max-w-full">{plan.name}</p>

                    {/* Price */}
                    {pricesLoading ? (
                      <Skeleton className="h-7 w-16 mt-2 rounded" />
                    ) : (
                      <div className="flex flex-col items-center mt-1.5">
                        <p className="text-xl font-extrabold tracking-tight whitespace-nowrap leading-tight">
                          {priceStr}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium">
                          {isYearly ? '/yıl' : '/ay'}
                        </p>
                      </div>
                    )}

                    {/* Yearly monthly equivalent */}
                    {isYearly && !pricesLoading && priceNum > 0 && (
                      <p className="text-[10px] text-emerald-500 font-semibold mt-1 whitespace-nowrap">
                        ≈ ₺{Math.round(priceNum / 12)}/ay
                      </p>
                    )}

                    {/* Tagline */}
                    <p className="text-[11px] text-muted-foreground mt-2 whitespace-nowrap">
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

          {/* ── Feature Pills ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-center gap-2 flex-wrap"
          >
            {includedFeatures.map(f => (
              <div
                key={f.label}
                className="flex items-center gap-1.5 bg-primary/8 text-primary rounded-full px-3 py-1.5"
              >
                <f.icon className="w-3 h-3" />
                <span className="text-[11px] font-medium whitespace-nowrap">{f.label}</span>
              </div>
            ))}
          </motion.div>

          {/* ── Trust & Social Proof ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            {trustItems.map(item => (
              <div key={item.label} className="flex items-center justify-center gap-2">
                <item.icon className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
              </div>
            ))}
            {isYearly && (
              <div className="flex items-center justify-center gap-2">
                <Gift className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  2 ay ücretsiz · sınırlı teklif
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* ── Fixed CTA ── */}
      <div
        className="fixed left-0 right-0 z-40 px-4 pt-3 bg-background/95 backdrop-blur-md border-t border-border/20 lg:hidden"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))', paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-md mx-auto space-y-2">
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handlePurchase}
              disabled={isLoading}
              className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-primary via-emerald-500 to-primary active:opacity-90 relative overflow-hidden rounded-xl shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.4)]"
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

          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground leading-tight">
            <Shield className="w-3 h-3 text-emerald-500/70 shrink-0" />
            <span>Google Play güvencesiyle · İstediğin zaman iptal</span>
            <span className="mx-0.5">·</span>
            <button onClick={handleRestore} className="underline">Geri yükle</button>
          </div>

          <p className="text-[10px] text-muted-foreground/60 text-center leading-tight">
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
