import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, ChevronRight, TrendingUp, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Match, CompetitionCode } from '@/types/footballApi';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface FeaturedMatchCardProps {
  matches: Match[];
  onMatchSelect: (match: Match) => void;
}

const LEAGUE_COLORS: Record<CompetitionCode, string> = {
  PL: 'from-purple-600 to-purple-900',
  BL1: 'from-red-600 to-red-900',
  PD: 'from-orange-600 to-orange-900',
  SA: 'from-blue-600 to-blue-900',
  FL1: 'from-sky-600 to-sky-900',
  CL: 'from-indigo-600 to-indigo-900',
};

const BIG_TEAMS = ['Arsenal', 'Liverpool', 'Barcelona', 'Real Madrid', 'Bayern', 'PSG', 'Manchester City', 'Manchester United', 'Chelsea', 'Juventus', 'Inter', 'AC Milan', 'Dortmund', 'Atletico'];

const FeaturedMatchCard: React.FC<FeaturedMatchCardProps> = ({ matches, onMatchSelect }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Find "big" matches
  const bigMatches = matches.filter(match => {
    const home = match.homeTeam.name.toLowerCase();
    const away = match.awayTeam.name.toLowerCase();
    return BIG_TEAMS.some(team => 
      home.includes(team.toLowerCase()) || away.includes(team.toLowerCase())
    );
  }).slice(0, 3);

  const featuredMatches = bigMatches.length > 0 ? bigMatches : matches.slice(0, 3);
  const featuredMatch = featuredMatches[currentIndex] || null;

  // Auto-rotate featured matches every 10 seconds
  useEffect(() => {
    if (featuredMatches.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featuredMatches.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [featuredMatches.length]);

  if (!featuredMatch) {
    return (
      <Card className="p-6 glass-card">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-secondary" />
          <span className="font-display font-bold">Önerilen Maç</span>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">Bugün önerilen maç yok</p>
        </div>
      </Card>
    );
  }

  const matchTime = format(new Date(featuredMatch.utcDate), 'HH:mm');
  const matchDate = format(new Date(featuredMatch.utcDate), 'd MMM', { locale: tr });
  const leagueCode = featuredMatch.competition.code as CompetitionCode;
  const gradientClass = LEAGUE_COLORS[leagueCode] || 'from-primary to-emerald-600';

  return (
    <Card className="relative overflow-hidden glass-card group">
      {/* Background Gradient */}
      <div className={cn(
        "absolute inset-0 opacity-20 bg-gradient-to-br",
        gradientClass
      )} />
      
      {/* Animated Glow */}
      <motion.div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/20 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary/20 border border-secondary/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm">Önerilen Maç</h3>
              <p className="text-xs text-muted-foreground">{featuredMatch.competition.name}</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-background/50">
            <Clock className="w-3 h-3 mr-1" />
            {matchTime} • {matchDate}
          </Badge>
        </div>

        {/* Match Info */}
        <AnimatePresence mode="wait">
          <motion.div
            key={featuredMatch.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between gap-4 mb-6"
          >
            {/* Home Team */}
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-background/50 border border-border/30 flex items-center justify-center overflow-hidden">
                {featuredMatch.homeTeam.crest ? (
                  <img 
                    src={featuredMatch.homeTeam.crest} 
                    alt={featuredMatch.homeTeam.name}
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <span className="text-2xl font-bold text-muted-foreground">
                    {featuredMatch.homeTeam.shortName?.[0] || featuredMatch.homeTeam.name[0]}
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-sm truncate">
                {featuredMatch.homeTeam.shortName || featuredMatch.homeTeam.name}
              </h4>
              <p className="text-xs text-muted-foreground">Ev Sahibi</p>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-2">
                <span className="text-xs font-bold text-primary">VS</span>
              </div>
            </div>

            {/* Away Team */}
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-background/50 border border-border/30 flex items-center justify-center overflow-hidden">
                {featuredMatch.awayTeam.crest ? (
                  <img 
                    src={featuredMatch.awayTeam.crest} 
                    alt={featuredMatch.awayTeam.name}
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <span className="text-2xl font-bold text-muted-foreground">
                    {featuredMatch.awayTeam.shortName?.[0] || featuredMatch.awayTeam.name[0]}
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-sm truncate">
                {featuredMatch.awayTeam.shortName || featuredMatch.awayTeam.name}
              </h4>
              <p className="text-xs text-muted-foreground">Deplasman</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Quick Stats Preview */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/30 border border-border/30">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">AI Analizi Hazır</span>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          onClick={() => onMatchSelect(featuredMatch)}
          className="w-full gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 group"
        >
          <Zap className="w-4 h-4" />
          Detaylı Analiz
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>

        {/* Rotation Indicators */}
        {featuredMatches.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {featuredMatches.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  idx === currentIndex 
                    ? "bg-primary w-4" 
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default FeaturedMatchCard;
