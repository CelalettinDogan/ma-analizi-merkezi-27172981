import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Brain, Ban, History, Check, MessageSquare, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePlatform } from '@/hooks/usePlatform';
import { purchaseService, PRODUCTS, PLAN_PRODUCTS } from '@/services/purchaseService';
import { PLAN_PRICES } from '@/constants/accessLevels';
import { toast } from 'sonner';

interface PremiumUpgradeProps {
  onClose?: () => void;
}

const features = [
  { icon: Brain, label: 'Sınırsız Analiz', description: 'Günlük limit olmadan maç analizi' },
  { icon: MessageSquare, label: 'AI Asistan', description: 'Planına göre günlük AI mesaj hakkı' },
  { icon: Ban, label: 'Reklamsız', description: 'Kesintisiz, temiz deneyim' },
  { icon: History, label: 'Analiz Geçmişi', description: 'Tüm geçmiş analizlerine erişim' },
];

interface PlanConfig {
  id: 'premium_basic' | 'premium_plus' | 'premium_pro';
  name: string;
  monthlyId: string;
  yearlyId: string;
  monthlyPrice: number;
  yearlyPrice: number;
  chatLimit: number;
  popular: boolean;
  color: string;
}

const plans: PlanConfig[] = [
  {
    id: 'premium_basic',
    name: 'Basic',
    monthlyId: PRODUCTS.PREMIUM_BASIC_MONTHLY,
    yearlyId: PRODUCTS.PREMIUM_BASIC_YEARLY,
    monthlyPrice: PLAN_PRICES.premium_basic.monthly,
    yearlyPrice: PLAN_PRICES.premium_basic.yearly,
    chatLimit: PLAN_PRODUCTS.premium_basic.chatLimit,
    popular: false,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'premium_plus',
    name: 'Plus',
    monthlyId: PRODUCTS.PREMIUM_PLUS_MONTHLY,
    yearlyId: PRODUCTS.PREMIUM_PLUS_YEARLY,
    monthlyPrice: PLAN_PRICES.premium_plus.monthly,
    yearlyPrice: PLAN_PRICES.premium_plus.yearly,
    chatLimit: PLAN_PRODUCTS.premium_plus.chatLimit,
    popular: true,
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 'premium_pro',
    name: 'Pro',
    monthlyId: PRODUCTS.PREMIUM_PRO_MONTHLY,
    yearlyId: PRODUCTS.PREMIUM_PRO_YEARLY,
    monthlyPrice: PLAN_PRICES.premium_pro.monthly,
    yearlyPrice: PLAN_PRICES.premium_pro.yearly,
    chatLimit: PLAN_PRODUCTS.premium_pro.chatLimit,
    popular: false,
    color: 'from-amber-500 to-orange-600',
  },
];

export const PremiumUpgrade: React.FC<PremiumUpgradeProps> = ({ onClose }) => {
  const { isNative } = usePlatform();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig['id']>('premium_plus');
  const [isYearly, setIsYearly] = useState(true);

  const selectedPlanConfig = plans.find(p => p.id === selectedPlan)!;
  const productId = isYearly ? selectedPlanConfig.yearlyId : selectedPlanConfig.monthlyId;
  const price = isYearly ? selectedPlanConfig.yearlyPrice : selectedPlanConfig.monthlyPrice;
  const planName = PLAN_PRODUCTS[selectedPlan].name;

  const handlePurchase = async () => {
    setIsLoading(true);

    try {
      if (isNative) {
        const result = await purchaseService.purchaseSubscription(productId);
        
        if (result.success) {
          toast.success(`${planName} üyeliğin aktif edildi!`);
          onClose?.();
        } else {
          toast.error(result.error || 'Satın alma başarısız');
        }
      } else {
        toast.error('Web üzerinden satın alma yapılamaz. Mobil uygulamayı kullanın.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);

    try {
      const result = await purchaseService.restorePurchases();
      
      if (result.success) {
        toast.success('Satın almalar geri yüklendi!');
        onClose?.();
      } else {
        toast.info(result.error || 'Geri yüklenecek satın alma bulunamadı');
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Geri yükleme başarısız');
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
          <CardTitle className="text-2xl">Premium'a Yükselt</CardTitle>
          <p className="text-muted-foreground text-sm mt-2">
            Sınırsız analiz ve AI Asistan'a eriş
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center gap-4 p-3 rounded-xl bg-muted/50">
            <Label 
              htmlFor="billing-toggle" 
              className={`text-sm cursor-pointer transition-colors ${!isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
            >
              Aylık
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
                Yıllık
              </Label>
              {isYearly && (
                <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">
                  2 ay bedava
                </Badge>
              )}
            </div>
          </div>

          {/* Plan Selection */}
          <div className="grid grid-cols-3 gap-2">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const displayPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              
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
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] px-2">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Popüler
                    </Badge>
                  )}
                  
                  <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                    {plan.id === 'premium_basic' && <Zap className="w-4 h-4 text-white" />}
                    {plan.id === 'premium_plus' && <Crown className="w-4 h-4 text-white" />}
                    {plan.id === 'premium_pro' && <Sparkles className="w-4 h-4 text-white" />}
                  </div>
                  
                  <p className="font-semibold text-sm">{plan.name}</p>
                  
                  <p className="text-lg font-bold text-primary mt-1">
                    ₺{displayPrice}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {isYearly ? '/yıl' : '/ay'}
                  </p>
                  
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <MessageSquare className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">
                      {plan.chatLimit}/gün
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

          {/* Features */}
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
                  <p className="text-[10px] text-muted-foreground leading-tight">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Selected Plan Summary */}
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{planName}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedPlanConfig.chatLimit} AI mesajı/gün • Sınırsız analiz
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">₺{price}</p>
                <p className="text-xs text-muted-foreground">
                  {isYearly ? '/yıl' : '/ay'}
                </p>
              </div>
            </div>
          </div>

          {/* Purchase Button */}
          <Button
            onClick={handlePurchase}
            disabled={isLoading}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                İşleniyor...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Satın Al
              </span>
            )}
          </Button>

          {/* Restore Purchases (Native only) */}
          {isNative && (
            <Button
              variant="ghost"
              onClick={handleRestore}
              disabled={isLoading}
              className="w-full text-sm"
            >
              Satın Almaları Geri Yükle
            </Button>
          )}

          {/* Cancel */}
          {onClose && (
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full text-muted-foreground"
            >
              Şimdilik Atla
            </Button>
          )}

          {/* Legal Terms - Play Store compliant */}
          <div className="space-y-2 text-center">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Abonelik dönem sonunda otomatik olarak yenilenir. 
              İstediğiniz zaman Google Play Store &gt; Abonelikler bölümünden iptal edebilirsiniz. 
              İptal, mevcut dönem sonunda geçerli olur.
            </p>
            <p className="text-[10px] text-muted-foreground">
              Satın alarak{' '}
              <Link to="/terms" className="underline hover:text-foreground">Kullanım Şartları</Link> ve{' '}
              <Link to="/privacy" className="underline hover:text-foreground">Gizlilik Politikası</Link>'nı kabul etmiş olursunuz.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PremiumUpgrade;
