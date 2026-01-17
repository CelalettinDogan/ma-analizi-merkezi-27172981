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
        <div 
          id="leagues" 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
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
                      "flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all",
                      "border",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-card border-border hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    <span className="text-lg">{league.flag}</span>
                    <span className="text-sm font-medium">{league.name}</span>
                    {hasLive && (
                      <Badge 
                        variant="destructive" 
                        className="text-[10px] px-1.5 py-0 h-4 ml-1 animate-pulse"
                      >
                        {matchCounts[league.code]}
                      </Badge>
                    )}
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p>{league.name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Scroll hint indicator */}
        {(showScrollHint || canScrollRight) && (
          <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none flex items-center justify-end pr-1">
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-muted-foreground"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default LeagueGrid;
