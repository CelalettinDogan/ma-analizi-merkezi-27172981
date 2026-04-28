import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, X, Clock, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useStoreProducts } from '@/hooks/useStoreProducts';

interface AnalysisLimitSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const SPAM_COOLDOWN = 5000;
const SPAM_STORAGE_KEY = 'analysis_limit_sheet_last_shown';

const AnalysisLimitSheet: React.FC<AnalysisLimitSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation('premium');
  const navigate = useNavigate();
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const { cheapestMonthlyPrice } = useStoreProducts();

  const calculateTimeUntilMidnight = useCallback(() => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return t('limit.hours', { hours, minutes });
    }
    return t('limit.minutes', { minutes });
  }, [t]);

  useEffect(() => {
    if (isOpen) {
      setTimeUntilReset(calculateTimeUntilMidnight());

      const interval = setInterval(() => {
        setTimeUntilReset(calculateTimeUntilMidnight());
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [isOpen, calculateTimeUntilMidnight]);

  const handleUpgrade = () => {
    onClose();
    navigate('/premium');
  };

  const handleWait = () => {
    onClose();
  };

  const premiumBenefits = [
    t('features.unlimitedAnalysis'),
    t('features.aiChat'),
    t('features.noAds'),
    t('active.allAnalyses'),
  ];

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerClose className="absolute right-4 top-4 rounded-full p-2 hover:bg-muted transition-colors">
          <X className="h-5 w-5 text-muted-foreground" />
        </DrawerClose>

        <DrawerHeader className="pt-6 pb-2">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>

          <DrawerTitle className="text-xl font-bold text-center">
            {t('limit.sheetTitle')}
          </DrawerTitle>

          <DrawerDescription className="text-center mt-2">
            {t('limit.sheetDescription', { time: timeUntilReset })}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-3">
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 p-2 rounded-lg bg-amber-500/20">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t('limit.premiumPrompt')}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('plans.fromPrice', { price: cheapestMonthlyPrice })}
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-3">
              {premiumBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-foreground/80">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-2">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-micro text-muted-foreground leading-relaxed">
              {t('billing.autoRenewShort')}
            </p>
          </div>
        </div>

        <div className="pt-2 pb-6 px-4 space-y-3">
          <Button
            onClick={handleUpgrade}
            className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25"
          >
            <Crown className="w-5 h-5 mr-2" />
            {t('limit.viewPlans')}
          </Button>

          <Button
            variant="outline"
            onClick={handleWait}
            className="w-full h-11 rounded-xl"
          >
            <Clock className="w-4 h-4 mr-2" />
            {t('limit.tryTomorrow', { time: timeUntilReset })}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export const useAnalysisLimitSheet = () => {
  const [isOpen, setIsOpen] = useState(false);

  const canShow = useCallback((): boolean => {
    try {
      const lastShown = localStorage.getItem(SPAM_STORAGE_KEY);
      if (!lastShown) return true;

      const lastShownTime = parseInt(lastShown, 10);
      return Date.now() - lastShownTime > SPAM_COOLDOWN;
    } catch {
      return true;
    }
  }, []);

  const show = useCallback(() => {
    if (canShow()) {
      setIsOpen(true);
      try {
        localStorage.setItem(SPAM_STORAGE_KEY, Date.now().toString());
      } catch {
        // Ignore storage errors
      }
    }
  }, [canShow]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    show,
    close,
    canShow,
  };
};

export default AnalysisLimitSheet;
