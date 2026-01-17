import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ChevronRight, Heart, Zap, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUPPORTED_COMPETITIONS, CompetitionCode } from '@/types/footballApi';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface LeagueGridProps {
  selectedLeague: CompetitionCode | '';
  onLeagueSelect: (code: CompetitionCode) => void;
  compact?: boolean;
}

interface LeagueMatchCount {
  [key: string]: { live: number; upcoming: number };
}

const leagueColors: Record<string, string> = {
  'PL': 'from-purple-600/20 to-purple-900/20 border-purple-500/30 hover:border-purple-400/50',
  'BL1': 'from-red-600/20 to-red-900/20 border-red-500/30 hover:border-red-400/50',
  'PD': 'from-orange-600/20 to-orange-900/20 border-orange-500/30 hover:border-orange-400/50',
  'SA': 'from-blue-600/20 to-blue-900/20 border-blue-500/30 hover:border-blue-400/50',
  'FL1': 'from-sky-600/20 to-sky-900/20 border-sky-500/30 hover:border-sky-400/50',
  'CL': 'from-indigo-600/20 to-indigo-900/20 border-indigo-500/30 hover:border-indigo-400/50',
};

const leagueGlowColors: Record<string, string> = {
  'PL': 'shadow-purple-500/20',
  'BL1': 'shadow-red-500/20',
  'PD': 'shadow-orange-500/20',
  'SA': 'shadow-blue-500/20',
  'FL1': 'shadow-sky-500/20',
  'CL': 'shadow-indigo-500/20',
};

const LeagueGrid: React.FC<LeagueGridProps> = ({ 
  selectedLeague, 
  onLeagueSelect,
  compact = false 
}) => {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [matchCounts, setMatchCounts] = useState<LeagueMatchCount>({});

  // Fetch match counts for each league
  useEffect(() => {
    const fetchMatchCounts = async () => {
      try {
        const { data: liveData } = await supabase.functions.invoke('football-api', {
          body: { action: 'live' },
        });

        const counts: LeagueMatchCount = {};
        SUPPORTED_COMPETITIONS.forEach(league => {
          counts[league.code] = { live: 0, upcoming: 0 };
        });

        if (liveData?.matches) {
          liveData.matches.forEach((match: any) => {
            const code = match.competition?.code;
            if (code && counts[code]) {
              counts[code].live++;
            }
          });
        }

        setMatchCounts(counts);
      } catch (e) {
        console.error('Error fetching match counts:', e);
      }
    };

    fetchMatchCounts();
  }, []);

  const handleFavoriteClick = (e: React.MouseEvent, code: string, name: string) => {
    e.stopPropagation();
    toggleFavorite('league', code, name);
  };

  // Find the featured league (most live matches or first one)
  const featuredLeague = SUPPORTED_COMPETITIONS.reduce((prev, curr) => {
    const prevCount = matchCounts[prev.code]?.live || 0;
    const currCount = matchCounts[curr.code]?.live || 0;
    return currCount > prevCount ? curr : prev;
  }, SUPPORTED_COMPETITIONS[0]);

  const otherLeagues = SUPPORTED_COMPETITIONS.filter(l => l.code !== featuredLeague.code);

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
            {matchCounts[league.code]?.live > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                {matchCounts[league.code].live} CANLI
              </Badge>
            )}
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Featured League - Large Card */}
      <motion.button
        variants={staggerItem}
        whileHover={{ scale: 1.01, y: -4 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => onLeagueSelect(featuredLeague.code)}
        className={cn(
          "relative group md:col-span-1 md:row-span-2 p-6 rounded-2xl text-left transition-all duration-300",
          "bg-gradient-to-br border backdrop-blur-xl",
          "shadow-lg hover:shadow-xl",
          leagueColors[featuredLeague.code],
          leagueGlowColors[featuredLeague.code],
          selectedLeague === featuredLeague.code && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
      >
        {/* Featured Badge */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-secondary/20 text-secondary border-secondary/30 text-xs">
            <Zap className="w-3 h-3 mr-1" />
            Öne Çıkan
          </Badge>
        </div>

        {/* Selection indicator */}
        {selectedLeague === featuredLeague.code && (
          <motion.div
            layoutId="leagueIndicator"
            className="absolute top-3 right-3 w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}

        {/* League flag/icon */}
        <div className="text-6xl mb-4 mt-6">{featuredLeague.flag}</div>
        
        {/* League info */}
        <div className="space-y-2">
          <h3 className="font-display font-bold text-xl text-foreground">
            {featuredLeague.name}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Trophy className="w-4 h-4" />
            {featuredLeague.country}
          </p>
          
          {/* Match counts */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/30">
            {matchCounts[featuredLeague.code]?.live > 0 && (
              <div className="flex items-center gap-1.5 text-red-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-xs font-medium">{matchCounts[featuredLeague.code].live} Canlı</span>
              </div>
            )}
          </div>
        </div>

        {/* Favorite button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => handleFavoriteClick(e, featuredLeague.code, featuredLeague.name)}
              className={cn(
                "absolute bottom-4 right-4 p-2 rounded-full transition-all",
                "hover:bg-background/50",
                isFavorite('league', featuredLeague.code) 
                  ? "text-red-500" 
                  : "text-muted-foreground opacity-0 group-hover:opacity-100"
              )}
            >
              <Heart 
                className={cn(
                  "w-5 h-5 transition-all",
                  isFavorite('league', featuredLeague.code) && "fill-current"
                )} 
              />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {user 
              ? (isFavorite('league', featuredLeague.code) ? 'Favorilerden Kaldır' : 'Favorilere Ekle')
              : 'Favorilere eklemek için giriş yapın'
            }
          </TooltipContent>
        </Tooltip>
      </motion.button>

      {/* Other Leagues - Smaller Cards in 2x2 Grid */}
      <div className="md:col-span-2 grid grid-cols-2 gap-3">
        {otherLeagues.map((league) => {
          const isSelected = selectedLeague === league.code;
          const colorClass = leagueColors[league.code] || 'from-primary/20 to-primary/10 border-primary/30';
          const hasLiveMatches = matchCounts[league.code]?.live > 0;
          
          return (
            <motion.button
              key={league.code}
              variants={staggerItem}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onLeagueSelect(league.code)}
              className={cn(
                "relative group p-4 rounded-xl text-left transition-all duration-300",
                "bg-gradient-to-br border backdrop-blur-xl",
                "shadow-md hover:shadow-lg",
                colorClass,
                isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            >
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  layoutId="leagueIndicator"
                  className="absolute top-2 left-2 w-2.5 h-2.5 bg-primary rounded-full shadow-lg shadow-primary/50"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Live badge */}
              {hasLiveMatches && (
                <Badge 
                  variant="destructive" 
                  className="absolute top-2 right-2 text-[10px] px-1.5 py-0 h-4 animate-pulse"
                >
                  {matchCounts[league.code].live} CANLI
                </Badge>
              )}

              {/* League flag/icon */}
              <div className="text-3xl mb-2">{league.flag}</div>
              
              {/* League info */}
              <div className="space-y-0.5">
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
                      "absolute bottom-2 right-2 p-1.5 rounded-full transition-all",
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
                "absolute bottom-3 right-8 w-4 h-4 transition-all",
                "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0",
                isSelected ? "text-primary" : "text-muted-foreground"
              )} />
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default LeagueGrid;
