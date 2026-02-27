import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Search, Shield } from 'lucide-react';
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
    <section className="relative pt-6 pb-10 md:py-16 overflow-hidden">
      {/* Multi-layer gradient mesh background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,hsl(142_71%_45%/0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,hsl(var(--secondary)/0.05),transparent_40%)]" />
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)/0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)/0.3) 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
        />
      </div>
      
      <div className="relative container mx-auto px-4">
        <motion.div 
          className="text-center max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Trust Badge — Glassmorphism chip */}
          {stats.accuracy > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 mb-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border/40 shadow-subtle"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <span className="text-xs font-semibold text-emerald-400 tabular-nums">
                %{animatedAccuracy} Başarı
              </span>
              <div className="w-px h-3.5 bg-border/40" />
              <span className="text-xs text-muted-foreground tabular-nums">
                {animatedPredictions.toLocaleString()}+ Analiz
              </span>
            </motion.div>
          )}

          {/* Main Title — Strong hierarchy with gradient */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-3 leading-tight tracking-tight">
            Maç Seç,{' '}
            <span className="gradient-text">
              AI ile Analiz Yap
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground text-sm md:text-base mb-8 max-w-md mx-auto">
            Yapay zeka destekli futbol analizi. 
            <span className="hidden sm:inline"> Form, H2H, istatistikler tek tıkla.</span>
          </p>

          {/* Premium CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                onClick={onAnalyzeClick}
                size="lg"
                className="relative gap-2 text-base px-8 py-6 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_32px_-4px_hsl(var(--primary)/0.5)] transition-shadow group overflow-hidden"
              >
                {/* Shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Search className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Maç Ara & Analiz Et</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Live indicator */}
          {stats.liveCount > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6"
            >
              <Link 
                to="/live"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-destructive/10 border border-destructive/20 hover:bg-destructive/15 transition-colors backdrop-blur-sm"
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
