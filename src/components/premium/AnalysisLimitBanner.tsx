import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Clock, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PLAN_PRICES } from '@/constants/accessLevels';

interface AnalysisLimitBannerProps {
  isVisible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const AnalysisLimitBanner = ({ isVisible, onClose, onUpgrade }: AnalysisLimitBannerProps) => {
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const calculateTimeUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      
      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    setTimeUntilReset(calculateTimeUntilMidnight());
    
    const interval = setInterval(() => {
      setTimeUntilReset(calculateTimeUntilMidnight());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleUpgrade = () => {
    onUpgrade();
    navigate('/profile', { state: { openPremium: true } });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-16 left-0 right-0 z-40 px-4 py-2 md:px-6"
        >
          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 backdrop-blur-lg shadow-lg">
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/10 to-amber-500/5 animate-pulse" />
              
              <div className="relative flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-amber-500/20">
                    <Crown className="w-5 h-5 text-amber-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      Günlük analiz hakkınız doldu
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Yenilenmesine: {timeUntilReset}</span>
                      <span className="hidden sm:inline">• Premium: ₺{PLAN_PRICES.pro.monthly}/ay</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={handleUpgrade}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Premium</span>
                  </Button>
                  
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnalysisLimitBanner;
