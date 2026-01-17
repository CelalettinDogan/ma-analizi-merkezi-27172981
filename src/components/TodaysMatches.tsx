import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Star, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Match, CompetitionCode } from '@/types/footballApi';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TodaysMatchesProps {
  matches: Match[];
  isLoading?: boolean;
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

const TodaysMatches: React.FC<TodaysMatchesProps> = ({ matches, isLoading = false, onMatchSelect }) => {
  const [showAll, setShowAll] = useState(false);

  // Find featured match (first big match or first match)
  const { featuredMatch, otherMatches } = useMemo(() => {
    const bigMatch = matches.find(isBigMatch);
    const featured = bigMatch || matches[0];
    const others = matches.filter(m => m.id !== featured?.id);
    return { featuredMatch: featured, otherMatches: others };
  }, [matches]);

  const displayedMatches = showAll ? otherMatches : otherMatches.slice(0, 5);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-3 py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Maçlar yükleniyor...</span>
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
          onClick={() => onMatchSelect(featuredMatch)}
          className={cn(
            "relative p-4 rounded-xl cursor-pointer mb-4 transition-all group",
            "bg-primary/5 border-2 border-primary/20 hover:border-primary/40"
          )}
        >
          {/* Featured Label */}
          <div className="absolute top-2 left-2">
            <Badge className="bg-secondary text-secondary-foreground text-[10px]">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Önerilen
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
            <Button size="sm" className="gap-2">
              Analiz Et
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Other Matches - Compact List */}
      <div className="space-y-1">
        {displayedMatches.map((match) => {
          const matchTime = format(new Date(match.utcDate), 'HH:mm');

          return (
            <motion.div
              key={match.id}
              whileHover={{ x: 4 }}
              onClick={() => onMatchSelect(match)}
              className={cn(
                "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all",
                "hover:bg-muted/50"
              )}
            >
              {/* Time */}
              <span className="text-sm font-medium text-muted-foreground w-12 shrink-0">
                {matchTime}
              </span>

              {/* Teams */}
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {match.homeTeam.crest && (
                    <img src={match.homeTeam.crest} alt="" className="w-4 h-4 object-contain shrink-0" />
                  )}
                  <span className="text-sm truncate">
                    {match.homeTeam.shortName || match.homeTeam.name}
                  </span>
                </div>
                <span className="text-muted-foreground text-xs">vs</span>
                <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                  <span className="text-sm truncate text-right">
                    {match.awayTeam.shortName || match.awayTeam.name}
                  </span>
                  {match.awayTeam.crest && (
                    <img src={match.awayTeam.crest} alt="" className="w-4 h-4 object-contain shrink-0" />
                  )}
                </div>
              </div>

              {/* League */}
              <span className="text-xs text-muted-foreground shrink-0">
                {match.competition.code}
              </span>

              {/* Arrow */}
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </motion.div>
          );
        })}
      </div>

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
