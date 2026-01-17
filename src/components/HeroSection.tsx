import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface HeroStats {
  liveCount: number;
  todayPredictions: number;
  accuracy: number;
  premiumAccuracy: number;
}

interface HeroSectionProps {
  stats?: HeroStats;
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
  stats = { liveCount: 0, todayPredictions: 0, accuracy: 0, premiumAccuracy: 0 } 
}) => {
  const animatedAccuracy = useCountUp(stats.accuracy);
  const animatedPredictions = useCountUp(stats.todayPredictions);

  return (
    <section className="relative py-12 md:py-16">
      {/* Simple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
      
      <div className="relative container mx-auto px-4">
        <motion.div 
          className="text-center max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Main Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3">
            Yapay Zeka Destekli{' '}
            <span className="text-primary">Maç Analizi</span>
          </h1>

          {/* Subtitle - Inline Stats with Count-up - Responsive */}
          <div className="text-muted-foreground mb-6 flex items-center justify-center gap-1.5 md:gap-2 flex-wrap text-xs md:text-base">
            {stats.accuracy > 0 && (
              <>
                <span className="font-semibold text-primary tabular-nums">
                  %{animatedAccuracy}
                </span>
                <span className="hidden xs:inline">Doğruluk</span>
                <span className="xs:hidden">Başarı</span>
                <span className="text-border">•</span>
              </>
            )}
            <span className="font-semibold text-foreground tabular-nums">
              {animatedPredictions.toLocaleString()}
            </span>
            <span>Analiz</span>
            {stats.liveCount > 0 && (
              <>
                <span className="text-border">•</span>
                <motion.span 
                  className="flex items-center gap-1"
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-destructive" />
                  </span>
                  <span className="font-semibold text-foreground">{stats.liveCount}</span>
                  <span>Canlı</span>
                </motion.span>
              </>
            )}
          </div>

          {/* Single CTA Button */}
          <Button
            asChild
            size="lg"
            className="gap-2"
          >
            <Link to="#leagues">
              <Zap className="w-4 h-4" />
              Maç Seç ve Analiz Et
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
