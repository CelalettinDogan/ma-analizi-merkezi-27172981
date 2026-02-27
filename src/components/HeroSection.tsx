import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Search, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroStats {
  liveCount: number;
  totalPredictions: number;
  accuracy: number;
  premiumAccuracy: number;
}

interface HeroSectionProps {
  stats?: HeroStats;
  onAnalyzeClick?: () => void;
}

// Count-up animation hook
const useCountUp = (target: number, duration: number = 1500) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration]);

  return count;
};

const HeroSection: React.FC<HeroSectionProps> = ({ 
  stats = { liveCount: 0, totalPredictions: 0, accuracy: 0, premiumAccuracy: 0 },
  onAnalyzeClick
}) => {
  const animatedAccuracy = useCountUp(stats.accuracy);
  const animatedPredictions = useCountUp(stats.totalPredictions);

  return (
    <section className="relative pt-6 pb-10 md:py-16 overflow-hidden">
      {/* Gradient background with subtle animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-emerald-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      <div className="relative container mx-auto px-4">
        <motion.div 
          className="text-center max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Trust Badge - Small and subtle */}
          {stats.accuracy > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/20"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-400">
                %{animatedAccuracy} Başarı Oranı
              </span>
              <span className="text-emerald-500/50">•</span>
              <span className="text-xs text-muted-foreground">
                {animatedPredictions.toLocaleString()}+ Analiz
              </span>
            </motion.div>
          )}

          {/* Main Title - Clear Value Proposition */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 leading-tight">
            Maç Seç,{' '}
            <span className="text-primary relative">
              AI ile Analiz Yap
              <motion.span 
                className="absolute -right-5 -top-1 text-xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⚽
              </motion.span>
            </span>
          </h1>

          {/* Subtitle - Simple and Direct */}
          <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-md mx-auto">
            Yapay zeka destekli futbol analizi. 
            <span className="hidden sm:inline"> Form, H2H, istatistikler tek tıkla.</span>
          </p>

          {/* Primary CTA - Large and Prominent */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-3"
          >
            <Button
              onClick={onAnalyzeClick}
              size="lg"
              className="gap-2 text-base px-8 py-6 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all group"
            >
              <Search className="w-5 h-5" />
              Maç Ara & Analiz Et
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            
          </motion.div>

          {/* Live indicator - Only if live matches exist */}
          {stats.liveCount > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6"
            >
              <Link 
                to="/live"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 hover:bg-destructive/15 transition-colors"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                </span>
                <span className="text-sm font-medium text-destructive">
                  {stats.liveCount} Canlı Maç
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-destructive" />
              </Link>
            </motion.div>
          )}
        </motion.div>

      </div>
    </section>
  );
};

export default HeroSection;
