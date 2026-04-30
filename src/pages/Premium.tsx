import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Crown, Check, Sparkles, Zap, Shield, Brain, MessageSquare, Ban, History, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessLevel } from '@/hooks/useAccessLevel';
import { usePlatformPremium } from '@/hooks/usePlatformPremium';
import { usePlatform } from '@/hooks/usePlatform';
import { useStoreProducts } from '@/hooks/useStoreProducts';
import { purchaseService, PRODUCTS, PLAN_PRODUCTS } from '@/services/purchaseService';
import AppHeader from '@/components/layout/AppHeader';
import PlanComparisonTable from '@/components/premium/PlanComparisonTable';
import SocialProofCounter from '@/components/premium/SocialProofCounter';
import HeroGlow from '@/components/premium/HeroGlow';
import TrustBadges from '@/components/premium/TrustBadges';
import UpgradeSuccessScreen from '@/components/premium/UpgradeSuccessScreen';
import PromoBanner from '@/components/premium/PromoBanner';
import StreakBadge from '@/components/streak/StreakBadge';
import { useHapticTap } from '@/hooks/useHapticTap';
import { useStreak } from '@/hooks/useStreak';
import { toast } from 'sonner';

// ─── Plan data ─────────────────────────────────────────────
interface PlanConfig {
  id: 'premium_basic' | 'premium_plus' | 'premium_pro';
  nameKey: 'basic' | 'plus' | 'pro';
  monthlyId: string;
  yearlyId: string;
  chatLimit: number;
  popular: boolean;
  icon: React.ElementType;
}

const plans: PlanConfig[] = [
  {
    id: 'premium_basic', nameKey: 'basic',
    monthlyId: PRODUCTS.PREMIUM_BASIC_MONTHLY, yearlyId: PRODUCTS.PREMIUM_BASIC_YEARLY,
    chatLimit: PLAN_PRODUCTS.premium_basic.chatLimit, popular: false, icon: Zap,
  },
  {
    id: 'premium_plus', nameKey: 'plus',
    monthlyId: PRODUCTS.PREMIUM_PLUS_MONTHLY, yearlyId: PRODUCTS.PREMIUM_PLUS_YEARLY,
    chatLimit: PLAN_PRODUCTS.premium_plus.chatLimit, popular: true, icon: Crown,
  },
  {
    id: 'premium_pro', nameKey: 'pro',
    monthlyId: PRODUCTS.PREMIUM_PRO_MONTHLY, yearlyId: PRODUCTS.PREMIUM_PRO_YEARLY,
    chatLimit: PLAN_PRODUCTS.premium_pro.chatLimit, popular: false, icon: Sparkles,
  },
];

const cleanPrice = (s: string): string => s.replace(/\s*\/(yıl|ay|year|month|yr|mo|jahr|año|سنة|شهر)\s*$/i, '').trim();

// ─── Active Plan View ─────────────────────────────────────
const ActivePlanView = ({ plans: plansList, planType, isAdmin }: { plans: PlanConfig[]; planType: string; isAdmin: boolean }) => {
  const { t } = useTranslation('premium');
  const currentPlan = plansList.find(p => p.id === planType) || plansList[1];
  const planName = currentPlan ? t(`plans.${currentPlan.nameKey}.name`) : t('title');
  const Icon = currentPlan?.icon || Crown;

  const features = [
    { icon: Brain, label: t('active.unlimitedAnalysis'), desc: t('active.noDailyLimit') },
    { icon: MessageSquare, label: t('active.aiAssistant'), desc: t('active.messagesPerDay', { count: currentPlan?.chatLimit ?? '∞' }) },
    { icon: Ban, label: t('active.noAds'), desc: t('active.cleanExperience') },
    { icon: History, label: t('active.historyAccess'), desc: t('active.allAnalyses') },
  ];

  return (
    <div className="h-screen bg-background flex flex-col" style={{ userSelect: 'none' }}>
      <AppHeader showBack />
      <main
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          overscrollBehavior: 'contain',
        }}
      >
        <div className="w-full max-w-sm mx-auto space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-background relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] to-transparent pointer-events-none" />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
              className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-primary p-[1.5px] mx-auto mb-4"
            >
              <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center">
                <Icon className="h-7 w-7 text-primary" />
              </div>
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg font-bold relative">
              {isAdmin ? t('active.adminAccess') : planName}
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="text-xs text-muted-foreground mt-1 relative">
              {isAdmin ? t('active.adminDesc') : t('active.activeSubscription')}
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-2 gap-2.5">
            {features.map((f, idx) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.06 }}
                whileTap={{ scale: 0.97 }}
                className="p-3.5 rounded-2xl bg-muted/20 border border-border/30"
              >
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                  <f.icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-[11px] font-semibold">{f.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="p-3 rounded-xl bg-muted/10 border border-border/20 text-center">
            <p className="text-[10px] text-muted-foreground">{t('billing.managedByPlay')}</p>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

// ─── Plan Card (Vertical Full-Width) ──────────────────────
interface PlanCardProps {
  plan: PlanConfig;
  isSelected: boolean;
  isYearly: boolean;
  priceStr: string;
  priceNum: number;
  monthlyPriceNum: number;
  pricesLoading: boolean;
  onSelect: () => void;
}

const PlanCard = ({ plan, isSelected, isYearly, priceStr, priceNum, monthlyPriceNum, pricesLoading, onSelect }: PlanCardProps) => {
  const { t, i18n } = useTranslation('premium');
  const Icon = plan.icon;
  const isPopular = plan.popular;
  const periodLabel = isYearly ? t('billing.perYear') : t('billing.perMonth');
  const planName = t(`plans.${plan.nameKey}.name`);
  const tagline = t(`plans.${plan.nameKey}.tagline`);

  const formatMonthly = (n: number) => {
    try { return new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 0 }).format(n); }
    catch { return String(n); }
  };

  const yearlyEquivalent = monthlyPriceNum * 12;
  const savingsPercent = yearlyEquivalent > 0 ? Math.round(((yearlyEquivalent - priceNum) / yearlyEquivalent) * 100) : 0;
  const showSavings = isYearly && priceNum > 0 && monthlyPriceNum > 0 && savingsPercent >= 5;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      role="radio"
      aria-checked={isSelected}
      aria-label={`${planName} — ${tagline}`}
      className={`relative w-full flex items-center gap-4 rounded-2xl border-[1.5px] p-4 transition-all duration-200 ${
        isSelected
          ? 'border-primary bg-primary/[0.04] shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.2)]'
          : 'border-border/40 bg-card/80'
      } ${isPopular && isSelected ? 'scale-[1.01]' : ''}`}
      style={{ WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
    >
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute -top-3 left-4 z-10">
          <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground text-[10px] font-bold px-3 py-0.5 rounded-full shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.4)] flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            {t('plans.popular')}
          </div>
        </div>
      )}

      {/* Savings badge */}
      {showSavings && (
        <div className="absolute -top-2.5 right-4 z-10">
          <div className="bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-md">
            {t('yearly.saveBadge', { percent: savingsPercent })}
          </div>
        </div>
      )}

      {/* Icon */}
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
        isSelected ? 'bg-primary/15' : 'bg-muted/40'
      }`}>
        <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <p className="font-bold text-[14px] leading-tight">{planName}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{tagline}</p>
      </div>

      {/* Price + radio */}
      <div className="flex items-center gap-3 shrink-0">
        {pricesLoading ? (
          <div className="w-16 h-6 rounded-lg bg-muted animate-pulse" />
        ) : (
          <div className="text-right">
            <div className="flex items-baseline gap-0.5">
              <span className="font-extrabold text-[15px] tracking-tight leading-none">
                {cleanPrice(priceStr)}
              </span>
              <span className="text-[9px] text-muted-foreground font-medium">
                {periodLabel}
              </span>
            </div>
            {isYearly && priceNum > 0 && (
              <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                {t('billing.approxPerMonth', { price: `${formatMonthly(Math.round(priceNum / 12))}` })}
              </p>
            )}
          </div>
        )}

        {/* Radio */}
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/25'
        }`}>
          {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
        </div>
      </div>
    </motion.button>
  );
};

// ─── Main Premium Page ────────────────────────────────────
const Premium = () => {
  const { t } = useTranslation('premium');
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isNative } = usePlatform();
  const { isPremium, isAdmin } = useAccessLevel();
  const { planType, refetch } = usePlatformPremium();
  const { getPrice, getPriceAmount, isLoading: pricesLoading } = useStoreProducts();
  const { streak } = useStreak();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig['id']>('premium_plus');
  const [isYearly, setIsYearly] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const tapMedium = useHapticTap('medium');
  const tapLight = useHapticTap('light');

  const sel = plans.find(p => p.id === selectedPlan)!;
  const productId = isYearly ? sel.yearlyId : sel.monthlyId;
  const planName = t(`plans.${sel.nameKey}.name`);

  const includedFeatures = [
    { icon: Brain, label: t('features.unlimitedAnalysis') },
    { icon: Ban, label: t('features.noAds') },
    { icon: History, label: t('features.history') },
    { icon: MessageSquare, label: t('features.aiComments') },
  ];

  const showStreakPromo = streak.current_streak >= 5;

  const handlePurchase = async () => {
    tapMedium();
    if (!user) { navigate('/auth'); return; }
    setIsLoading(true);
    try {
      if (isNative) {
        const result = await purchaseService.purchaseSubscription(productId);
        if (result.success) {
          refetch();
          setShowSuccess(true);
        } else {
          const isActivationError = result.error?.includes('doğrulanamadı') || result.error?.includes('kaydedilemedi');
          toast.error(isActivationError ? t('messages.activationFailed') : (result.error || t('messages.purchaseFailed')));
        }
      } else {
        toast.info(t('messages.nativeRequired'));
      }
    } catch { toast.error(t('messages.genericError')); }
    finally { setIsLoading(false); }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      const r = await purchaseService.restorePurchases();
      if (r.success) { refetch(); toast.success(t('messages.restoreSuccess')); }
      else { toast.info(r.error || t('messages.restoreNone')); }
    } catch { toast.error(t('messages.shortError')); }
    finally { setIsLoading(false); }
  };

  // Loading skeleton with shimmer
  if (authLoading) {
    return (
      <div className="h-screen bg-background flex flex-col">
        <AppHeader showBack />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="space-y-4 w-full max-w-sm">
            <div className="h-12 bg-muted rounded-2xl skeleton-shimmer" />
            <div className="h-10 bg-muted rounded-2xl w-48 mx-auto skeleton-shimmer" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-muted rounded-2xl skeleton-shimmer" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isPremium || isAdmin) {
    return <ActivePlanView plans={plans} planType={planType} isAdmin={isAdmin} />;
  }

  return (
    <div className="h-screen bg-background flex flex-col" style={{ userSelect: 'none' }}>
      <AppHeader showBack />

      <AnimatePresence>
        {showSuccess && (
          <UpgradeSuccessScreen
            planName={planName}
            onDismiss={() => { setShowSuccess(false); navigate('/'); }}
          />
        )}
      </AnimatePresence>

      <main
        className="flex-1 overflow-y-auto relative"
        style={{
          paddingBottom: 'calc(160px + env(safe-area-inset-bottom, 0px))',
          overscrollBehavior: 'contain',
        }}
      >
        <HeroGlow />
        <div className="w-full max-w-md mx-auto space-y-5 py-4 relative px-4">

          {/* Hero */}
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
                {t('hero.heading')}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('hero.tagline')}
            </p>
          </motion.div>

          {/* Promo banner */}
          {showStreakPromo ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <PromoBanner type="limited" discount={20} expiresLabel={t('promo.streakBonus', { days: streak.current_streak })} />
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <PromoBanner type="seasonal" />
            </motion.div>
          )}

          {/* Period Toggle — flex-based */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 }}
            className="flex justify-center"
          >
            <div className="relative flex bg-muted/50 rounded-2xl p-1 border border-border/30 w-full max-w-[280px]">
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
                onClick={() => { tapLight(); setIsYearly(false); }}
                className={`relative z-10 flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  !isYearly ? 'text-foreground' : 'text-muted-foreground'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
              >
                {t('billing.monthly')}
              </button>
              <button
                onClick={() => { tapLight(); setIsYearly(true); }}
                className={`relative z-10 flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                  isYearly ? 'text-foreground' : 'text-muted-foreground'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
              >
                {t('billing.yearly')}
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">{t('billing.savingsBadge')}</span>
              </button>
            </div>
          </motion.div>

          {/* Plan Cards — Vertical Stack */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="space-y-3 pt-1"
          >
            {plans.map((plan, idx) => {
              const currentProductId = isYearly ? plan.yearlyId : plan.monthlyId;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.14 + idx * 0.05 }}
                >
                  <PlanCard
                    plan={plan}
                    isSelected={selectedPlan === plan.id}
                    isYearly={isYearly}
                    priceStr={getPrice(currentProductId)}
                    priceNum={getPriceAmount(currentProductId)}
                    monthlyPriceNum={getPriceAmount(plan.monthlyId)}
                    pricesLoading={pricesLoading}
                    onSelect={() => { tapLight(); setSelectedPlan(plan.id); }}
                  />
                </motion.div>
              );
            })}
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 }}
            className="flex items-center justify-center gap-2 flex-wrap"
          >
            {includedFeatures.map(f => (
              <motion.div
                key={f.label}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 bg-primary/[0.08] text-primary rounded-full px-3.5 py-2 border border-primary/10"
              >
                <f.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] font-semibold whitespace-nowrap">{f.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Streak badge */}
          {streak.current_streak > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex justify-center">
              <StreakBadge />
            </motion.div>
          )}

          {/* Plan comparison */}
          <PlanComparisonTable />

          {/* Social proof */}
          <SocialProofCounter />

          {/* Trust badges */}
          <TrustBadges />

          {/* Trust copy */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-col items-center gap-1 py-1">
            <span className="text-[11px] text-muted-foreground/70 text-center">
              {t('trust.highAccuracy')}
            </span>
          </motion.div>
        </div>
      </main>

      {/* ─── Sticky CTA ─────────────────────────────────── */}
      <div
        className="sticky bottom-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border/30 px-4 pt-3"
        style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 8px)' }}
      >
        <motion.div whileTap={{ scale: 0.96 }}>
          <Button
            onClick={handlePurchase}
            disabled={isLoading}
            className="w-full h-[52px] text-[15px] font-bold bg-gradient-to-r from-primary via-emerald-600 to-emerald-500 active:opacity-90 relative overflow-hidden rounded-2xl shadow-[0_8px_32px_-4px_hsl(var(--primary)/0.45)] border-0"
            size="lg"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2.5 }}
            />
            {isLoading ? (
              <span className="flex items-center gap-2 relative">
                <Loader2 className="w-4 h-4 animate-spin" /> {t('actions.processing')}
              </span>
            ) : (
              <span className="flex items-center gap-2.5 relative">
                <Crown className="h-5 w-5" /> {t('actions.upgrade')}
              </span>
            )}
          </Button>
        </motion.div>

        <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground/70 leading-tight mt-2">
          <Shield className="w-3 h-3 text-emerald-600/60 dark:text-emerald-400/60 shrink-0" />
          <span>{t('billing.secure')}</span>
          <span className="mx-0.5">&middot;</span>
          <button onClick={handleRestore} className="underline" style={{ WebkitTapHighlightColor: 'transparent' }}>{t('actions.restore')}</button>
          <span className="mx-0.5">&middot;</span>
          <Link to="/terms" className="underline">{t('billing.termsLink')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Premium;
