import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { 
  Crown, Check, Sparkles, Zap, Shield,
  Brain, MessageSquare, Ban, History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessLevel } from '@/hooks/useAccessLevel';
import { usePlatformPremium } from '@/hooks/usePlatformPremium';
import { usePlatform } from '@/hooks/usePlatform';
import { purchaseService, PRODUCTS, PLAN_PRODUCTS } from '@/services/purchaseService';
import { PLAN_PRICES } from '@/constants/accessLevels';
import AppHeader from '@/components/layout/AppHeader';
import BottomNav from '@/components/navigation/BottomNav';
import { toast } from 'sonner';

// ─── Animation Variants ────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ─── Plan Configs ──────────────────────────────────────────
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
    id: 'premium_basic',
    name: 'Basic',
    tagline: 'Sınırsız analiz başlangıcı',
    monthlyId: PRODUCTS.PREMIUM_BASIC_MONTHLY,
    yearlyId: PRODUCTS.PREMIUM_BASIC_YEARLY,
    monthlyPrice: PLAN_PRICES.premium_basic.monthly,
    yearlyPrice: PLAN_PRICES.premium_basic.yearly,
    chatLimit: PLAN_PRODUCTS.premium_basic.chatLimit,
    popular: false,
    icon: Zap,
  },
  {
    id: 'premium_plus',
    name: 'Plus',
    tagline: 'En iyi fiyat / performans',
    monthlyId: PRODUCTS.PREMIUM_PLUS_MONTHLY,
    yearlyId: PRODUCTS.PREMIUM_PLUS_YEARLY,
    monthlyPrice: PLAN_PRICES.premium_plus.monthly,
    yearlyPrice: PLAN_PRICES.premium_plus.yearly,
    chatLimit: PLAN_PRODUCTS.premium_plus.chatLimit,
    popular: true,
    icon: Crown,
  },
  {
    id: 'premium_pro',
    name: 'Pro',
    tagline: 'Maksimum AI deneyimi',
    monthlyId: PRODUCTS.PREMIUM_PRO_MONTHLY,
    yearlyId: PRODUCTS.PREMIUM_PRO_YEARLY,
    monthlyPrice: PLAN_PRICES.premium_pro.monthly,
    yearlyPrice: PLAN_PRICES.premium_pro.yearly,
    chatLimit: PLAN_PRODUCTS.premium_pro.chatLimit,
    popular: false,
    icon: Sparkles,
  },
];

// ─── Billing Toggle ────────────────────────────────────────
const BillingToggle: React.FC<{ isYearly: boolean; onChange: (v: boolean) => void }> = ({ isYearly, onChange }) => (
  <motion.div variants={item} className="flex justify-center">
    <div className="relative inline-flex items-center rounded-full bg-muted/60 p-1 backdrop-blur-sm border border-border/50">
      <button
        onClick={() => onChange(false)}
        className={`relative z-10 px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
          !isYearly ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        Aylık
      </button>
      <button
        onClick={() => onChange(true)}
        className={`relative z-10 px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 ${
          isYearly ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        Yıllık
        {isYearly && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-[10px] font-bold text-emerald-500"
          >
            -17%
          </motion.span>
        )}
      </button>
      {/* Sliding pill */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="absolute inset-y-1 rounded-full bg-background shadow-sm border border-border/80"
        style={{
          width: 'calc(50% - 4px)',
          left: isYearly ? 'calc(50% + 2px)' : '4px',
        }}
      />
    </div>
  </motion.div>
);

// ─── Plan Card ─────────────────────────────────────────────
const PlanCard: React.FC<{
  plan: PlanConfig;
  isSelected: boolean;
  isYearly: boolean;
  onSelect: () => void;
}> = ({ plan, isSelected, isYearly, onSelect }) => {
  const displayPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const period = isYearly ? '/yıl' : '/ay';
  const Icon = plan.icon;

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className={`relative w-full rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
        plan.popular
          ? isSelected
            ? 'border-primary bg-primary/5 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.25)]'
            : 'border-primary/40 bg-primary/[0.02]'
          : isSelected
            ? 'border-primary bg-primary/5 shadow-lg'
            : 'border-border/60 bg-card/60 backdrop-blur-sm hover:border-border'
      }`}
    >
      {/* Popüler badge – sits INSIDE the card with proper spacing */}
      {plan.popular && (
        <div className="bg-primary text-primary-foreground text-[11px] font-semibold text-center py-1.5 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" />
          En İyi Fiyat / Performans
        </div>
      )}

      <div className={`p-4 ${plan.popular ? '' : 'pt-5'}`}>
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              plan.popular
                ? 'bg-primary/15'
                : 'bg-muted/80'
            }`}>
              <Icon className={`w-4.5 h-4.5 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="font-bold text-base">{plan.name}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{plan.tagline}</p>
            </div>
          </div>
          {/* Selection indicator */}
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
          }`}>
            {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-extrabold tracking-tight">₺{displayPrice}</span>
          <span className="text-xs text-muted-foreground">{period}</span>
        </div>

        {isYearly && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            aylık ₺{Math.round(displayPrice / 12)}
          </p>
        )}

        {/* Key differentiator */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{plan.chatLimit} AI mesajı/gün</span>
          <span className="text-border">•</span>
          <span>Sınırsız analiz</span>
        </div>
      </div>
    </motion.button>
  );
};

// ─── All Premium Features (shown once) ────────────────────
const allFeatures = [
  { icon: Brain, label: 'Sınırsız maç analizi' },
  { icon: MessageSquare, label: 'AI destekli yorumlar' },
  { icon: History, label: 'Analiz geçmişine erişim' },
  { icon: Ban, label: 'Reklamsız deneyim' },
];

// ─── Main Component ───────────────────────────────────────
const Premium = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isNative } = usePlatform();
  const { isPremium, isAdmin } = useAccessLevel();
  const { planType } = usePlatformPremium();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig['id']>('premium_plus');
  const [isYearly, setIsYearly] = useState(true);

  const selectedPlanConfig = plans.find(p => p.id === selectedPlan)!;
  const productId = isYearly ? selectedPlanConfig.yearlyId : selectedPlanConfig.monthlyId;
  const price = isYearly ? selectedPlanConfig.yearlyPrice : selectedPlanConfig.monthlyPrice;
  const planName = PLAN_PRODUCTS[selectedPlan].name;

  const handlePurchase = async () => {
    if (!user) { navigate('/auth'); return; }
    setIsLoading(true);
    try {
      if (isNative) {
        const result = await purchaseService.purchaseSubscription(productId);
        if (result.success) toast.success(`${planName} üyeliğin aktif edildi!`);
        else toast.error(result.error || 'Satın alma başarısız');
      } else {
        toast.info('Gerçek satın alma için mobil uygulama gerekli');
      }
    } catch { toast.error('Bir hata oluştu'); }
    finally { setIsLoading(false); }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      const result = await purchaseService.restorePurchases();
      if (result.success) toast.success('Satın almalar geri yüklendi!');
      else toast.info(result.error || 'Geri yüklenecek satın alma bulunamadı');
    } catch { toast.error('Geri yükleme başarısız'); }
    finally { setIsLoading(false); }
  };

  // ── Loading ──
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-6 pb-24">
          <div className="animate-pulse space-y-4 max-w-md mx-auto">
            <div className="h-20 bg-muted rounded-2xl" />
            <div className="h-12 bg-muted rounded-full w-48 mx-auto" />
            <div className="h-32 bg-muted rounded-2xl" />
            <div className="h-32 bg-muted rounded-2xl" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  // ── Premium/Admin redirect ──
  if (isPremium || isAdmin) return <Navigate to="/profile" replace />;

  // ── Free User Landing ──
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-5 pb-52 lg:pb-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={container}
          className="space-y-5 max-w-md mx-auto"
        >
          {/* ── Hero ── */}
          <motion.div variants={item} className="text-center space-y-2 pt-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 via-primary to-accent p-[2px]"
            >
              <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center">
                <Crown className="w-8 h-8 text-primary" />
              </div>
            </motion.div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 via-primary to-accent bg-clip-text text-transparent">
              GolMetrik Premium
            </h1>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Veriye dayalı maç içgörüleri, gelişmiş istatistik karşılaştırmaları
            </p>
          </motion.div>

          {/* ── Billing Toggle ── */}
          <BillingToggle isYearly={isYearly} onChange={setIsYearly} />

          {/* ── Plan Cards (vertical stack) ── */}
          <motion.div variants={item} className="space-y-3">
            {plans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isSelected={selectedPlan === plan.id}
                isYearly={isYearly}
                onSelect={() => setSelectedPlan(plan.id)}
              />
            ))}
          </motion.div>

          {/* ── All plans include ── */}
          <motion.div variants={item} className="rounded-2xl bg-muted/30 border border-border/50 p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Tüm planlarda
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {allFeatures.map(f => (
                <div key={f.label} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-500" />
                  </div>
                  <span className="text-xs text-foreground/80">{f.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Trust ── */}
          <motion.div variants={item} className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px]">Güvenli Ödeme</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px]">Anında Aktif</span>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* ── Fixed CTA ── */}
      <div
        className="fixed left-0 right-0 z-40 px-4 pt-3 pb-3 bg-gradient-to-t from-background via-background/98 to-background/0 lg:hidden"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-md mx-auto space-y-2">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handlePurchase}
              disabled={isLoading}
              className="w-full h-[52px] text-[15px] font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 relative overflow-hidden rounded-xl"
              style={{ boxShadow: '0 0 24px -4px hsl(var(--primary) / 0.35)' }}
              size="lg"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
              />
              {isLoading ? (
                <span className="flex items-center gap-2 relative">
                  <span className="animate-spin">⏳</span>
                  İşleniyor...
                </span>
              ) : (
                <span className="flex items-center gap-2 relative">
                  <Crown className="h-4.5 w-4.5" />
                  Premium'a Geç
                </span>
              )}
            </Button>
          </motion.div>

          <p className="text-[10px] text-muted-foreground text-center">
            Google Play güvencesiyle •{' '}
            <button onClick={handleRestore} className="underline">
              Satın almaları geri yükle
            </button>
          </p>

          <p className="text-[9px] text-muted-foreground/60 text-center leading-relaxed">
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
