import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, ChevronRight, Flame, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Match, CompetitionCode } from '@/types/footballApi';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface TodaysMatchesProps {
  matches: Match[];
  isLoading?: boolean;
  onMatchSelect: (match: Match) => void;
}

const LEAGUE_COLORS: Record<CompetitionCode, string> = {
  PL: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  BL1: 'bg-red-500/20 text-red-400 border-red-500/30',
  PD: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  SA: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  FL1: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  CL: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
};

const HOT_TEAMS = ['Arsenal', 'Liverpool', 'Barcelona', 'Real Madrid', 'Bayern', 'PSG', 'Manchester City', 'Manchester United'];

const isHotMatch = (match: Match): boolean => {
  const home = match.homeTeam.name.toLowerCase();
  const away = match.awayTeam.name.toLowerCase();
  return HOT_TEAMS.some(team => 
    home.includes(team.toLowerCase()) || away.includes(team.toLowerCase())
  );
};

const TodaysMatches: React.FC<TodaysMatchesProps> = ({ matches, isLoading = false, onMatchSelect }) => {
  const [showAll, setShowAll] = useState(false);

  // Group matches by hour
  const groupedMatches = matches.reduce((groups, match) => {
    const hour = format(new Date(match.utcDate), 'HH:00');
    if (!groups[hour]) {
      groups[hour] = [];
    }
    groups[hour].push(match);
    return groups;
  }, {} as Record<string, Match[]>);

  const timeSlots = Object.keys(groupedMatches).sort();
  const displayedTimeSlots = showAll ? timeSlots : timeSlots.slice(0, 3);
  const todayFormatted = format(new Date(), 'd MMMM yyyy, EEEE', { locale: tr });

  if (isLoading) {
    return (
      <Card className="p-6 glass-card">
        <div className="flex items-center justify-center gap-3 py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Bugünün maçları yükleniyor...</span>
        </div>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className="p-6 glass-card">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold text-lg">Bugünün Maçları</h2>
        </div>
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-2">Bugün planlanmış maç bulunmuyor</p>
          <p className="text-sm text-muted-foreground">Yaklaşan maçlar için bir lig seçin</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6 glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">Bugünün Maçları</h2>
            <p className="text-xs text-muted-foreground">{todayFormatted}</p>
          </div>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20">
          {matches.length} maç
        </Badge>
      </div>

      {/* Timeline View */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {displayedTimeSlots.map((timeSlot) => (
          <motion.div key={timeSlot} variants={staggerItem} className="relative">
            {/* Time Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-semibold text-foreground">{timeSlot}</span>
              </div>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            {/* Matches in this time slot */}
            <div className="space-y-2 pl-2">
              {groupedMatches[timeSlot].map((match) => {
                const matchTime = format(new Date(match.utcDate), 'HH:mm');
                const leagueCode = match.competition.code as CompetitionCode;
                const leagueColor = LEAGUE_COLORS[leagueCode] || 'bg-muted text-muted-foreground';
                const isHot = isHotMatch(match);

                return (
                  <motion.div
                    key={match.id}
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onMatchSelect(match)}
                    className={cn(
                      "relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group",
                      "bg-background/50 hover:bg-primary/5 border border-border/30 hover:border-primary/30",
                      isHot && "border-secondary/30 bg-secondary/5"
                    )}
                  >
                    {/* Hot Match Indicator */}
                    {isHot && (
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-gradient-to-b from-secondary to-orange-500" />
                    )}

                    {/* League Badge */}
                    <Badge 
                      variant="outline" 
                      className={cn("text-[10px] px-1.5 py-0.5 shrink-0", leagueColor)}
                    >
                      {match.competition.code}
                    </Badge>

                    {/* Teams */}
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {match.homeTeam.crest && (
                          <img src={match.homeTeam.crest} alt="" className="w-5 h-5 object-contain shrink-0" />
                        )}
                        <span className="font-medium truncate text-sm">
                          {match.homeTeam.shortName || match.homeTeam.name}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-xs px-2 py-0.5 rounded bg-muted/30">vs</span>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                        <span className="font-medium truncate text-sm text-right">
                          {match.awayTeam.shortName || match.awayTeam.name}
                        </span>
                        {match.awayTeam.crest && (
                          <img src={match.awayTeam.crest} alt="" className="w-5 h-5 object-contain shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isHot && (
                        <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30 text-[10px] px-1.5 py-0 gap-1">
                          <Flame className="w-3 h-3" />
                          Sıcak
                        </Badge>
                      )}
                      
                      {/* Time */}
                      <span className="text-xs font-medium text-muted-foreground">{matchTime}</span>

                      {/* Arrow */}
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Show More Button */}
      {timeSlots.length > 3 && !showAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(true)}
          className="w-full mt-6 text-primary hover:text-primary gap-2"
        >
          <span>Tümünü Gör</span>
          <Badge variant="secondary" className="text-xs">
            +{timeSlots.length - 3} saat dilimi
          </Badge>
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </Card>
  );
};

export default TodaysMatches;
