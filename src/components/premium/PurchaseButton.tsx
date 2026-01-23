import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlatform } from '@/hooks/usePlatform';
import { purchaseService } from '@/services/purchaseService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PurchaseButtonProps {
  productId: string;
  price: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const PurchaseButton: React.FC<PurchaseButtonProps> = ({
  productId,
  price,
  variant = 'default',
  size = 'default',
  className,
  onSuccess,
  onError,
}) => {
  const { isNative, isAndroid, isIOS } = usePlatform();
  const [isLoading, setIsLoading] = React.useState(false);

  const handlePurchase = async () => {
    setIsLoading(true);

    try {
      if (isNative) {
        const result = await purchaseService.purchaseSubscription(productId);

        if (result.success) {
          toast.success('Premium üyelik aktif!');
          onSuccess?.();
        } else {
          const error = result.error || 'Satın alma başarısız';
          toast.error(error);
          onError?.(error);
        }
      } else {
        // Web flow - show info or redirect
        toast.info('Web ödeme sayfasına yönlendiriliyorsunuz...');
        // Implement Stripe integration here
        onError?.('Web ödeme henüz aktif değil');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bir hata oluştu';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return null;
    
    if (isAndroid) return `Google Play - ${price}`;
    if (isIOS) return `App Store - ${price}`;
    return `${price} - Satın Al`;
  };

  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Button
        onClick={handlePurchase}
        disabled={isLoading}
        variant={variant}
        size={size}
        className={cn('gap-2', className)}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            İşleniyor...
          </>
        ) : (
          <>
            <Crown className="h-4 w-4" />
            {getButtonText()}
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default PurchaseButton;
