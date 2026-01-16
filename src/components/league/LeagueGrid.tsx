import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, ChevronRight, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUPPORTED_COMPETITIONS, CompetitionCode } from '@/types/footballApi';
import { staggerContainer, staggerItem, cardHover, cardTap } from '@/lib/animations';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface LeagueGridProps {
  selectedLeague: CompetitionCode | '';
  onLeagueSelect: (code: CompetitionCode) => void;
  compact?: boolean;
}

const leagueColors: Record<string, string> = {
  'PL': 'from-purple-600/20 to-purple-900/20 border-purple-500/30',
  'BL1': 'from-red-600/20 to-red-900/20 border-red-500/30',
  'PD': 'from-orange-600/20 to-orange-900/20 border-orange-500/30',
  'SA': 'from-blue-600/20 to-blue-900/20 border-blue-500/30',
  'FL1': 'from-sky-600/20 to-sky-900/20 border-sky-500/30',
  'CL': 'from-indigo-600/20 to-indigo-900/20 border-indigo-500/30',
};

const LeagueGrid: React.FC<LeagueGridProps> = ({ 
  selectedLeague, 
  onLeagueSelect,
  compact = false 
}) => {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleFavoriteClick = (e: React.MouseEvent, code: string, name: string) => {
    e.stopPropagation();
    toggleFavorite('league', code, name);
  };

  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {SUPPORTED_COMPETITIONS.map((league) => (
          <motion.button
            key={league.code}
            onClick={() => onLeagueSelect(league.code)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all",
              "border backdrop-blur-sm",
              selectedLeague === league.code
                ? "bg-primary/20 border-primary text-primary"
                : "bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <span className="text-lg">{league.flag}</span>
            <span className="text-sm font-medium">{league.name}</span>
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-3 gap-3"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {SUPPORTED_COMPETITIONS.map((league) => {
        const isSelected = selectedLeague === league.code;
        const colorClass = leagueColors[league.code] || 'from-primary/20 to-primary/10 border-primary/30';
        
        return (
          <motion.button
            key={league.code}
            variants={staggerItem}
            whileHover={cardHover}
            whileTap={cardTap}
            onClick={() => onLeagueSelect(league.code)}
            className={cn(
              "relative group p-4 rounded-2xl text-left transition-all duration-300",
              "bg-gradient-to-br border backdrop-blur-sm",
              colorClass,
              isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}
          >
            {/* Selection indicator - positioned on left to avoid favorite button conflict */}
            {isSelected && (
              <motion.div
                layoutId="leagueIndicator"
                className="absolute top-2 left-2 w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}

            {/* League flag/icon */}
            <div className="text-4xl mb-3">{league.flag}</div>
            
            {/* League info */}
            <div className="space-y-1">
              <h3 className={cn(
                "font-semibold text-sm transition-colors",
                isSelected ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"
              )}>
                {league.name}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {league.country}
              </p>
            </div>

            {/* Favorite button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => handleFavoriteClick(e, league.code, league.name)}
                  className={cn(
                    "absolute top-2 right-2 p-1.5 rounded-full transition-all",
                    "hover:bg-background/50",
                    isFavorite('league', league.code) 
                      ? "text-red-500" 
                      : "text-muted-foreground opacity-0 group-hover:opacity-100"
                  )}
                >
                  <Heart 
                    className={cn(
                      "w-4 h-4 transition-all",
                      isFavorite('league', league.code) && "fill-current"
                    )} 
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {user 
                  ? (isFavorite('league', league.code) ? 'Favorilerden Kaldır' : 'Favorilere Ekle')
                  : 'Favorilere eklemek için giriş yapın'
                }
              </TooltipContent>
            </Tooltip>

            {/* Hover arrow */}
            <ChevronRight className={cn(
              "absolute bottom-4 right-4 w-4 h-4 transition-all",
              "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0",
              isSelected ? "text-primary" : "text-muted-foreground"
            )} />
          </motion.button>
        );
      })}
    </motion.div>
  );
};

export default LeagueGrid;
