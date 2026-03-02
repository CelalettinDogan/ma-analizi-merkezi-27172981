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

interface MatchCarouselProps {
  matches: Match[];
  onMatchSelect: (match: Match) => void;
  isLoading?: boolean;
}

const MatchSlide: React.FC<{
  match: Match;
  onSelect: () => void;
  isFavorite: (type: 'team' | 'league', id: string) => boolean;
  onToggleFavorite: (type: 'team' | 'league', id: string, name: string) => void;
  isLoggedIn: boolean;
}> = ({ match, onSelect, isFavorite, onToggleFavorite, isLoggedIn }) => {
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
      whileTap={{ scale: 0.97 }}
      className="flex-shrink-0 w-[260px] md:w-[300px]"
    >
      <button
        onClick={onSelect}
        className={cn(
          "w-full p-4 rounded-2xl text-left transition-all",
          "bg-card/50 backdrop-blur-sm border border-border/20",
          "active:bg-card/70",
          "focus:outline-none focus:ring-2 focus:ring-primary/30"
        )}
      >
        {/* Header — league + status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-base">{match.competition.area?.flag || '🏆'}</span>
            <span className="text-micro text-muted-foreground truncate max-w-[100px]">
              {match.competition.name}
            </span>
          </div>
          {isLive ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-destructive/10 text-destructive text-micro font-medium">
              <span className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
              CANLI
            </span>
          ) : isFinished ? (
            <span className="text-micro text-muted-foreground/40">Bitti</span>
          ) : (
            <span className="text-micro text-muted-foreground/60 tabular-nums">
              {format(matchDate, 'HH:mm', { locale: tr })}
            </span>
          )}
        </div>

        {/* Teams */}
        <div className="space-y-2.5">
          {/* Home */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-7 h-7 rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                {match.homeTeam.crest ? (
                  <img src={match.homeTeam.crest} alt="" className="w-5 h-5 object-contain" />
                ) : (
                  <span className="text-micro font-bold text-muted-foreground">{match.homeTeam.tla || 'H'}</span>
                )}
              </div>
              <span className="text-sm truncate">
                {match.homeTeam.shortName || match.homeTeam.name}
              </span>
              {isLoggedIn && (
                <button
                  onClick={(e) => handleFavoriteClick(e, homeTeamId, match.homeTeam.name)}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full touch-manipulation shrink-0"
                >
                  <Heart className={cn(
                    "w-3.5 h-3.5 transition-colors",
                    isHomeFavorite ? "fill-destructive text-destructive" : "text-muted-foreground/30"
                  )} />
                </button>
              )}
            </div>
            <span className={cn(
              "text-base font-semibold tabular-nums",
              isLive && "text-primary"
            )}>
              {match.score.fullTime.home ?? '-'}
            </span>
          </div>

          {/* Away */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-7 h-7 rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                {match.awayTeam.crest ? (
                  <img src={match.awayTeam.crest} alt="" className="w-5 h-5 object-contain" />
                ) : (
                  <span className="text-micro font-bold text-muted-foreground">{match.awayTeam.tla || 'A'}</span>
                )}
              </div>
              <span className="text-sm truncate">
                {match.awayTeam.shortName || match.awayTeam.name}
              </span>
              {isLoggedIn && (
                <button
                  onClick={(e) => handleFavoriteClick(e, awayTeamId, match.awayTeam.name)}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full touch-manipulation shrink-0"
                >
                  <Heart className={cn(
                    "w-3.5 h-3.5 transition-colors",
                    isAwayFavorite ? "fill-destructive text-destructive" : "text-muted-foreground/30"
                  )} />
                </button>
              )}
            </div>
            <span className={cn(
              "text-base font-semibold tabular-nums",
              isLive && "text-primary"
            )}>
              {match.score.fullTime.away ?? '-'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t border-border/10 flex items-center justify-between">
          <span className="text-micro text-muted-foreground/60 tabular-nums">
            {format(matchDate, 'd MMM', { locale: tr })}
          </span>
          <span className="text-micro text-primary font-medium">Analiz Et →</span>
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
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div 
            key={i}
            className="flex-shrink-0 w-[260px] md:w-[300px] h-[160px] rounded-2xl bg-muted/10 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground/50">
        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Yaklaşan maç bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Nav buttons — desktop only */}
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

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
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

      {/* No fade edge — native feel */}
    </div>
  );
};

export default MatchCarousel;
