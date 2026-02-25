import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SUPPORTED_COMPETITIONS, CompetitionCode, Match } from '@/types/footballApi';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Calculate live match counts from passed data
  const matchCounts: Record<string, number> = {};
  liveMatches.forEach(match => {
    const code = match.competition?.code;
    if (code) {
      matchCounts[code] = (matchCounts[code] || 0) + 1;
    }
  });

  // Check if can scroll right
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

  // Handle scroll to hide hint
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowScrollHint(false);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  return (
    <TooltipProvider>
      <div className="relative">
        {/* Section Header with clear instruction */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full bg-primary" />
            <h2 className="text-sm font-semibold text-foreground">Lig Seçin</h2>
          </div>
          {selectedLeague && (
            <span className="text-xs text-primary font-medium">
              ✓ {SUPPORTED_COMPETITIONS.find(c => c.code === selectedLeague)?.name}
            </span>
          )}
        </div>
        
        <div 
          id="leagues" 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide"
        >
          {SUPPORTED_COMPETITIONS.map((league) => {
            const isSelected = selectedLeague === league.code;
            const hasLive = matchCounts[league.code] > 0;

            return (
              <Tooltip key={league.code}>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={() => onLeagueSelect(league.code)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex items-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl whitespace-nowrap transition-all",
                      "border flex-shrink-0 min-h-[48px]", // Better touch target
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                        : "bg-card border-border hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    <span className="text-lg sm:text-xl">{league.flag}</span>
                    <span className="text-xs sm:text-sm font-medium">{league.name}</span>
                    {hasLive && (
                      <Badge 
                        variant="destructive" 
                        className="text-micro px-1.5 py-0 h-4 ml-0.5 sm:ml-1 animate-pulse"
                      >
                        {matchCounts[league.code]}
                      </Badge>
                    )}
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p>{league.name} maçlarını görüntüle</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Scroll hint indicator */}
        {(showScrollHint || canScrollRight) && (
          <div className="absolute right-0 top-8 bottom-2 w-8 sm:w-12 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none flex items-center justify-end pr-1">
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-muted-foreground"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default LeagueGrid;
