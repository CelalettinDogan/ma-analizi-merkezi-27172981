import React from 'react';
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

const HeroSection: React.FC<HeroSectionProps> = ({ 
  stats = { liveCount: 0, todayPredictions: 0, accuracy: 0, premiumAccuracy: 0 } 
}) => {
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

          {/* Subtitle - Inline Stats */}
          <p className="text-muted-foreground mb-6 flex items-center justify-center gap-2 flex-wrap text-sm md:text-base">
            {stats.accuracy > 0 && (
              <>
                <span className="font-semibold text-primary">%{stats.accuracy}</span>
                <span>Doğruluk</span>
                <span className="text-border">•</span>
              </>
            )}
            <span className="font-semibold text-foreground">{stats.todayPredictions || 0}</span>
            <span>Analiz</span>
            {stats.liveCount > 0 && (
              <>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                  </span>
                  <span className="font-semibold text-foreground">{stats.liveCount}</span>
                  <span>Canlı</span>
                </span>
              </>
            )}
          </p>

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
