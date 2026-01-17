import React from 'react';
import { motion } from 'framer-motion';
import { Swords } from 'lucide-react';
import { HeadToHead } from '@/types/match';
import { cn } from '@/lib/utils';

interface H2HTimelineProps {
  h2h: HeadToHead;
  homeTeam: string;
  awayTeam: string;
}

const H2HTimeline: React.FC<H2HTimelineProps> = ({ h2h, homeTeam, awayTeam }) => {
  // Null safety
  const homeWins = h2h?.homeWins ?? 0;
  const awayWins = h2h?.awayWins ?? 0;
  const draws = h2h?.draws ?? 0;
  const lastMatches = h2h?.lastMatches ?? [];

  const total = homeWins + awayWins + draws;
  const homePercentage = total > 0 ? (homeWins / total) * 100 : 0;
  const drawPercentage = total > 0 ? (draws / total) * 100 : 0;
  const awayPercentage = total > 0 ? (awayWins / total) * 100 : 0;

  const getMatchResult = (match: typeof lastMatches[0]) => {
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

  // Empty state
  if (total === 0 && lastMatches.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-4 rounded-xl bg-card border border-border/50"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Swords className="w-4 h-4 text-secondary" />
            Geçmiş Karşılaşmalar
          </h4>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Swords className="w-8 h-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Geçmiş karşılaşma bulunamadı</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Bu takımlar son 1 yılda karşılaşmamış veya farklı liglerde oynuyorlar
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-2">
            H2H verileri sadece aynı lig içindeki maçları kapsar
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
      className="p-4 rounded-xl bg-card border border-border/50"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Swords className="w-4 h-4 text-secondary" />
          Geçmiş Karşılaşmalar
        </h4>
        <span className="text-xs text-muted-foreground">{total} maç</span>
      </div>

      {/* Win Rate Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-primary font-medium">{homeTeam}</span>
          <span className="text-muted-foreground">Beraberlik</span>
          <span className="text-secondary font-medium">{awayTeam}</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden">
          <div 
            className="bg-primary transition-all"
            style={{ width: `${homePercentage}%` }}
          />
          <div 
            className="bg-muted transition-all"
            style={{ width: `${drawPercentage}%` }}
          />
          <div 
            className="bg-secondary transition-all"
            style={{ width: `${awayPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm font-bold mt-1.5">
          <span className="text-primary">{homeWins}</span>
          <span className="text-muted-foreground">{draws}</span>
          <span className="text-secondary">{awayWins}</span>
        </div>
      </div>

      {/* Timeline - only show if there are matches */}
      {lastMatches.length > 0 && (
        <div className="relative pt-2">
          {/* Timeline Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border/50 -translate-y-1/2" />
          
          {/* Match Bubbles */}
          <div className="relative flex justify-between gap-1">
            {lastMatches.slice(0, 5).map((match, index) => {
              const result = getMatchResult(match);
              
              // Format date nicely: "17 Oca"
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
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className={cn(
                    "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xs md:text-sm font-bold border-2 bg-card z-10 shadow-sm",
                    result === 'home' && "border-primary text-primary",
                    result === 'away' && "border-secondary text-secondary",
                    result === 'draw' && "border-muted-foreground text-muted-foreground"
                  )}>
                    {match.score}
                  </div>
                  <span className="text-[10px] md:text-xs text-muted-foreground mt-1.5 md:mt-2 whitespace-nowrap">
                    {formatDate(match.date)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default H2HTimeline;
