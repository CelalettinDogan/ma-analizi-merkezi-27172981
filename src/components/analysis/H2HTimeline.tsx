import React from 'react';
import { motion } from 'framer-motion';
import { Swords, Trophy, Minus, TrendingUp } from 'lucide-react';
import { HeadToHead } from '@/types/match';
import { cn } from '@/lib/utils';

interface H2HTimelineProps {
  h2h: HeadToHead;
  homeTeam: string;
  awayTeam: string;
}

// Donut Chart Component
const DonutChart: React.FC<{
  homeWins: number;
  draws: number;
  awayWins: number;
  homeTeam: string;
  awayTeam: string;
}> = ({ homeWins, draws, awayWins, homeTeam, awayTeam }) => {
  const total = homeWins + draws + awayWins;
  if (total === 0) return null;

  const homePercentage = (homeWins / total) * 100;
  const drawPercentage = (draws / total) * 100;
  const awayPercentage = (awayWins / total) * 100;

  // SVG donut chart calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  const homeLength = (homePercentage / 100) * circumference;
  const drawLength = (drawPercentage / 100) * circumference;
  const awayLength = (awayPercentage / 100) * circumference;

  const homeOffset = 0;
  const drawOffset = -homeLength;
  const awayOffset = -(homeLength + drawLength);

  return (
    <div className="relative flex items-center justify-center">
      <svg width="100" height="100" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="12"
          opacity="0.3"
        />
        
        {/* Home wins arc */}
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="12"
          strokeDasharray={`${homeLength} ${circumference}`}
          strokeDashoffset={homeOffset}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${homeLength} ${circumference}` }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        />
        
        {/* Draws arc */}
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="12"
          strokeDasharray={`${drawLength} ${circumference}`}
          strokeDashoffset={drawOffset}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${drawLength} ${circumference}` }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        />
        
        {/* Away wins arc */}
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth="12"
          strokeDasharray={`${awayLength} ${circumference}`}
          strokeDashoffset={awayOffset}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${awayLength} ${circumference}` }}
          transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className="text-lg font-bold text-foreground"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          {total}
        </motion.span>
        <span className="text-[10px] text-muted-foreground">maç</span>
      </div>
    </div>
  );
};

// Stats Legend Component
const StatsLegend: React.FC<{
  homeWins: number;
  draws: number;
  awayWins: number;
  homeTeam: string;
  awayTeam: string;
}> = ({ homeWins, draws, awayWins, homeTeam, awayTeam }) => {
  const total = homeWins + draws + awayWins;
  
  const stats = [
    { 
      label: homeTeam, 
      value: homeWins, 
      percentage: total > 0 ? Math.round((homeWins / total) * 100) : 0,
      color: 'bg-primary',
      textColor: 'text-primary',
      icon: Trophy
    },
    { 
      label: 'Beraberlik', 
      value: draws, 
      percentage: total > 0 ? Math.round((draws / total) * 100) : 0,
      color: 'bg-muted-foreground',
      textColor: 'text-muted-foreground',
      icon: Minus
    },
    { 
      label: awayTeam, 
      value: awayWins, 
      percentage: total > 0 ? Math.round((awayWins / total) * 100) : 0,
      color: 'bg-secondary',
      textColor: 'text-secondary',
      icon: Trophy
    },
  ];

  return (
    <div className="flex flex-col gap-2 flex-1">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 + index * 0.1 }}
          className="flex items-center gap-2"
        >
          <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", stat.color)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                {stat.label}
              </span>
              <div className="flex items-center gap-1.5">
                <span className={cn("text-sm font-bold", stat.textColor)}>
                  {stat.value}
                </span>
                <span className="text-[10px] text-muted-foreground/70">
                  ({stat.percentage}%)
                </span>
              </div>
            </div>
            {/* Mini progress bar */}
            <div className="h-1 bg-muted/50 rounded-full mt-1 overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", stat.color)}
                initial={{ width: 0 }}
                animate={{ width: `${stat.percentage}%` }}
                transition={{ duration: 0.8, delay: 0.5 + index * 0.1, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Match Result Bubble
const MatchBubble: React.FC<{
  match: { date: string; homeTeam: string; awayTeam: string; score: string };
  result: 'home' | 'away' | 'draw';
  index: number;
  homeTeam: string;
}> = ({ match, result, index, homeTeam }) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const [year, month, day] = dateStr.split('-');
      const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      return `${parseInt(day)} ${months[parseInt(month) - 1]}`;
    } catch {
      return '-';
    }
  };

  // Determine if this team was home or away in this match
  const wasHome = match.homeTeam === homeTeam;
  const resultLabel = result === 'home' ? 'G' : result === 'away' ? 'M' : 'B';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        delay: 0.6 + index * 0.1,
        type: "spring",
        stiffness: 200,
        damping: 15
      }}
      className="flex flex-col items-center group"
    >
      {/* Result indicator */}
      <motion.div
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 transition-transform group-hover:scale-110",
          result === 'home' && "bg-emerald-500/20 text-emerald-500",
          result === 'away' && "bg-rose-500/20 text-rose-500",
          result === 'draw' && "bg-amber-500/20 text-amber-500"
        )}
      >
        {resultLabel}
      </motion.div>
      
      {/* Score bubble */}
      <div className={cn(
        "w-10 h-10 xs:w-12 xs:h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-[10px] xs:text-xs md:text-sm font-bold border-2 bg-card/80 backdrop-blur-sm z-10 shadow-lg transition-all group-hover:scale-105 group-hover:shadow-xl",
        result === 'home' && "border-emerald-500/50 text-emerald-500",
        result === 'away' && "border-rose-500/50 text-rose-500",
        result === 'draw' && "border-amber-500/50 text-amber-500"
      )}>
        {match.score}
      </div>
      
      {/* Date */}
      <span className="text-[9px] xs:text-[10px] text-muted-foreground mt-1 xs:mt-1.5 whitespace-nowrap">
        {formatDate(match.date)}
      </span>
      
      {/* Home/Away indicator - hidden on xs */}
      <span className={cn(
        "text-[9px] mt-0.5 px-1.5 py-0.5 rounded-full hidden xs:block",
        wasHome ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
      )}>
        {wasHome ? 'Ev' : 'Dep'}
      </span>
    </motion.div>
  );
};

const H2HTimeline: React.FC<H2HTimelineProps> = ({ h2h, homeTeam, awayTeam }) => {
  // Null safety
  const homeWins = h2h?.homeWins ?? 0;
  const awayWins = h2h?.awayWins ?? 0;
  const draws = h2h?.draws ?? 0;
  const lastMatches = h2h?.lastMatches ?? [];

  const total = homeWins + awayWins + draws;

  const getMatchResult = (match: typeof lastMatches[0]): 'home' | 'away' | 'draw' => {
    if (!match?.score) return 'draw';
    const parts = match.score.split('-');
    if (parts.length !== 2) return 'draw';
    const [homeGoals, awayGoals] = parts.map(Number);
    if (isNaN(homeGoals) || isNaN(awayGoals)) return 'draw';
    
    if (match.homeTeam === homeTeam) {
      if (homeGoals > awayGoals) return 'home';
      if (homeGoals < awayGoals) return 'away';
    } else {
      if (homeGoals > awayGoals) return 'away';
      if (homeGoals < awayGoals) return 'home';
    }
    return 'draw';
  };

  // Calculate streak
  const getStreak = () => {
    if (lastMatches.length === 0) return null;
    
    let streak = 0;
    let streakType: 'home' | 'away' | 'draw' | null = null;
    
    for (const match of lastMatches) {
      const result = getMatchResult(match);
      if (streakType === null) {
        streakType = result;
        streak = 1;
      } else if (result === streakType) {
        streak++;
      } else {
        break;
      }
    }
    
    if (streak >= 2 && streakType) {
      return { count: streak, type: streakType };
    }
    return null;
  };

  const streak = getStreak();

  // Empty state
  if (total === 0 && lastMatches.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Swords className="w-4 h-4 text-secondary" />
            Geçmiş Karşılaşmalar
          </h4>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-3">
            <Swords className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Geçmiş karşılaşma bulunamadı</p>
          <p className="text-xs text-muted-foreground/70 mt-1 max-w-[200px]">
            Bu takımlar son dönemde karşılaşmamış
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Swords className="w-4 h-4 text-secondary" />
          Geçmiş Karşılaşmalar
        </h4>
        {streak && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium",
              streak.type === 'home' && "bg-emerald-500/10 text-emerald-500",
              streak.type === 'away' && "bg-rose-500/10 text-rose-500",
              streak.type === 'draw' && "bg-amber-500/10 text-amber-500"
            )}
          >
            <TrendingUp className="w-3 h-3" />
            {streak.count} {streak.type === 'home' ? 'galibiyet' : streak.type === 'away' ? 'mağlubiyet' : 'beraberlik'} serisi
          </motion.div>
        )}
      </div>

      {/* Donut Chart + Stats */}
      <div className="flex items-center gap-4 mb-5">
        <DonutChart
          homeWins={homeWins}
          draws={draws}
          awayWins={awayWins}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />
        <StatsLegend
          homeWins={homeWins}
          draws={draws}
          awayWins={awayWins}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />
      </div>

      {/* Match Timeline */}
      {lastMatches.length > 0 && (
        <div className="relative pt-3">
          {/* Section title */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-border/50" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Son {Math.min(lastMatches.length, 5)} Maç</span>
            <div className="h-px flex-1 bg-border/50" />
          </div>
          
          {/* Timeline Line */}
          <div className="absolute top-[calc(50%+10px)] left-4 right-4 h-0.5 bg-gradient-to-r from-primary/30 via-muted to-secondary/30" />
          
          {/* Match Bubbles */}
          <div className="relative flex justify-between gap-0.5 xs:gap-1 px-0 xs:px-1 overflow-x-auto pb-1 scrollbar-none">
            {lastMatches.slice(0, 5).map((match, index) => (
              <MatchBubble
                key={index}
                match={match}
                result={getMatchResult(match)}
                index={index}
                homeTeam={homeTeam}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default H2HTimeline;
