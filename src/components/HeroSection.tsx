import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Search, Shield, Sparkles } from 'lucide-react';
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

const useCountUp = (target: number, duration: number = 1500) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
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
    <section className="relative pt-2 pb-2 overflow-hidden">
      <div className="relative container mx-auto px-4">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Trust badge + title compact */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {stats.accuracy >= 65 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/12 text-xs border border-primary/20">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span className="font-semibold text-primary">%{animatedAccuracy}</span>
                  <span className="text-muted-foreground font-medium">· {animatedPredictions.toLocaleString()}+ analiz</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium text-foreground/80">AI destekli maç analizi</span>
                </span>
              )}
              {stats.liveCount > 0 && (
                <Link 
                  to="/live"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-xs"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive" />
                  </span>
                  <span className="font-medium text-destructive">{stats.liveCount} Canlı</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right: CTA button */}
          <motion.div whileTap={{ scale: 0.96 }}>
            <Button
              onClick={onAnalyzeClick}
              size="sm"
              className="gap-1.5 text-xs px-4 h-9 shadow-sm shadow-primary/10"
            >
              <Search className="w-3.5 h-3.5" />
              Maç Ara
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
