import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Trophy, Target, ArrowRight, TrendingUp, Flame, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { Link } from 'react-router-dom';

interface HeroStats {
  liveCount: number;
  todayPredictions: number;
  accuracy: number;
  premiumAccuracy: number;
  totalMatches: number;
  hottestMatch: {
    home: string;
    away: string;
  } | null;
}

const HeroSection: React.FC = () => {
  const [stats, setStats] = useState<HeroStats>({
    liveCount: 0,
    todayPredictions: 0,
    accuracy: 0,
    premiumAccuracy: 0,
    totalMatches: 0,
    hottestMatch: null
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch all stats in parallel
        const [todayCountResult, overallStatsResult, premiumStatsResult, liveResult] = await Promise.all([
          supabase
            .from('predictions')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today),
          supabase
            .from('overall_stats')
            .select('accuracy_percentage')
            .single(),
          supabase
            .from('ml_model_stats')
            .select('premium_accuracy')
            .limit(1)
            .maybeSingle(),
          supabase.functions.invoke('football-api', {
            body: { action: 'live' },
          }),
        ]);

        setStats({
          todayPredictions: todayCountResult.count || 0,
          accuracy: Math.round(overallStatsResult.data?.accuracy_percentage || 0),
          premiumAccuracy: Math.round(premiumStatsResult.data?.premium_accuracy || 0),
          liveCount: liveResult.data?.matches?.length || 0,
          totalMatches: 0,
          hottestMatch: null, // Would need separate logic to determine "hottest" match
        });
      } catch (e) {
        console.error('Error fetching hero stats:', e);
      }
    };
    fetchStats();
  }, []);

  return (
    <section className="relative py-10 md:py-16 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 hero-gradient" />
      
      {/* Floating Orbs - Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-secondary/10 blur-3xl"
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 right-1/3 w-40 h-40 rounded-full bg-primary/5 blur-2xl"
          animate={{
            x: [0, 15, 0],
            y: [0, 15, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      
      <div className="relative container mx-auto px-4">
        <motion.div 
          className="text-center max-w-3xl mx-auto"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Enhanced Badge */}
          <motion.div 
            variants={staggerItem}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6"
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2.5 h-2.5 rounded-full bg-primary shadow-lg shadow-primary/50"
            />
            <span className="text-sm font-medium text-primary">AI Destekli Tahmin Motoru</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1 
            variants={staggerItem}
            className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4"
          >
            Akıllı Maç{' '}
            <span className="gradient-text">Tahminleri</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            variants={staggerItem}
            className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8"
          >
            Yapay zeka destekli analizler, istatistiksel modeller ve geçmiş verilerle
            futbol maçlarını daha iyi anlayın
          </motion.p>

          {/* Floating Stats Cards - Bento Style */}
          <motion.div 
            variants={staggerItem}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
          >
            {/* Live Matches Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="glass-card-hover p-4 text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Canlı</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-foreground">{stats.liveCount}</div>
              <div className="text-xs text-muted-foreground">maç devam ediyor</div>
            </motion.div>

            {/* Today's Analysis Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="glass-card-hover p-4 text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bugün</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-foreground">{stats.todayPredictions}</div>
              <div className="text-xs text-muted-foreground">analiz yapıldı</div>
            </motion.div>

            {/* Accuracy Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="glass-card-hover p-4 text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Doğruluk</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold gradient-text">
                {stats.accuracy > 0 ? `%${stats.accuracy}` : '—'}
              </div>
              <div className="text-xs text-muted-foreground">genel başarı</div>
            </motion.div>

            {/* Premium Accuracy Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="glass-card-hover p-4 text-left border-primary/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-3.5 h-3.5 text-secondary" />
                <span className="text-xs font-medium text-secondary uppercase tracking-wider">Premium</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold gradient-text-gold">
                {stats.premiumAccuracy > 0 ? `%${stats.premiumAccuracy}` : '—'}
              </div>
              <div className="text-xs text-muted-foreground">yüksek güvenli</div>
            </motion.div>
          </motion.div>

          {/* Quick Action Pills */}
          <motion.div 
            variants={staggerItem}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Button
              asChild
              size="lg"
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
            >
              <Link to="/live">
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
                </span>
                Canlı Maçlar
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/5"
            >
              <Link to="/dashboard">
                <Trophy className="w-4 h-4" />
                Dashboard
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              asChild
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Link to="/standings">
                <TrendingUp className="w-4 h-4" />
                Lig Sıralamaları
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
