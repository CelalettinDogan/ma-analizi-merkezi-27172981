import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronRight, Star, Loader2, Clock, Sparkles, RefreshCw, Swords } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Match } from '@/types/footballApi';
import { format, isToday, isTomorrow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import H2HSummaryBadge from '@/components/match/H2HSummaryBadge';
import { useH2HPreview } from '@/hooks/useH2HPreview';
import { getCachedH2H } from '@/hooks/useH2HPreview';

interface TodaysMatchesProps {
  matches: Match[];
  isLoading?: boolean;
  loadingMatchId?: number | null;
  onMatchSelect: (match: Match) => void;
  lastUpdated?: Date | null;
  onRefresh?: () => void;
}

// Big teams for featured match selection
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

// Get featured match reason
const getFeaturedReason = (match: Match, allMatches: Match[]): string => {
  if (isBigMatch(match)) return 'Büyük Maç';
  
  // Check if it's the soonest match
  const now = new Date();
  const sortedByTime = [...allMatches].sort((a, b) => 
    new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
  );
  const soonest = sortedByTime.find(m => new Date(m.utcDate) > now);
  if (soonest?.id === match.id) return 'En Yakın';
  
  return 'Önerilen';
};

// Get date label for grouping
const getDateLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Bugün';
  if (isTomorrow(date)) return 'Yarın';
  return format(date, 'd MMMM EEEE', { locale: tr });
};

// Format last updated time
const formatLastUpdated = (date: Date | null): string => {
  if (!date) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Az önce';
  if (diffMins === 1) return '1 dk önce';
  if (diffMins < 60) return `${diffMins} dk önce`;
  
  return format(date, 'HH:mm', { locale: tr });
};

// Stagger animation for list items
const listItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3 }
  })
};

// Featured Match H2H Component - Only loads for featured match (1 API call max)
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

  if (!data || data.lastMatches.length === 0) {
    return null;
  }

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

// CompactH2H removed - was causing too many API calls (N calls per N matches)
// H2H data is now only loaded for the featured match to prevent rate limiting

const TodaysMatches: React.FC<TodaysMatchesProps> = ({ 
  matches, 
  isLoading = false, 
  loadingMatchId, 
  onMatchSelect,
  lastUpdated,
  onRefresh 
}) => {
  const [showAll, setShowAll] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    onRefresh();
    // Reset after a short delay
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Find featured match (first big match or soonest upcoming match)
  const { featuredMatch, otherMatches, featuredReason, hasMatchesToday, title } = useMemo(() => {
    if (matches.length === 0) return { featuredMatch: null, otherMatches: [], featuredReason: '', hasMatchesToday: false, title: 'Bugünün Maçları' };
    
    // Check if any match is today
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
      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-sm md:text-base">Bugünün Maçları</h2>
        </div>
        {/* Skeleton loading */}
        <div className="space-y-3">
          <div className="h-28 md:h-32 rounded-xl bg-muted/50 animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted/30 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-sm md:text-base">Bugünün Maçları</h2>
          </div>
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>
          )}
        </div>
        <div className="text-center py-8 md:py-12">
          <Calendar className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground text-sm md:text-base">Planlanmış maç bulunamadı</p>
          <p className="text-xs md:text-sm text-muted-foreground/70 mt-1">Ligler arasından seçim yaparak maçları görüntüleyebilirsiniz</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3 md:p-6 border-primary/10">
      {/* Header with visual hierarchy improvement */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <div>
            <h2 className="font-semibold text-sm md:text-base">{title}</h2>
            <p className="text-[10px] text-muted-foreground">
              Maça tıklayarak analiz alabilirsiniz
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{matches.length} maç</Badge>
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-7 w-7"
              title="Yenile"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
            </Button>
          )}
        </div>
      </div>

      {/* Featured Match - Large Card */}
      {featuredMatch && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => !loadingMatchId && onMatchSelect(featuredMatch)}
          className={cn(
            "relative p-3 md:p-4 rounded-xl cursor-pointer mb-3 md:mb-4 transition-all group",
            "bg-primary/5 border-2 border-primary/20 hover:border-primary/40 hover:shadow-lg",
            loadingMatchId === featuredMatch.id && "opacity-80 pointer-events-none",
            loadingMatchId && loadingMatchId !== featuredMatch.id && "opacity-50"
          )}
        >
          {/* Loading Overlay */}
          {loadingMatchId === featuredMatch.id && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-xl flex items-center justify-center z-10"
            >
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-primary animate-spin" />
                <span className="text-xs md:text-sm font-medium text-foreground">Analiz ediliyor...</span>
              </div>
            </motion.div>
          )}

          {/* Featured Label with reason and H2H */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-secondary text-secondary-foreground text-[10px]">
                {featuredReason === 'Büyük Maç' ? (
                  <Sparkles className="w-3 h-3 mr-1" />
                ) : featuredReason === 'En Yakın' ? (
                  <Clock className="w-3 h-3 mr-1" />
                ) : (
                  <Star className="w-3 h-3 mr-1 fill-current" />
                )}
                {featuredReason}
              </Badge>
              {!hasMatchesToday && (
                <Badge variant="outline" className="text-[10px]">
                  {getDateLabel(featuredMatch.utcDate)}
                </Badge>
              )}
            </div>
            {/* H2H Summary for Featured Match */}
            <FeaturedMatchH2H match={featuredMatch} />
          </div>

          {/* Match Content */}
          <div className="flex items-center justify-between mt-6">
            {/* Home Team */}
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              {featuredMatch.homeTeam.crest ? (
                <img 
                  src={featuredMatch.homeTeam.crest} 
                  alt="" 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-muted flex items-center justify-center text-sm md:text-lg font-bold flex-shrink-0">
                  {featuredMatch.homeTeam.shortName?.[0] || featuredMatch.homeTeam.name[0]}
                </div>
              )}
              <span className="font-semibold text-sm md:text-base truncate">
                {featuredMatch.homeTeam.shortName || featuredMatch.homeTeam.name}
              </span>
            </div>

            {/* Time */}
            <div className="px-2 md:px-4 text-center flex-shrink-0">
              <div className="text-base md:text-lg font-bold text-primary">
                {format(new Date(featuredMatch.utcDate), 'HH:mm')}
              </div>
              <div className="text-[10px] md:text-xs text-muted-foreground">
                {featuredMatch.competition.code}
              </div>
            </div>

            {/* Away Team */}
            <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end min-w-0">
              <span className="font-semibold text-sm md:text-base truncate text-right">
                {featuredMatch.awayTeam.shortName || featuredMatch.awayTeam.name}
              </span>
              {featuredMatch.awayTeam.crest ? (
                <img 
                  src={featuredMatch.awayTeam.crest} 
                  alt="" 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-muted flex items-center justify-center text-sm md:text-lg font-bold flex-shrink-0">
                  {featuredMatch.awayTeam.shortName?.[0] || featuredMatch.awayTeam.name[0]}
                </div>
              )}
            </div>
          </div>

          {/* CTA - More prominent */}
          <div className="flex justify-center mt-4">
            <Button 
              size="default" 
              className="gap-2 group-hover:bg-primary/90 text-sm font-medium shadow-md"
              disabled={!!loadingMatchId}
            >
              {loadingMatchId === featuredMatch.id ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analiz Ediliyor...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Bu Maçı Analiz Et
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Other Matches - Compact List with Stagger Animation */}
      <AnimatePresence>
        <div className="space-y-1">
          {/* Date group headers for upcoming matches */}
          {!hasMatchesToday && displayedMatches.length > 0 && (
            <div className="text-xs text-muted-foreground font-medium py-1 px-2">
              {getDateLabel(displayedMatches[0].utcDate)}
            </div>
          )}
          
          {displayedMatches.map((match, index) => {
            const matchTime = format(new Date(match.utcDate), 'HH:mm');
            const isThisLoading = loadingMatchId === match.id;
            const isAnyLoading = !!loadingMatchId;

            // Show date separator if date changes
            const prevMatch = displayedMatches[index - 1];
            const showDateSeparator = !hasMatchesToday && prevMatch && 
              match.utcDate.split('T')[0] !== prevMatch.utcDate.split('T')[0];

            return (
              <React.Fragment key={match.id}>
                {showDateSeparator && (
                  <div className="text-xs text-muted-foreground font-medium py-2 px-2 border-t border-border/50 mt-2">
                    {getDateLabel(match.utcDate)}
                  </div>
                )}
                <motion.div
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={listItemVariants}
                  whileHover={!isAnyLoading ? { x: 4, backgroundColor: 'hsl(var(--muted) / 0.5)' } : {}}
                  onClick={() => !isAnyLoading && onMatchSelect(match)}
                  className={cn(
                    "flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg transition-all relative",
                    "min-h-[44px] md:min-h-[48px]",
                    isAnyLoading && !isThisLoading && "opacity-50",
                    isThisLoading && "bg-primary/10 border border-primary/30",
                    !isAnyLoading && "cursor-pointer hover:bg-muted/50"
                  )}
                >
                  {/* Loading indicator for this specific match */}
                  {isThisLoading && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute left-2"
                    >
                      <Loader2 className="w-3 h-3 md:w-4 md:h-4 text-primary animate-spin" />
                    </motion.div>
                  )}

                  {/* Time */}
                  <span className={cn(
                    "text-xs md:text-sm font-medium w-10 md:w-12 shrink-0",
                    isThisLoading ? "text-primary ml-4 md:ml-5" : "text-muted-foreground"
                  )}>
                    {matchTime}
                  </span>

                  {/* Teams */}
                  <div className="flex-1 min-w-0 flex items-center gap-1 md:gap-2">
                    <div className="flex items-center gap-1 md:gap-1.5 flex-1 min-w-0">
                      {match.homeTeam.crest && (
                        <img src={match.homeTeam.crest} alt="" className="w-4 h-4 md:w-5 md:h-5 object-contain shrink-0" />
                      )}
                      <span className={cn("text-xs md:text-sm truncate", isThisLoading && "font-medium")}>
                        {match.homeTeam.shortName || match.homeTeam.name}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-[10px] md:text-xs">vs</span>
                    <div className="flex items-center gap-1 md:gap-1.5 flex-1 min-w-0 justify-end">
                      <span className={cn("text-xs md:text-sm truncate text-right", isThisLoading && "font-medium")}>
                        {match.awayTeam.shortName || match.awayTeam.name}
                      </span>
                      {match.awayTeam.crest && (
                        <img src={match.awayTeam.crest} alt="" className="w-4 h-4 md:w-5 md:h-5 object-contain shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* League badge shown for all items */}
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 shrink-0">
                    {match.competition.code}
                  </Badge>
                  <span className="text-[10px] md:text-xs text-muted-foreground shrink-0 hidden sm:block">
                    {match.competition.code}
                  </span>

                  {/* Arrow or Loading */}
                  {isThisLoading ? (
                    <span className="text-[10px] md:text-xs text-primary font-medium hidden sm:block">Analiz ediliyor...</span>
                  ) : (
                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground/50" />
                  )}
                </motion.div>
              </React.Fragment>
            );
          })}
        </div>
      </AnimatePresence>

      {/* Show More Button */}
      {otherMatches.length > 5 && !showAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(true)}
          className="w-full mt-3 text-primary text-xs md:text-sm"
        >
          Tümünü Gör (+{otherMatches.length - 5} maç)
        </Button>
      )}
    </Card>
  );
};

export default TodaysMatches;
