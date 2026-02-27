import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SUPPORTED_COMPETITIONS, CompetitionCode, Match } from '@/types/footballApi';

interface LeagueGridProps {
  selectedLeague: CompetitionCode | '';
  onLeagueSelect: (code: CompetitionCode) => void;
  liveMatches?: Match[];
}

const LeagueGrid: React.FC<LeagueGridProps> = ({ 
  selectedLeague, 
  onLeagueSelect,
  liveMatches = []
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Calculate live match counts
  const matchCounts: Record<string, number> = {};
  liveMatches.forEach(match => {
    const code = match.competition?.code;
    if (code) {
      matchCounts[code] = (matchCounts[code] || 0) + 1;
    }
  });

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h2 className="text-sm font-display font-semibold text-foreground">Lig Seçin</h2>
        </div>
        {selectedLeague && (
          <span className="text-xs text-primary font-medium">
            ✓ {SUPPORTED_COMPETITIONS.find(c => c.code === selectedLeague)?.name}
          </span>
        )}
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
      >
        {SUPPORTED_COMPETITIONS.map((league) => {
          const isSelected = selectedLeague === league.code;
          const liveCount = matchCounts[league.code] || 0;

          return (
            <motion.button
              key={league.code}
              onClick={() => onLeagueSelect(league.code)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-2xl whitespace-nowrap transition-all duration-200",
                "border flex-shrink-0 min-h-[48px] snap-start",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_0_20px_-4px_hsl(var(--primary)/0.35)] scale-[1.03]"
                  : "bg-card/60 backdrop-blur-sm border-border/30 active:bg-card/80"
              )}
            >
              <span className="text-lg">{league.flag}</span>
              <span className="text-xs font-medium">{league.name}</span>
              {liveCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
                  <span className={cn(
                    "text-micro font-medium",
                    isSelected ? "text-primary-foreground/80" : "text-destructive"
                  )}>
                    {liveCount}
                  </span>
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default LeagueGrid;
