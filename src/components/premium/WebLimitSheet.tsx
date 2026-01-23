import React, { useState, useEffect, useCallback } from 'react';
import { X, Clock, Sparkles, Download, Smartphone } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { getStoreLink, STORE_LINKS } from '@/hooks/usePlatformPremium';

interface WebLimitSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const SPAM_COOLDOWN = 5000; // 5 seconds cooldown
const SPAM_STORAGE_KEY = 'web_limit_sheet_last_shown';

const WebLimitSheet: React.FC<WebLimitSheetProps> = ({ isOpen, onClose }) => {
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
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [isOpen, calculateTimeUntilMidnight]);

  const handleDownloadApp = () => {
    const storeLink = getStoreLink();
    window.open(storeLink, '_blank', 'noopener,noreferrer');
  };

  const handleWait = () => {
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        {/* Close button */}
        <DrawerClose className="absolute right-4 top-4 rounded-full p-2 hover:bg-muted transition-colors z-10">
          <X className="h-5 w-5 text-muted-foreground" />
        </DrawerClose>

        <DrawerHeader className="pt-6 pb-2">
          {/* Icon */}
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
            <Clock className="w-8 h-8 text-blue-500" />
          </div>

          <DrawerTitle className="text-xl font-bold text-center">
            Günlük Ücretsiz Analiz Hakkın Doldu
          </DrawerTitle>
          
          <DrawerDescription className="text-center mt-2">
            Web üzerinden günlük analiz limitine ulaştın. Yeni hakların{' '}
            <span className="font-medium text-foreground">{timeUntilReset}</span>{' '}
            sonra yenilenecek.
          </DrawerDescription>
        </DrawerHeader>

        {/* Premium info card */}
        <div className="px-4 py-3 space-y-3">
          {/* App download promotion */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 rounded-lg bg-emerald-500/20">
                <Smartphone className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Mobil Uygulamamızı İndir
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Premium ile sınırsız analiz, AI asistan ve reklamsız deneyim
                </p>
              </div>
            </div>
          </div>

          {/* Premium features list */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">Premium Avantajları</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Sınırsız maç analizi
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                AI destekli tahmin asistanı
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Gelişmiş istatistikler
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Reklamsız deneyim
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-2 pb-6 px-4 space-y-2">
          {/* Primary CTA - Download App */}
          <Button
            onClick={handleDownloadApp}
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25"
          >
            <Download className="w-5 h-5 mr-2" />
            Uygulamayı İndir
          </Button>

          {/* Store badges */}
          <div className="flex items-center justify-center gap-4 py-2">
            <a
              href={STORE_LINKS.playStore}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                alt="Google Play"
                className="h-10"
              />
            </a>
            <a
              href={STORE_LINKS.appStore}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                alt="App Store"
                className="h-10"
              />
            </a>
          </div>

          {/* Secondary - Wait */}
          <Button
            variant="outline"
            onClick={handleWait}
            className="w-full h-11 rounded-xl"
          >
            <Clock className="w-4 h-4 mr-2" />
            Bekle ({timeUntilReset})
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

// Hook to manage the sheet with anti-spam logic
export const useWebLimitSheet = () => {
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

export default WebLimitSheet;
