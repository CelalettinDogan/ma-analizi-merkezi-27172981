import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Crown, Brain, Ban, History, Check, MessageSquare, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlatform } from '@/hooks/usePlatform';
import { usePlatformPremium } from '@/hooks/usePlatformPremium';
import { useStoreProducts } from '@/hooks/useStoreProducts';
import { purchaseService, PRODUCTS, PLAN_PRODUCTS } from '@/services/purchaseService';
import { toast } from 'sonner';

interface PremiumUpgradeProps {
  onClose?: () => void;
}

interface PlanConfig {
  id: 'premium_basic' | 'premium_plus' | 'premium_pro';
  nameKey: 'basic' | 'plus' | 'pro';
  monthlyId: string;
  yearlyId: string;
  chatLimit: number;
  popular: boolean;
  color: string;
}

const plans: PlanConfig[] = [
  {
    id: 'premium_basic', nameKey: 'basic',
    monthlyId: PRODUCTS.PREMIUM_BASIC_MONTHLY, yearlyId: PRODUCTS.PREMIUM_BASIC_YEARLY,
    chatLimit: PLAN_PRODUCTS.premium_basic.chatLimit, popular: false,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'premium_plus', nameKey: 'plus',
    monthlyId: PRODUCTS.PREMIUM_PLUS_MONTHLY, yearlyId: PRODUCTS.PREMIUM_PLUS_YEARLY,
    chatLimit: PLAN_PRODUCTS.premium_plus.chatLimit, popular: true,
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 'premium_pro', nameKey: 'pro',
    monthlyId: PRODUCTS.PREMIUM_PRO_MONTHLY, yearlyId: PRODUCTS.PREMIUM_PRO_YEARLY,
    chatLimit: PLAN_PRODUCTS.premium_pro.chatLimit, popular: false,
    color: 'from-amber-500 to-orange-600',
  },
];

export const PremiumUpgrade: React.FC<PremiumUpgradeProps> = ({ onClose }) => {
  const { t } = useTranslation('premium');
  const { isNative } = usePlatform();
  const { refetch } = usePlatformPremium();
  const { getPrice, isLoading: pricesLoading } = useStoreProducts();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig['id']>('premium_plus');
  const [isYearly, setIsYearly] = useState(true);

  const selectedPlanConfig = plans.find(p => p.id === selectedPlan)!;
  const productId = isYearly ? selectedPlanConfig.yearlyId : selectedPlanConfig.monthlyId;
  const priceStr = getPrice(productId);
  const planName = t(`plans.${selectedPlanConfig.nameKey}.name`);

  const features = [
    { icon: Brain, label: t('features.unlimitedAnalysis'), description: t('features.unlimitedAnalysisDesc') },
    { icon: MessageSquare, label: t('features.aiAssistant'), description: t('features.aiAssistantDesc') },
    { icon: Ban, label: t('features.noAds'), description: t('features.noAdsDesc') },
    { icon: History, label: t('features.history'), description: t('features.historyDesc') },
  ];

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      if (isNative) {
        const result = await purchaseService.purchaseSubscription(productId);
        if (result.success) {
          refetch();
          toast.success(t('messages.purchaseSuccessUpgrade', { plan: planName }));
          onClose?.();
        } else {
          const isActivationError = result.error?.includes('doğrulanamadı') || result.error?.includes('kaydedilemedi');
          if (isActivationError) {
            toast.error(t('messages.activationFailedAlt'));
          } else {
            toast.error(result.error || t('messages.purchaseFailed'));
          }
        }
      } else {
        toast.info(t('messages.nativeRequiredTest'));
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(t('messages.genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      const result = await purchaseService.restorePurchases();
      if (result.success) {
        refetch();
        toast.success(t('messages.restoreSuccessFull'));
        onClose?.();
      } else {
        toast.info(result.error || t('messages.restoreNone'));
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast.error(t('messages.restoreFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto"
    >
      <Card className="border-primary/20 bg-gradient-to-b from-background to-primary/5">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t('upgrade.title')}</CardTitle>
          <p className="text-muted-foreground text-sm mt-2">
            {t('upgrade.subtitle')}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-4 p-3 rounded-xl bg-muted/50">
            <Label
              htmlFor="billing-toggle"
              className={`text-sm cursor-pointer transition-colors ${!isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
            >
              {t('billing.monthly')}
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <div className="flex items-center gap-1">
              <Label
                htmlFor="billing-toggle"
                className={`text-sm cursor-pointer transition-colors ${isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
              >
                {t('billing.yearly')}
              </Label>
              {isYearly && (
                <Badge variant="secondary" className="text-micro bg-green-500/10 text-green-600">
                  {t('billing.twoMonthsFree')}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const currentProductId = isYearly ? plan.yearlyId : plan.monthlyId;
              const displayPrice = getPrice(currentProductId);
              const pName = t(`plans.${plan.nameKey}.name`);

              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative p-3 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-lg'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-micro px-2">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {t('plans.popular')}
                    </Badge>
                  )}

                  <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                    {plan.id === 'premium_basic' && <Zap className="w-4 h-4 text-white" />}
                    {plan.id === 'premium_plus' && <Crown className="w-4 h-4 text-white" />}
                    {plan.id === 'premium_pro' && <Sparkles className="w-4 h-4 text-white" />}
                  </div>

                  <p className="font-semibold text-sm">{pName}</p>

                  {pricesLoading ? (
                    <Skeleton className="h-6 w-14 mx-auto mt-1 rounded" />
                  ) : (
                    <p className="text-lg font-bold text-primary mt-1">
                      {displayPrice}
                    </p>
                  )}
                  <p className="text-micro text-muted-foreground">
                    {isYearly ? t('billing.perYear') : t('billing.perMonth')}
                  </p>

                  <div className="flex items-center justify-center gap-1 mt-2">
                    <MessageSquare className="w-3 h-3 text-muted-foreground" />
                    <span className="text-micro text-muted-foreground">
                      {t('plans.chatPerDay', { count: plan.chatLimit })}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="absolute top-1 right-1">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-2 p-2 rounded-lg bg-muted/30"
              >
                <div className="p-1.5 rounded-md bg-primary/10">
                  <feature.icon className="h-3 w-3 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-xs">{feature.label}</p>
                  <p className="text-micro text-muted-foreground leading-tight">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{planName}</p>
                <p className="text-xs text-muted-foreground">
                  {t('plans.summaryLine', { count: selectedPlanConfig.chatLimit })}
                </p>
              </div>
              <div className="text-right">
                {pricesLoading ? (
                  <Skeleton className="h-7 w-16 rounded" />
                ) : (
                  <p className="text-xl font-bold text-primary">{priceStr}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {isYearly ? t('billing.perYear') : t('billing.perMonth')}
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handlePurchase}
            disabled={isLoading}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                {t('actions.processing')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                {t('actions.buy')}
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
              {t('actions.restore')}
            </Button>
          )}

          {onClose && (
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full text-muted-foreground"
            >
              {t('actions.skip')}
            </Button>
          )}

          <div className="space-y-2 text-center">
            <p className="text-micro text-muted-foreground leading-relaxed">
              {t('billing.autoRenewNotice')}
            </p>
            <p className="text-micro text-muted-foreground">
              {t('billing.termsAcceptance', {
                terms: '__TERMS__',
                privacy: '__PRIVACY__',
              }).split('__TERMS__').map((part, i, arr) => {
                if (i === arr.length - 1) {
                  const [before, after] = part.split('__PRIVACY__');
                  return (
                    <React.Fragment key={i}>
                      {before}
                      <Link to="/privacy" className="underline hover:text-foreground">{t('billing.privacyLink')}</Link>
                      {after}
                    </React.Fragment>
                  );
                }
                return (
                  <React.Fragment key={i}>
                    {part}
                    <Link to="/terms" className="underline hover:text-foreground">{t('billing.termsLink')}</Link>
                  </React.Fragment>
                );
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PremiumUpgrade;
