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

/** Strip trailing period text like "/yıl", "/ay" from price string if present */
const cleanPrice = (s: string): string => s.replace(/\s*\/(yıl|ay|year|month)\s*$/i, '').trim();

// ─── Active Plan View (for premium/admin users) ───────────
const ActivePlanView = ({ plans: plansList, planType, isAdmin }: { plans: PlanConfig[]; planType: string; isAdmin: boolean }) => {
  const currentPlan = plansList.find(p => p.id === planType) || plansList[1];
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

// ─── Plan Card Component ──────────────────────────────────
interface PlanCardProps {
  plan: PlanConfig;
  isSelected: boolean;
  isYearly: boolean;
  priceStr: string;
  priceNum: number;
  pricesLoading: boolean;
  onSelect: () => void;
}

const PlanCard = ({ plan, isSelected, isYearly, priceStr, priceNum, pricesLoading, onSelect }: PlanCardProps) => {
  const Icon = plan.icon;
  const isPopular = plan.popular;
  const periodLabel = isYearly ? '/yıl' : '/ay';

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className={`relative flex flex-col items-center text-center rounded-2xl border-[1.5px] transition-all duration-300 overflow-visible ${
        isPopular ? 'flex-[1.2] z-10' : 'flex-1 z-0'
      } ${
        isPopular
          ? isSelected
            ? 'border-primary bg-card shadow-[0_8px_40px_-8px_hsl(var(--primary)/0.2)]'
            : 'border-primary/30 bg-card shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.12)]'
          : isSelected
            ? 'border-primary/50 bg-card shadow-[0_4px_16px_-4px_hsl(var(--foreground)/0.08)]'
            : 'border-border/40 bg-card shadow-[0_2px_8px_-2px_hsl(var(--foreground)/0.04)]'
      }`}
      style={{ minWidth: 0 }}
    >
      {/* Popular badge — floating above card */}
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground text-[10px] font-bold px-4 py-1 rounded-full shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.35)] flex items-center gap-1 whitespace-nowrap">
            <Sparkles className="w-3 h-3" />
            Popüler
          </div>
        </div>
      )}

      <div className={`flex flex-col items-center w-full px-1.5 pb-4 ${isPopular ? 'pt-5' : 'pt-4'}`}>
        {/* Icon */}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${
          isPopular ? 'bg-primary/10' : 'bg-muted/50'
        }`}>
          <Icon className={`w-4 h-4 ${isPopular ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>

        {/* Name */}
        <p className={`font-bold truncate max-w-full ${isPopular ? 'text-sm' : 'text-xs'}`}>
          {plan.name}
        </p>

        {/* Price block — NEVER wraps */}
        {pricesLoading ? (
          <Skeleton className="h-8 w-14 mt-3 rounded-lg" />
        ) : (
          <div className="flex flex-col items-center mt-3 min-w-0 max-w-full">
            {/* Price + period on ONE line, responsive font */}
            <div className="flex items-baseline gap-0.5 min-w-0 max-w-full overflow-hidden">
              <span
                className={`font-extrabold tracking-tight leading-none ${
                  isPopular ? 'text-lg' : 'text-[15px]'
                }`}
                style={{ fontSize: isPopular ? 'clamp(1rem, 4vw, 1.25rem)' : 'clamp(0.8rem, 3.2vw, 0.9375rem)' }}
              >
                {cleanPrice(priceStr)}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                {periodLabel}
              </span>
            </div>

            {/* Yearly → monthly equivalent */}
            {isYearly && priceNum > 0 && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1.5 whitespace-nowrap">
                ≈ ₺{Math.round(priceNum / 12)}/ay
              </p>
            )}
          </div>
        )}

        {/* Tagline */}
        <p className="text-[11px] text-muted-foreground mt-3 whitespace-nowrap">
          {plan.tagline}
        </p>

        {/* Selection radio */}
        <div className={`w-5 h-5 rounded-full border-2 mt-4 flex items-center justify-center transition-all duration-200 ${
          isSelected ? 'border-primary bg-primary scale-110' : 'border-muted-foreground/20'
        }`}>
          {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
        </div>
      </div>
    </motion.button>
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
          <div className="animate-pulse space-y-4 w-full max-w-sm px-4">
            <div className="h-10 bg-muted rounded-xl" />
            <div className="h-8 bg-muted rounded-full w-40 mx-auto" />
            <div className="flex gap-3">
              <div className="h-44 bg-muted rounded-2xl flex-1" />
              <div className="h-48 bg-muted rounded-2xl flex-[1.2]" />
              <div className="h-44 bg-muted rounded-2xl flex-1" />
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
    <div className="h-screen bg-background flex flex-col">
      <AppHeader />

      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: 'calc(11rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="w-full max-w-md mx-auto px-3 sm:px-5 space-y-6 py-5">

          {/* ── Hero ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2"
          >
            <div className="flex items-center justify-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-primary p-[1.5px]">
                <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 via-primary to-accent bg-clip-text text-transparent">
                Premium
              </h1>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
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
            <div className="relative inline-flex bg-muted/50 rounded-2xl p-1 border border-border/30">
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-y-1 rounded-xl bg-card shadow-sm border border-border/50"
                style={{
                  width: 'calc(50% - 4px)',
                  left: isYearly ? 'calc(50%)' : '4px',
                }}
              />
              <button
                onClick={() => setIsYearly(false)}
                className={`relative z-10 px-7 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  !isYearly ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Aylık
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`relative z-10 px-7 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  isYearly ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Yıllık
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">2 ay 🎁</span>
              </button>
            </div>
          </motion.div>

          {/* ── Plan Cards ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-stretch gap-3 pt-2"
          >
            {plans.map((plan) => {
              const currentProductId = isYearly ? plan.yearlyId : plan.monthlyId;
              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isSelected={selectedPlan === plan.id}
                  isYearly={isYearly}
                  priceStr={getPrice(currentProductId)}
                  priceNum={getPriceAmount(currentProductId)}
                  pricesLoading={pricesLoading}
                  onSelect={() => setSelectedPlan(plan.id)}
                />
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
                className="flex items-center gap-1.5 bg-primary/[0.08] text-primary rounded-full px-3.5 py-2"
              >
                <f.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] font-semibold whitespace-nowrap">{f.label}</span>
              </div>
            ))}
          </motion.div>

          {/* ── Trust & Social Proof ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-2.5 pt-1"
          >
            {trustItems.map(item => (
              <div key={item.label} className="flex items-center justify-center gap-2">
                <item.icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
              </div>
            ))}
            {isYearly && (
              <div className="flex items-center justify-center gap-2">
                <Gift className="w-3.5 h-3.5 text-amber-500 shrink-0" />
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
        className="fixed left-0 right-0 z-40 px-5 pt-4 bg-background/95 backdrop-blur-xl border-t border-border/15 lg:hidden"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))', paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-md mx-auto space-y-2.5">
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handlePurchase}
              disabled={isLoading}
              className="w-full h-14 text-[15px] font-bold bg-gradient-to-r from-primary to-emerald-600 active:opacity-90 relative overflow-hidden rounded-2xl shadow-[0_6px_28px_-4px_hsl(var(--primary)/0.35)] border-0"
              size="lg"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2.5 }}
              />
              {isLoading ? (
                <span className="flex items-center gap-2 relative">
                  <span className="animate-spin">⏳</span> İşleniyor...
                </span>
              ) : (
                <span className="flex items-center gap-2.5 relative">
                  <Crown className="h-5 w-5" /> Premium'a Geç
                </span>
              )}
            </Button>
          </motion.div>

          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground/70 leading-tight">
            <Shield className="w-3 h-3 text-emerald-600/60 dark:text-emerald-400/60 shrink-0" />
            <span>Google Play güvencesiyle · İstediğin zaman iptal</span>
            <span className="mx-0.5">·</span>
            <button onClick={handleRestore} className="underline">Geri yükle</button>
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
