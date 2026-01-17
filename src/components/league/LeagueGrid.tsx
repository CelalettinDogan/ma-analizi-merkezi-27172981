import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SUPPORTED_COMPETITIONS, CompetitionCode, Match } from '@/types/footballApi';
import { Badge } from '@/components/ui/badge';

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
  // Calculate live match counts from passed data
  const matchCounts: Record<string, number> = {};
  liveMatches.forEach(match => {
    const code = match.competition?.code;
    if (code) {
      matchCounts[code] = (matchCounts[code] || 0) + 1;
    }
  });

  return (
    <div id="leagues" className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {SUPPORTED_COMPETITIONS.map((league) => {
        const isSelected = selectedLeague === league.code;
        const hasLive = matchCounts[league.code] > 0;

        return (
          <motion.button
            key={league.code}
            onClick={() => onLeagueSelect(league.code)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all",
              "border",
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:border-primary/50 hover:bg-primary/5"
            )}
          >
            <span className="text-lg">{league.flag}</span>
            <span className="text-sm font-medium">{league.code}</span>
            {hasLive && (
              <Badge 
                variant="destructive" 
                className="text-[10px] px-1.5 py-0 h-4 ml-1"
              >
                {matchCounts[league.code]}
              </Badge>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default LeagueGrid;
