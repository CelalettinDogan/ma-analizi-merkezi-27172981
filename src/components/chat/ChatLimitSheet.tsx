import React, { useState, useEffect, useCallback } from 'react';
import { Crown, X, Clock, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
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
import { PLAN_PRICES, PLAN_DISPLAY_NAMES, PlanType } from '@/constants/accessLevels';

interface ChatLimitSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PlanType;
  dailyLimit: number;
}

const upgradeOptions = [
  { 
    plan: 'premium_plus' as PlanType, 
    chatLimit: 5,
    label: 'Premium Plus',
    description: 'Günde 5 AI mesajı'
  },
  { 
    plan: 'premium_pro' as PlanType, 
    chatLimit: 10,
    label: 'Premium Pro',
    description: 'Günde 10 AI mesajı'
  },
];

/**
 * Premium kullanıcının chatbot limiti dolduğunda gösterilecek BottomSheet
 * 
 * - Geri sayım gösterir (gece yarısına kadar)
 * - Paket yükseltme seçenekleri sunar
 * - Yarın tekrar dene seçeneği
 */
const ChatLimitSheet: React.FC<ChatLimitSheetProps> = ({
  isOpen,
  onClose,
  currentPlan,
  dailyLimit,
}) => {
  const navigate = useNavigate();
  const [timeUntilReset, setTimeUntilReset] = useState('');

  // Calculate time until midnight
  const calculateTimeUntilMidnight = useCallback(() => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    
    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours} saat ${minutes} dakika`;
    }
    return `${minutes} dakika`;
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeUntilReset(calculateTimeUntilMidnight());
      
      const interval = setInterval(() => {
        setTimeUntilReset(calculateTimeUntilMidnight());
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [isOpen, calculateTimeUntilMidnight]);

  const handleUpgrade = () => {
    onClose();
    navigate('/profile', { state: { openPremium: true } });
  };

  const handleWait = () => {
    onClose();
    navigate(-1);
  };

  // Filter upgrade options based on current plan
  const availableUpgrades = upgradeOptions.filter(option => {
    if (currentPlan === 'premium_basic') return true;
    if (currentPlan === 'premium_plus') return option.plan === 'premium_pro';
    return false;
  });

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        {/* Close button */}
        <DrawerClose className="absolute right-4 top-4 rounded-full p-2 hover:bg-muted transition-colors">
          <X className="h-5 w-5 text-muted-foreground" />
        </DrawerClose>

        <DrawerHeader className="pt-6 pb-2">
          {/* Icon */}
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>

          <DrawerTitle className="text-xl font-bold text-center">
            Günlük AI Asistan Hakkın Doldu
          </DrawerTitle>
          
          <DrawerDescription className="text-center mt-2">
            Bugün için {dailyLimit} mesaj hakkını kullandın.
            <br />
            <span className="font-medium text-foreground">{timeUntilReset}</span>{' '}
            sonra yenilenecek.
          </DrawerDescription>
        </DrawerHeader>

        {/* Upgrade options */}
        {availableUpgrades.length > 0 && (
          <div className="px-4 py-3">
            <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 p-2 rounded-lg bg-primary/20">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Paketini yükselterek daha fazla AI mesajı al
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Şu an: {PLAN_DISPLAY_NAMES[currentPlan]} ({dailyLimit} mesaj/gün)
                  </p>
                </div>
              </div>
              
              {/* Upgrade benefits */}
              <div className="space-y-2 mt-3">
                {availableUpgrades.map((option) => (
                  <div key={option.plan} className="flex items-center justify-between gap-2 text-sm p-2 rounded-lg bg-background/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-foreground/80">{option.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Legal notice - Play Store compliant */}
        <div className="px-4 py-2">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Abonelik otomatik yenilenir. İstediğiniz zaman Google Play Store 
              &gt; Abonelikler bölümünden iptal edebilirsiniz.
            </p>
          </div>
        </div>

        <div className="pt-2 pb-6 px-4 space-y-3">
          {/* Primary CTA - Upgrade */}
          {availableUpgrades.length > 0 ? (
            <Button
              onClick={handleUpgrade}
              className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold rounded-xl"
            >
              <Crown className="w-5 h-5 mr-2" />
              Paketi Yükselt
            </Button>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-2">
              En yüksek paketi kullanıyorsunuz. Limit yarın yenilenecek.
            </p>
          )}

          {/* Secondary - Wait */}
          <Button
            variant="outline"
            onClick={handleWait}
            className="w-full h-11 rounded-xl"
          >
            <Clock className="w-4 h-4 mr-2" />
            Yarın Tekrar Dene
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ChatLimitSheet;
