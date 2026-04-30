import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Crown, Check, Sparkles, Zap, Shield, Brain, MessageSquare, Ban, History, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useHapticTap } from '@/hooks/useHapticTap';
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

/** Strip trailing period text like "/yıl", "/ay" from price string if present */
const cleanPrice = (s: string): string => s.replace(/\s*\/(yıl|ay|year|month|yr|mo|jahr|año|سنة|شهر)\s*$/i, '').trim();

// ─── Active Plan View (for premium/admin users) ───────────
const ActivePlanView = ({ plans: plansList, planType, isAdmin }: { plans: PlanConfig[]; planType: string; isAdmin: boolean }) => {
  const { t } = useTranslation('premium');
  const currentPlan = plansList.find(p => p.id === planType) || plansList[1];
  const planName = currentPlan ? t(`plans.${currentPlan.nameKey}.name`) : t('title');
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
              {isAdmin ? t('active.adminAccess') : planName}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? t('active.adminDesc') : t('active.activeSubscription')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Brain, label: t('active.unlimitedAnalysis'), desc: t('active.noDailyLimit') },
              { icon: MessageSquare, label: t('active.aiAssistant'), desc: t('active.messagesPerDay', { count: currentPlan?.chatLimit ?? '∞' }) },
              { icon: Ban, label: t('active.noAds'), desc: t('active.cleanExperience') },
              { icon: History, label: t('active.historyAccess'), desc: t('active.allAnalyses') },
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
              {t('billing.managedByPlay')}
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
    try {
      return new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 0 }).format(n);
    } catch {
      return String(n);
    }
  };

  // Yearly savings vs monthly × 12
  const yearlyEquivalent = monthlyPriceNum * 12;
  const savingsAmount = yearlyEquivalent - priceNum;
  const savingsPercent = yearlyEquivalent > 0 ? Math.round((savingsAmount / yearlyEquivalent) * 100) : 0;
  const showSavings = isYearly && priceNum > 0 && monthlyPriceNum > 0 && savingsPercent >= 5;

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      role="radio"
      aria-checked={isSelected}
      aria-label={`${planName} — ${tagline}`}
      className={`relative flex flex-col items-center text-center rounded-2xl border-[1.5px] transition-all duration-300 overflow-visible ${
        isPopular ? 'flex-[1.2] z-10 scale-[1.05]' : 'flex-1 z-0 opacity-90'
      } ${
        isPopular
          ? isSelected
            ? 'border-primary bg-card shadow-[0_12px_48px_-8px_hsl(var(--primary)/0.25)]'
            : 'border-primary/30 bg-card shadow-[0_8px_32px_-6px_hsl(var(--primary)/0.15)]'
          : isSelected
            ? 'border-primary/50 bg-card shadow-[0_4px_20px_-4px_hsl(var(--foreground)/0.1)]'
            : 'border-border/40 bg-card shadow-[0_2px_12px_-2px_hsl(var(--foreground)/0.06)]'
      }`}
      style={{ minWidth: 0 }}
    >
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground text-[10px] font-bold px-4 py-1 rounded-full shadow-[0_4px_16px_-2px_hsl(var(--primary)/0.5)] ring-2 ring-primary/20 flex items-center gap-1 whitespace-nowrap">
            <Sparkles className="w-3 h-3" />
            {t('plans.popular')}
          </div>
        </div>
      )}

      {showSavings && (
        <div className="absolute -top-2.5 right-1.5 z-20">
          <div className="bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
            {t('yearly.saveBadge', { percent: savingsPercent })}
          </div>
        </div>
      )}

      <div className={`flex flex-col items-center w-full px-2.5 pb-5 ${isPopular ? 'pt-6' : 'pt-5'}`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${
          isPopular ? 'bg-primary/10' : 'bg-muted/50'
        }`}>
          <Icon className={`w-4 h-4 ${isPopular ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>

        <p className={`font-bold truncate max-w-full ${isPopular ? 'text-sm' : 'text-xs'}`}>
          {planName}
        </p>

        {pricesLoading ? (
          <Skeleton className="h-8 w-14 mt-3 rounded-lg" />
        ) : (
          <div className="flex flex-col items-center mt-3 min-w-0 max-w-full">
            <div className="flex items-baseline gap-0.5 min-w-0 max-w-full overflow-hidden">
              <span
                className={`font-extrabold tracking-tight leading-none ${isPopular ? 'text-lg' : 'text-[15px]'}`}
                style={{ fontSize: isPopular ? 'clamp(1rem, 4vw, 1.25rem)' : 'clamp(0.8rem, 3.2vw, 0.9375rem)' }}
              >
                {cleanPrice(priceStr)}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                {periodLabel}
              </span>
            </div>

            {showSavings && (
              <p className="text-[9px] text-muted-foreground/70 line-through whitespace-nowrap mt-0.5">
                ₺{formatMonthly(yearlyEquivalent)}
              </p>
            )}

            {isYearly && priceNum > 0 && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1.5 whitespace-nowrap">
                {t('billing.approxPerMonth', { price: `₺${formatMonthly(priceNum / 12)}` })}
              </p>
            )}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground mt-3 whitespace-nowrap">
          {tagline}
        </p>

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
  const { t } = useTranslation('premium');
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isNative } = usePlatform();
  const { isPremium, isAdmin } = useAccessLevel();
  const { planType, refetch } = usePlatformPremium();
  const { getPrice, getPriceAmount, isLoading: pricesLoading } = useStoreProducts();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig['id']>('premium_plus');
  const [isYearly, setIsYearly] = useState(true);
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

  const handlePurchase = async () => {
    tapMedium();
    if (!user) { navigate('/auth'); return; }
    setIsLoading(true);
    try {
      if (isNative) {
        const result = await purchaseService.purchaseSubscription(productId);
        if (result.success) {
          toast.success(t('messages.purchaseSuccess', { plan: planName }));
          refetch();
        } else {
          const isActivationError = result.error?.includes('doğrulanamadı') || result.error?.includes('kaydedilemedi');
          if (isActivationError) {
            toast.error(t('messages.activationFailed'));
          } else {
            toast.error(result.error || t('messages.purchaseFailed'));
          }
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

  if (isPremium || isAdmin) {
    return <ActivePlanView plans={plans} planType={planType} isAdmin={isAdmin} />;
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <AppHeader />

      <main
        className="flex-1 overflow-y-auto relative"
        style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
      >
        <HeroGlow />
        <div className="w-full max-w-md mx-auto px-3 sm:px-5 space-y-5 py-4 relative">

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

          {/* Period Toggle */}
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
                {t('billing.monthly')}
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`relative z-10 px-7 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  isYearly ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {t('billing.yearly')}
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{t('billing.savingsBadge')}</span>
              </button>
            </div>
          </motion.div>

          {/* Plan Cards */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-stretch gap-2 pt-3"
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
                  monthlyPriceNum={getPriceAmount(plan.monthlyId)}
                  pricesLoading={pricesLoading}
                  onSelect={() => setSelectedPlan(plan.id)}
                />
              );
            })}
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-center gap-2.5 flex-wrap"
          >
            {includedFeatures.map(f => (
              <div
                key={f.label}
                className="flex items-center gap-1.5 bg-primary/[0.08] text-primary rounded-full px-4 py-2.5 border border-primary/10"
              >
                <f.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] font-semibold whitespace-nowrap">{f.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Plan comparison */}
          <PlanComparisonTable />

          {/* Social proof */}
          <SocialProofCounter />

          {/* Trust badges (4 icon strip) */}
          <TrustBadges />

          {/* Trust copy */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center gap-1 py-1"
          >
            <span className="text-[11px] text-muted-foreground/70 text-center">
              {t('trust.highAccuracy')}
            </span>
          </motion.div>

          {/* CTA */}
          <div className="px-2 pt-2 pb-4 space-y-2.5">
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handlePurchase}
                disabled={isLoading}
                className="w-full h-14 text-[15px] font-bold bg-gradient-to-r from-primary via-emerald-600 to-emerald-500 active:opacity-90 relative overflow-hidden rounded-2xl shadow-[0_8px_32px_-4px_hsl(var(--primary)/0.45)] border-0"
                size="lg"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2.5 }}
                />
                {isLoading ? (
                  <span className="flex items-center gap-2 relative">
                    <span className="animate-spin">⏳</span> {t('actions.processing')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2.5 relative">
                    <Crown className="h-5 w-5" /> {t('actions.upgrade')}
                  </span>
                )}
              </Button>
            </motion.div>

            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground/70 leading-tight">
              <Shield className="w-3 h-3 text-emerald-600/60 dark:text-emerald-400/60 shrink-0" />
              <span>{t('billing.secure')}</span>
              <span className="mx-0.5">·</span>
              <button onClick={handleRestore} className="underline">{t('actions.restore')}</button>
            </div>

            <p className="text-[10px] text-muted-foreground/50 text-center leading-tight">
              {t('billing.autoRenewShort').split('.')[0]}.{' '}
              <Link to="/terms" className="underline">{t('billing.termsLink')}</Link>{' · '}
              <Link to="/privacy" className="underline">{t('billing.privacyLink')}</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Premium;
