import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Trophy, Target, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { Link } from 'react-router-dom';

interface HeroStats {
  liveCount: number;
  todayPredictions: number;
  accuracy: number;
}

const HeroSection: React.FC = () => {
  const [stats, setStats] = useState<HeroStats>({
    liveCount: 0,
    todayPredictions: 0,
    accuracy: 78
  });

  useEffect(() => {
    // Fetch real stats
    const fetchStats = async () => {
      try {
        const { data } = await supabase.from('predictions').select('*', { count: 'exact', head: true });
        // For now use placeholder data - will be populated with real data
        setStats(prev => ({ ...prev, todayPredictions: 12 }));
      } catch (e) {
        console.error('Error fetching hero stats:', e);
      }
    };
    fetchStats();
  }, []);

  return (
    <section className="relative py-8 md:py-12 overflow-hidden">
      {/* Background Effects - More subtle */}
      <div className="absolute inset-0 hero-gradient opacity-80" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="relative container mx-auto px-4">
        <motion.div 
          className="text-center max-w-2xl mx-auto"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Compact Badge */}
          <motion.div 
            variants={staggerItem}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-primary"
            />
            <span className="text-xs font-medium text-primary">AI Destekli Analiz</span>
          </motion.div>

          {/* Compact Title */}
          <motion.h1 
            variants={staggerItem}
            className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3"
          >
            Akıllı Maç{' '}
            <span className="gradient-text">Tahminleri</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            variants={staggerItem}
            className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto mb-6"
          >
            Veri odaklı analizler ve AI destekli tahminlerle futbolu daha iyi anlayın
          </motion.p>

          {/* Live Stats Bar */}
          <motion.div 
            variants={staggerItem}
            className="flex items-center justify-center gap-4 md:gap-8 mb-6"
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-xs font-medium text-red-400">
                {stats.liveCount} Canlı
              </span>
            </div>
            
            <div className="text-center">
              <div className="text-lg md:text-xl font-bold text-foreground">{stats.todayPredictions}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Bugün Analiz</div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <Target className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">
                %{stats.accuracy} Doğruluk
              </span>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            variants={staggerItem}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Button
              asChild
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            >
              <Link to="/live">
                <Zap className="w-4 h-4" />
                Canlı Maçlar
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="gap-2"
            >
              <Link to="/dashboard">
                <Trophy className="w-4 h-4" />
                Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
