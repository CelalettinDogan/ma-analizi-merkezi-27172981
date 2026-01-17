import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronRight, Star, Loader2, Clock, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Match } from '@/types/footballApi';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TodaysMatchesProps {
  matches: Match[];
  isLoading?: boolean;
  loadingMatchId?: number | null;
  onMatchSelect: (match: Match) => void;
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

// Stagger animation for list items
const listItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3 }
  })
};

const TodaysMatches: React.FC<TodaysMatchesProps> = ({ matches, isLoading = false, loadingMatchId, onMatchSelect }) => {
  const [showAll, setShowAll] = useState(false);

  // Find featured match (first big match or soonest upcoming match)
  const { featuredMatch, otherMatches, featuredReason } = useMemo(() => {
    if (matches.length === 0) return { featuredMatch: null, otherMatches: [], featuredReason: '' };
    
    const bigMatch = matches.find(isBigMatch);
    const featured = bigMatch || matches[0];
    const others = matches.filter(m => m.id !== featured?.id);
    const reason = getFeaturedReason(featured, matches);
    
    return { featuredMatch: featured, otherMatches: others, featuredReason: reason };
  }, [matches]);

  const displayedMatches = showAll ? otherMatches : otherMatches.slice(0, 5);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Bugünün Maçları</h2>
        </div>
        {/* Skeleton loading */}
        <div className="space-y-3">
          <div className="h-32 rounded-xl bg-muted/50 animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted/30 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Bugünün Maçları</h2>
        </div>
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">Bugün planlanmış maç yok</p>
          <p className="text-sm text-muted-foreground mt-1">Yaklaşan maçlar için bir lig seçin</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Bugünün Maçları</h2>
        </div>
        <Badge variant="secondary">{matches.length} maç</Badge>
      </div>

      {/* Featured Match - Large Card */}
      {featuredMatch && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => !loadingMatchId && onMatchSelect(featuredMatch)}
          className={cn(
            "relative p-4 rounded-xl cursor-pointer mb-4 transition-all group",
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
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="text-sm font-medium text-foreground">Analiz ediliyor...</span>
              </div>
            </motion.div>
          )}

          {/* Featured Label with reason */}
          <div className="absolute top-2 left-2 flex items-center gap-2">
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
          </div>

          {/* Match Content */}
          <div className="flex items-center justify-between mt-6">
            {/* Home Team */}
            <div className="flex items-center gap-3 flex-1">
              {featuredMatch.homeTeam.crest ? (
                <img 
                  src={featuredMatch.homeTeam.crest} 
                  alt="" 
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                  {featuredMatch.homeTeam.shortName?.[0] || featuredMatch.homeTeam.name[0]}
                </div>
              )}
              <span className="font-semibold truncate">
                {featuredMatch.homeTeam.shortName || featuredMatch.homeTeam.name}
              </span>
            </div>

            {/* Time */}
            <div className="px-4 text-center">
              <div className="text-lg font-bold text-primary">
                {format(new Date(featuredMatch.utcDate), 'HH:mm')}
              </div>
              <div className="text-xs text-muted-foreground">
                {featuredMatch.competition.code}
              </div>
            </div>

            {/* Away Team */}
            <div className="flex items-center gap-3 flex-1 justify-end">
              <span className="font-semibold truncate text-right">
                {featuredMatch.awayTeam.shortName || featuredMatch.awayTeam.name}
              </span>
              {featuredMatch.awayTeam.crest ? (
                <img 
                  src={featuredMatch.awayTeam.crest} 
                  alt="" 
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                  {featuredMatch.awayTeam.shortName?.[0] || featuredMatch.awayTeam.name[0]}
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="flex justify-center mt-4">
            <Button 
              size="sm" 
              className="gap-2 group-hover:bg-primary/90"
              disabled={!!loadingMatchId}
            >
              {loadingMatchId === featuredMatch.id ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                <>
                  Analiz Et
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
          {displayedMatches.map((match, index) => {
            const matchTime = format(new Date(match.utcDate), 'HH:mm');
            const isThisLoading = loadingMatchId === match.id;
            const isAnyLoading = !!loadingMatchId;

            return (
              <motion.div
                key={match.id}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={listItemVariants}
                whileHover={!isAnyLoading ? { x: 4, backgroundColor: 'hsl(var(--muted) / 0.5)' } : {}}
                onClick={() => !isAnyLoading && onMatchSelect(match)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-all relative",
                  "min-h-[48px]",
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
                    className="absolute left-3"
                  >
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </motion.div>
                )}

                {/* Time */}
                <span className={cn(
                  "text-sm font-medium w-12 shrink-0",
                  isThisLoading ? "text-primary ml-5" : "text-muted-foreground"
                )}>
                  {matchTime}
                </span>

                {/* Teams */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {match.homeTeam.crest && (
                      <img src={match.homeTeam.crest} alt="" className="w-5 h-5 object-contain shrink-0" />
                    )}
                    <span className={cn("text-sm truncate", isThisLoading && "font-medium")}>
                      {match.homeTeam.shortName || match.homeTeam.name}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">vs</span>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    <span className={cn("text-sm truncate text-right", isThisLoading && "font-medium")}>
                      {match.awayTeam.shortName || match.awayTeam.name}
                    </span>
                    {match.awayTeam.crest && (
                      <img src={match.awayTeam.crest} alt="" className="w-5 h-5 object-contain shrink-0" />
                    )}
                  </div>
                </div>

                {/* League */}
                <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                  {match.competition.code}
                </span>

                {/* Arrow or Loading */}
                {isThisLoading ? (
                  <span className="text-xs text-primary font-medium">Analiz ediliyor...</span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                )}
              </motion.div>
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
          className="w-full mt-3 text-primary"
        >
          Tümünü Gör (+{otherMatches.length - 5} maç)
        </Button>
      )}
    </Card>
  );
};

export default TodaysMatches;
