import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Brain, Globe, Zap, Ban, History, Check, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlatform } from '@/hooks/usePlatform';
import { purchaseService, PRODUCTS } from '@/services/purchaseService';
import { toast } from 'sonner';

interface PremiumUpgradeProps {
  onClose?: () => void;
}

const features = [
  { icon: Brain, label: 'Derin Analiz', description: 'xG, momentum, taktik analizi ve 15+ istatistiksel metrik' },
  { icon: Globe, label: 'Daha Fazla Lig', description: 'Tüm büyük Avrupa ligleri + 2. lig verileri' },
  { icon: Zap, label: 'Öncelikli AI Yanıtları', description: 'Daha hızlı ve detaylı AI analiz cevapları' },
  { icon: Ban, label: 'Reklamsız Deneyim', description: 'Kesintisiz, temiz arayüz' },
  { icon: History, label: 'Analiz Geçmişi', description: 'Tüm geçmiş analizlerinize erişim' },
];

const plans = [
  {
    id: PRODUCTS.PREMIUM_MONTHLY,
    name: 'Aylık',
    price: '₺99',
    period: '/ay',
    popular: false,
  },
  {
    id: PRODUCTS.PREMIUM_YEARLY,
    name: 'Yıllık',
    price: '₺799',
    period: '/yıl',
    popular: true,
    savings: '2 ay bedava',
  },
];

export const PremiumUpgrade: React.FC<PremiumUpgradeProps> = ({ onClose }) => {
  const { platform, isNative, isAndroid } = usePlatform();
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<string>(PRODUCTS.PREMIUM_YEARLY);

  const handlePurchase = async () => {
    setIsLoading(true);

    try {
      if (isNative) {
        const result = await purchaseService.purchaseSubscription(selectedPlan);
        
        if (result.success) {
          toast.success('Premium üyelik aktif edildi!');
          onClose?.();
        } else {
          toast.error(result.error || 'Satın alma başarısız');
        }
      } else {
        toast.info('Web üzerinden ödeme için kart bilgilerinizi gireceksiniz.');
        toast.warning('Web ödeme entegrasyonu henüz aktif değil. Play Store\'dan satın alabilirsiniz.');
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
      className="w-full max-w-md mx-auto"
    >
      <Card className="border-primary/20 bg-gradient-to-b from-background to-primary/5">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Premium'a Yükselt</CardTitle>
          <p className="text-muted-foreground text-sm mt-2">
            Tüm özelliklerin kilidini aç ve en iyi analiz deneyimini yaşa
          </p>
          
          {/* Platform indicator */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {isAndroid ? (
              <Badge variant="secondary" className="gap-1">
                <Smartphone className="h-3 w-3" />
                Google Play
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <Globe className="h-3 w-3" />
                Web
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Features */}
          <div className="grid gap-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div className="p-2 rounded-full bg-primary/10">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{feature.label}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Plan Selection */}
          <div className="grid grid-cols-2 gap-3">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  selectedPlan === plan.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs">
                    Popüler
                  </Badge>
                )}
                <p className="font-medium">{plan.name}</p>
                <p className="text-2xl font-bold text-primary">
                  {plan.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    {plan.period}
                  </span>
                </p>
                {plan.savings && (
                  <p className="text-xs text-green-500 mt-1">{plan.savings}</p>
                )}
                {selectedPlan === plan.id && (
                  <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
                )}
              </button>
            ))}
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
                {isNative ? 'Satın Al' : 'Ödemeye Geç'}
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

          {/* Terms */}
          <p className="text-[10px] text-center text-muted-foreground">
            Satın alarak{' '}
            <a href="/terms" className="underline">Kullanım Şartları</a> ve{' '}
            <a href="/privacy" className="underline">Gizlilik Politikası</a>'nı kabul etmiş olursunuz.
            {isAndroid && ' Abonelik Google Play hesabınız üzerinden yönetilir.'}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PremiumUpgrade;
