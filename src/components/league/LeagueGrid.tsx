import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SUPPORTED_COMPETITIONS, CompetitionCode, Match } from '@/types/footballApi';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';

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
  const [canScrollRight, setCanScrollRight] = useState(false);

  const matchCounts: Record<string, number> = {};
  liveMatches.forEach(match => {
    const code = match.competition?.code;
    if (code) {
      matchCounts[code] = (matchCounts[code] || 0) + 1;
    }
  });

  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
      }
    };
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  return (
    <div className="relative">
      <div 
        id="leagues" 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide"
      >
        {SUPPORTED_COMPETITIONS.map((league) => {
          const isSelected = selectedLeague === league.code;
          const hasLive = matchCounts[league.code] > 0;

          return (
            <motion.button
              key={league.code}
              onClick={() => onLeagueSelect(league.code)}
              whileTap={{ scale: 0.94 }}
              className={cn(
                "flex flex-col items-center gap-2 px-4 py-3.5 rounded-2xl",
                "border flex-shrink-0 min-w-[76px] min-h-[80px]",
                "transition-all duration-200 touch-manipulation",
                isSelected
                  ? "bg-primary/8 border-primary/25 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                  : "bg-card/60 border-border/20 active:bg-muted/40"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-xl",
                isSelected ? "bg-primary/12" : "bg-muted/20"
              )}>
                {league.flag}
              </div>
              <span className={cn(
                "text-[10px] font-semibold leading-tight text-center",
                isSelected ? "text-primary" : "text-muted-foreground/70"
              )}>
                {league.name.length > 10 ? league.name.split(' ')[0] : league.name}
              </span>
              {hasLive && (
                <Badge 
                  variant="destructive" 
                  className="text-[8px] px-1.5 py-0 h-3.5 animate-pulse"
                >
                  {matchCounts[league.code]} CANLI
                </Badge>
              )}
            </motion.button>
          );
        })}
      </div>

      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-1 w-10 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none flex items-center justify-end pr-1">
          <motion.div
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LeagueGrid;
