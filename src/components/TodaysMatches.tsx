import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronRight, Star, Loader2, Clock, Sparkles, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Match } from '@/types/footballApi';
import { format, isToday, isTomorrow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import H2HSummaryBadge from '@/components/match/H2HSummaryBadge';
import { useH2HPreview } from '@/hooks/useH2HPreview';

interface TodaysMatchesProps {
  matches: Match[];
  isLoading?: boolean;
  loadingMatchId?: number | null;
  onMatchSelect: (match: Match) => void;
  lastUpdated?: Date | null;
}

const BIG_TEAMS = [
  'Arsenal', 'Liverpool', 'Manchester City', 'Manchester United', 'Chelsea', 'Tottenham',
  'Barcelona', 'Real Madrid', 'Atletico Madrid',
  'Bayern', 'Dortmund',
  'Juventus', 'Inter', 'Milan', 'Napoli',
  'PSG', 'Monaco'
];

const isBigMatch = (match: Match): boolean => {
  const home = match.homeTeam.name.toLowerCase();
  const away = match.awayTeam.name.toLowerCase();
  return BIG_TEAMS.some(team => 
    home.includes(team.toLowerCase()) || away.includes(team.toLowerCase())
  );
};

const getFeaturedReason = (match: Match, allMatches: Match[]): string => {
  if (isBigMatch(match)) return 'Büyük Maç';
  const now = new Date();
  const sortedByTime = [...allMatches].sort((a, b) => 
    new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
  );
  const soonest = sortedByTime.find(m => new Date(m.utcDate) > now);
  if (soonest?.id === match.id) return 'En Yakın';
  return 'Önerilen';
};

const getDateLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Bugün';
  if (isTomorrow(date)) return 'Yarın';
  return format(date, 'd MMMM EEEE', { locale: tr });
};

const FeaturedMatchH2H: React.FC<{ match: Match }> = ({ match }) => {
  const { data, isLoading } = useH2HPreview(
    match.id,
    match.homeTeam.name,
    match.awayTeam.name
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/30">
        <Swords className="w-3 h-3 text-muted-foreground animate-pulse" />
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.lastMatches.length === 0) return null;

  return (
    <H2HSummaryBadge
      homeTeam={match.homeTeam.name}
      awayTeam={match.awayTeam.name}
      lastMatches={data.lastMatches}
      homeWins={data.homeWins}
      awayWins={data.awayWins}
      draws={data.draws}
    />
  );
};

const TodaysMatches: React.FC<TodaysMatchesProps> = ({ 
  matches, 
  isLoading = false, 
  loadingMatchId, 
  onMatchSelect,
  lastUpdated
}) => {
  const [showAll, setShowAll] = useState(false);

  const { featuredMatch, otherMatches, featuredReason, hasMatchesToday, title } = useMemo(() => {
    if (matches.length === 0) return { featuredMatch: null, otherMatches: [], featuredReason: '', hasMatchesToday: false, title: 'Bugünün Maçları' };
    
    const todayMatches = matches.filter(m => isToday(new Date(m.utcDate)));
    const hasToday = todayMatches.length > 0;
    const bigMatch = matches.find(isBigMatch);
    const featured = bigMatch || matches[0];
    const others = matches.filter(m => m.id !== featured?.id);
    const reason = getFeaturedReason(featured, matches);
    
    return { 
      featuredMatch: featured, 
      otherMatches: others, 
      featuredReason: reason,
      hasMatchesToday: hasToday,
      title: hasToday ? 'Bugünün Maçları' : 'Yaklaşan Maçlar'
    };
  }, [matches]);

  const displayedMatches = showAll ? otherMatches : otherMatches.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-primary" />
          <h2 className="font-display font-semibold text-sm">Bugünün Maçları</h2>
        </div>
        <div className="h-40 rounded-2xl bg-muted/20 animate-pulse" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted/10 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-primary" />
          <h2 className="font-display font-semibold text-sm">Bugünün Maçları</h2>
        </div>
        <div className="text-center py-12">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">Planlanmış maç bulunamadı</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Lig seçerek maçları görüntüleyin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header — minimal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-primary" />
          <h2 className="font-display font-semibold text-sm">{title}</h2>
          <span className="text-xs text-muted-foreground">{matches.length}</span>
        </div>
      </div>

      {/* Featured Match — Clean, borderless surface */}
      {featuredMatch && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => !loadingMatchId && onMatchSelect(featuredMatch)}
          disabled={!!loadingMatchId}
          className={cn(
            "relative w-full text-left rounded-2xl p-4 transition-all",
            "bg-card/60 backdrop-blur-sm",
            "border border-border/30",
            loadingMatchId === featuredMatch.id && "opacity-80",
            loadingMatchId && loadingMatchId !== featuredMatch.id && "opacity-40"
          )}
        >
          {/* Loading Overlay */}
          {loadingMatchId === featuredMatch.id && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10"
            >
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span className="text-xs font-medium">Analiz ediliyor...</span>
              </div>
            </motion.div>
          )}

          {/* Top row: reason tag + H2H */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-micro font-medium",
                featuredReason === 'Büyük Maç' 
                  ? "bg-secondary/8 text-secondary" 
                  : "bg-primary/5 text-primary"
              )}>
                {featuredReason === 'Büyük Maç' ? (
                  <Sparkles className="w-3 h-3" />
                ) : featuredReason === 'En Yakın' ? (
                  <Clock className="w-3 h-3" />
                ) : (
                  <Star className="w-3 h-3" />
                )}
                {featuredReason}
              </span>
              {!hasMatchesToday && (
               <span className="text-micro text-muted-foreground/60">
                  {getDateLabel(featuredMatch.utcDate)}
                </span>
              )}
            </div>
            <FeaturedMatchH2H match={featuredMatch} />
          </div>

          {/* Teams row */}
          <div className="flex items-center gap-3">
            {/* Home */}
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                {featuredMatch.homeTeam.crest ? (
                  <img src={featuredMatch.homeTeam.crest} alt="" className="w-7 h-7 object-contain" />
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">
                    {featuredMatch.homeTeam.shortName?.[0] || 'H'}
                  </span>
                )}
              </div>
              <span className="font-medium text-sm truncate">
                {featuredMatch.homeTeam.shortName || featuredMatch.homeTeam.name}
              </span>
            </div>

            {/* Center: Time */}
            <div className="flex flex-col items-center flex-shrink-0 px-2">
              <span className="text-lg font-semibold text-primary tabular-nums">
                {format(new Date(featuredMatch.utcDate), 'HH:mm')}
              </span>
              <span className="text-micro text-muted-foreground/60">
                {featuredMatch.competition.code}
              </span>
            </div>

            {/* Away */}
            <div className="flex-1 flex items-center gap-3 min-w-0 justify-end">
              <span className="font-medium text-sm truncate text-right">
                {featuredMatch.awayTeam.shortName || featuredMatch.awayTeam.name}
              </span>
              <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                {featuredMatch.awayTeam.crest ? (
                  <img src={featuredMatch.awayTeam.crest} alt="" className="w-7 h-7 object-contain" />
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">
                    {featuredMatch.awayTeam.shortName?.[0] || 'A'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CTA row */}
          <div className="flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-border/20">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Analiz Et</span>
            <ChevronRight className="w-3.5 h-3.5 text-primary" />
          </div>
        </motion.button>
      )}

      {/* Match List — minimal rows */}
      <div className="space-y-0.5">
        {!hasMatchesToday && displayedMatches.length > 0 && (
          <div className="text-micro text-muted-foreground/60 font-medium px-3 py-1.5">
            {getDateLabel(displayedMatches[0].utcDate)}
          </div>
        )}
        
        {displayedMatches.map((match, index) => {
          const matchTime = format(new Date(match.utcDate), 'HH:mm');
          const isThisLoading = loadingMatchId === match.id;
          const isAnyLoading = !!loadingMatchId;
          const prevMatch = displayedMatches[index - 1];
          const showDateSeparator = !hasMatchesToday && prevMatch && 
            match.utcDate.split('T')[0] !== prevMatch.utcDate.split('T')[0];

          return (
            <React.Fragment key={match.id}>
              {showDateSeparator && (
                <div className="text-micro text-muted-foreground/60 font-medium px-3 py-2 mt-2">
                  {getDateLabel(match.utcDate)}
                </div>
              )}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                whileTap={!isAnyLoading ? { scale: 0.98 } : {}}
                onClick={() => !isAnyLoading && onMatchSelect(match)}
                disabled={isAnyLoading}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-3 rounded-xl transition-colors text-left",
                  "min-h-[48px]",
                  isAnyLoading && !isThisLoading && "opacity-40",
                  isThisLoading && "bg-primary/5",
                  !isAnyLoading && "active:bg-muted/30"
                )}
              >
                {/* Time */}
                <span className={cn(
                  "text-xs font-medium w-10 shrink-0 tabular-nums",
                  isThisLoading ? "text-primary" : "text-muted-foreground/70"
                )}>
                  {matchTime}
                </span>

                {/* Teams */}
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  {match.homeTeam.crest && (
                    <img src={match.homeTeam.crest} alt="" className="w-4 h-4 object-contain shrink-0" />
                  )}
                  <span className="text-xs truncate">
                    {match.homeTeam.shortName || match.homeTeam.name}
                  </span>
                  <span className="text-muted-foreground/30 text-micro">–</span>
                  <span className="text-xs truncate">
                    {match.awayTeam.shortName || match.awayTeam.name}
                  </span>
                  {match.awayTeam.crest && (
                    <img src={match.awayTeam.crest} alt="" className="w-4 h-4 object-contain shrink-0" />
                  )}
                </div>

                {/* League code */}
                <span className="text-micro text-muted-foreground/60 shrink-0">
                  {match.competition.code}
                </span>

                {/* Loading or chevron */}
                {isThisLoading ? (
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/20 shrink-0" />
                )}
              </motion.button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Show More */}
      {otherMatches.length > 5 && !showAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(true)}
          className="w-full text-primary text-xs h-9"
        >
          Tümünü Gör (+{otherMatches.length - 5})
        </Button>
      )}
    </div>
  );
};

export default TodaysMatches;
