import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Match } from '@/types/footballApi';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MatchCarouselProps {
  matches: Match[];
  onMatchSelect: (match: Match) => void;
  isLoading?: boolean;
}

interface MatchSlideProps {
  match: Match;
  onSelect: () => void;
  isFavorite: (type: 'team' | 'league', id: string) => boolean;
  onToggleFavorite: (type: 'team' | 'league', id: string, name: string) => void;
  isLoggedIn: boolean;
}

const MatchSlide: React.FC<MatchSlideProps> = ({ 
  match, 
  onSelect, 
  isFavorite, 
  onToggleFavorite,
  isLoggedIn 
}) => {
  const matchDate = parseISO(match.utcDate);
  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED';
  const isFinished = match.status === 'FINISHED';

  const homeTeamId = String(match.homeTeam.id);
  const awayTeamId = String(match.awayTeam.id);
  const isHomeFavorite = isFavorite('team', homeTeamId);
  const isAwayFavorite = isFavorite('team', awayTeamId);

  const handleFavoriteClick = (e: React.MouseEvent, teamId: string, teamName: string) => {
    e.stopPropagation();
    onToggleFavorite('team', teamId, teamName);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="flex-shrink-0 w-[280px] md:w-[320px]"
    >
      <button
        onClick={onSelect}
        className={cn(
          "w-full p-4 rounded-2xl text-left transition-all duration-300",
          "bg-gradient-to-br from-card to-card/80 border border-border/50",
          "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
          "focus:outline-none focus:ring-2 focus:ring-primary/50"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">{match.competition.area?.flag || '🏆'}</span>
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {match.competition.name}
            </span>
          </div>
          {isLive ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              CANLI
            </span>
          ) : isFinished ? (
            <span className="text-xs text-muted-foreground">Bitti</span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {format(matchDate, 'HH:mm', { locale: tr })}
            </span>
          )}
        </div>

        {/* Teams */}
        <div className="space-y-3">
          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden">
                {match.homeTeam.crest ? (
                  <img src={match.homeTeam.crest} alt="" className="w-6 h-6 object-contain" />
                ) : (
                  <span className="text-xs font-bold">{match.homeTeam.tla || 'H'}</span>
                )}
              </div>
              <span className="font-medium text-sm truncate max-w-[120px]">
                {match.homeTeam.shortName || match.homeTeam.name}
              </span>
              {isLoggedIn && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => handleFavoriteClick(e, homeTeamId, match.homeTeam.name)}
                        className="p-1 rounded-full hover:bg-muted/50 transition-colors"
                      >
                        <Heart 
                          className={cn(
                            "w-3.5 h-3.5 transition-colors",
                            isHomeFavorite 
                              ? "fill-red-500 text-red-500" 
                              : "text-muted-foreground hover:text-red-400"
                          )} 
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">
                        {isHomeFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <span className={cn(
              "text-lg font-bold tabular-nums",
              isLive && "text-primary"
            )}>
              {match.score.fullTime.home ?? '-'}
            </span>
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden">
                {match.awayTeam.crest ? (
                  <img src={match.awayTeam.crest} alt="" className="w-6 h-6 object-contain" />
                ) : (
                  <span className="text-xs font-bold">{match.awayTeam.tla || 'A'}</span>
                )}
              </div>
              <span className="font-medium text-sm truncate max-w-[120px]">
                {match.awayTeam.shortName || match.awayTeam.name}
              </span>
              {isLoggedIn && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => handleFavoriteClick(e, awayTeamId, match.awayTeam.name)}
                        className="p-1 rounded-full hover:bg-muted/50 transition-colors"
                      >
                        <Heart 
                          className={cn(
                            "w-3.5 h-3.5 transition-colors",
                            isAwayFavorite 
                              ? "fill-red-500 text-red-500" 
                              : "text-muted-foreground hover:text-red-400"
                          )} 
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">
                        {isAwayFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <span className={cn(
              "text-lg font-bold tabular-nums",
              isLive && "text-primary"
            )}>
              {match.score.fullTime.away ?? '-'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{format(matchDate, 'd MMM', { locale: tr })}</span>
          </div>
          <span className="text-xs text-primary font-medium">Analiz Et →</span>
        </div>
      </button>
    </motion.div>
  );
};

const MatchCarousel: React.FC<MatchCarouselProps> = ({ matches, onMatchSelect, isLoading }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div 
            key={i}
            className="flex-shrink-0 w-[280px] md:w-[320px] h-[180px] rounded-2xl bg-muted/30 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Yaklaşan maç bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
        onClick={scrollPrev}
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
        onClick={scrollNext}
      >
        <ChevronRight className="w-5 h-5" />
      </Button>

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {matches.map((match) => (
            <MatchSlide
              key={match.id}
              match={match}
              onSelect={() => onMatchSelect(match)}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              isLoggedIn={!!user}
            />
          ))}
        </div>
      </div>

      {/* Gradient Fade */}
      <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  );
};

export default MatchCarousel;
