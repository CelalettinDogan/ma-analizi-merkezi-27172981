import React from 'react';
import { motion } from 'framer-motion';
import { Swords } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface H2HMatch {
  date: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
}

interface H2HSummaryBadgeProps {
  homeTeam: string;
  awayTeam: string;
  lastMatches: H2HMatch[];
  homeWins: number;
  awayWins: number;
  draws: number;
  className?: string;
  compact?: boolean;
}

const H2HSummaryBadge: React.FC<H2HSummaryBadgeProps> = ({
  homeTeam,
  awayTeam,
  lastMatches,
  homeWins,
  awayWins,
  draws,
  className,
  compact = false
}) => {
  const getMatchResult = (match: H2HMatch): 'home' | 'away' | 'draw' => {
    if (!match?.score) return 'draw';
    const parts = match.score.split('-');
    if (parts.length !== 2) return 'draw';
    const [hGoals, aGoals] = parts.map(Number);
    if (isNaN(hGoals) || isNaN(aGoals)) return 'draw';
    
    if (match.homeTeam === homeTeam) {
      if (hGoals > aGoals) return 'home';
      if (hGoals < aGoals) return 'away';
    } else {
      if (hGoals > aGoals) return 'away';
      if (hGoals < aGoals) return 'home';
    }
    return 'draw';
  };

  const total = homeWins + awayWins + draws;
  const recentMatches = lastMatches.slice(0, 5);

  if (total === 0 || recentMatches.length === 0) {
    return null;
  }

  // Compact version - just dots
  if (compact) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-0.5", className)}>
              {recentMatches.map((match, i) => {
                const result = getMatchResult(match);
                return (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      result === 'home' && "bg-emerald-500",
                      result === 'away' && "bg-rose-500",
                      result === 'draw' && "bg-amber-500"
                    )}
                  />
                );
              })}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="p-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <Swords className="w-3 h-3" />
                <span>Son {recentMatches.length} H2H</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-emerald-500">{homeWins}G</span>
                <span className="text-amber-500">{draws}B</span>
                <span className="text-rose-500">{awayWins}M</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full version - dots with stats
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 border border-border/50",
            className
          )}>
            <Swords className="w-3 h-3 text-muted-foreground" />
            <div className="flex items-center gap-0.5">
              {recentMatches.map((match, i) => {
                const result = getMatchResult(match);
                return (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "w-2 h-2 rounded-full",
                      result === 'home' && "bg-emerald-500",
                      result === 'away' && "bg-rose-500",
                      result === 'draw' && "bg-amber-500"
                    )}
                  />
                );
              })}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="p-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold border-b border-border/50 pb-2">
              <Swords className="w-3.5 h-3.5 text-primary" />
              <span>Geçmiş Karşılaşmalar ({total})</span>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-sm font-bold text-emerald-500">{homeWins}</div>
                <div className="text-[10px] text-muted-foreground truncate max-w-[60px]">{homeTeam}</div>
              </div>
              <div>
                <div className="text-sm font-bold text-amber-500">{draws}</div>
                <div className="text-[10px] text-muted-foreground">Beraberlik</div>
              </div>
              <div>
                <div className="text-sm font-bold text-rose-500">{awayWins}</div>
                <div className="text-[10px] text-muted-foreground truncate max-w-[60px]">{awayTeam}</div>
              </div>
            </div>

            {/* Recent scores */}
            <div className="flex items-center gap-1 justify-center pt-1 border-t border-border/50">
              {recentMatches.slice(0, 3).map((match, i) => {
                const result = getMatchResult(match);
                return (
                  <div
                    key={i}
                    className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded",
                      result === 'home' && "bg-emerald-500/10 text-emerald-500",
                      result === 'away' && "bg-rose-500/10 text-rose-500",
                      result === 'draw' && "bg-amber-500/10 text-amber-500"
                    )}
                  >
                    {match.score}
                  </div>
                );
              })}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default H2HSummaryBadge;
