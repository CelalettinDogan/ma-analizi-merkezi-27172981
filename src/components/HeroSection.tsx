import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Shield, Sparkles, TrendingUp, BarChart3 } from 'lucide-react';
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
    <section className="relative px-4 pt-3 pb-1">
      {/* AI Performance Card */}
      {stats.totalPredictions > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border border-primary/10 p-4"
        >
          <div className="flex items-center justify-between">
            {/* Left: Stats */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Accuracy ring */}
              <div className="relative w-12 h-12 shrink-0">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" opacity="0.2" />
                  <circle
                    cx="24" cy="24" r="20" fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(animatedAccuracy / 100) * 125.6} 125.6`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary tabular-nums">%{animatedAccuracy}</span>
                </div>
              </div>
              
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-foreground">AI Tahmin Doğruluğu</span>
                </div>
                <p className="text-micro text-muted-foreground mt-0.5">
                  {animatedPredictions.toLocaleString()}+ maç analiz edildi
                </p>
              </div>
            </div>

            {/* Right: Live badge or CTA */}
            <div className="flex items-center gap-2 shrink-0">
              {stats.liveCount > 0 && (
                <Link 
                  to="/live"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-destructive/10 border border-destructive/15"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive" />
                  </span>
                  <span className="text-xs font-semibold text-destructive">{stats.liveCount}</span>
                </Link>
              )}
              <motion.div whileTap={{ scale: 0.94 }}>
                <Button
                  onClick={onAnalyzeClick}
                  size="sm"
                  className="gap-1.5 text-xs px-4 h-9 rounded-xl shadow-sm shadow-primary/10"
                >
                  <Search className="w-3.5 h-3.5" />
                  Maç Ara
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium text-foreground/80">AI destekli maç analizi</span>
          </span>
          <motion.div whileTap={{ scale: 0.94 }}>
            <Button
              onClick={onAnalyzeClick}
              size="sm"
              className="gap-1.5 text-xs px-4 h-9 rounded-xl shadow-sm shadow-primary/10"
            >
              <Search className="w-3.5 h-3.5" />
              Maç Ara
            </Button>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
};

export default HeroSection;
