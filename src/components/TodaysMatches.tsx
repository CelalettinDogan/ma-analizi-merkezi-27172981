import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Match, SUPPORTED_COMPETITIONS, CompetitionCode } from '@/types/footballApi';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { staggerContainer, staggerItem } from '@/lib/animations';

interface TodaysMatchesProps {
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

const TodaysMatches: React.FC<TodaysMatchesProps> = ({ onMatchSelect }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchTodaysMatches = async () => {
      setIsLoading(true);
      const allMatches: Match[] = [];
      const today = new Date().toISOString().split('T')[0];

      // Fetch from first 3 leagues to avoid rate limiting
      const competitionsToFetch = SUPPORTED_COMPETITIONS.slice(0, 3);

      for (const comp of competitionsToFetch) {
        try {
          const { data, error } = await supabase.functions.invoke('football-api', {
            body: { 
              action: 'matches', 
              competitionCode: comp.code, 
              status: 'SCHEDULED',
              dateFrom: today,
              dateTo: today
            },
          });

          if (!error && data?.matches) {
            allMatches.push(...data.matches);
          }

          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 800));
        } catch (e) {
          console.error(`Error fetching matches for ${comp.code}:`, e);
        }
      }

      // Sort by time
      allMatches.sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
      setMatches(allMatches);
      setIsLoading(false);
    };

    fetchTodaysMatches();
  }, []);

  const displayedMatches = showAll ? matches : matches.slice(0, 6);
  const todayFormatted = format(new Date(), 'd MMMM yyyy', { locale: tr });

  if (isLoading) {
    return (
      <Card className="p-6 bg-card/50 border-border/50">
        <div className="flex items-center justify-center gap-2 py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Bugünün maçları yükleniyor...</span>
        </div>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className="p-6 bg-card/50 border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold text-lg">Bugünün Maçları</h2>
          <span className="text-sm text-muted-foreground">({todayFormatted})</span>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Bugün planlanmış maç bulunmuyor</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6 bg-card/50 border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold text-lg">Bugünün Maçları</h2>
          <Badge variant="secondary" className="text-xs">
            {matches.length} maç
          </Badge>
        </div>
        <span className="text-sm text-muted-foreground hidden sm:block">{todayFormatted}</span>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-2"
      >
        {displayedMatches.map((match) => {
          const matchTime = format(new Date(match.utcDate), 'HH:mm');
          const leagueCode = match.competition.code as CompetitionCode;
          const leagueColor = LEAGUE_COLORS[leagueCode] || 'bg-muted text-muted-foreground';

          return (
            <motion.div
              key={match.id}
              variants={staggerItem}
              onClick={() => onMatchSelect(match)}
              className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-primary/5 border border-border/30 hover:border-primary/30 cursor-pointer transition-all group"
            >
              {/* League Badge */}
              <Badge 
                variant="outline" 
                className={`text-[10px] px-1.5 py-0.5 shrink-0 ${leagueColor}`}
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
                <span className="text-muted-foreground text-xs px-1">vs</span>
                <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                  <span className="font-medium truncate text-sm text-right">
                    {match.awayTeam.shortName || match.awayTeam.name}
                  </span>
                  {match.awayTeam.crest && (
                    <img src={match.awayTeam.crest} alt="" className="w-5 h-5 object-contain shrink-0" />
                  )}
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                <Clock className="w-3 h-3" />
                <span className="text-xs font-medium">{matchTime}</span>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </motion.div>
          );
        })}
      </motion.div>

      {matches.length > 6 && !showAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(true)}
          className="w-full mt-3 text-primary hover:text-primary"
        >
          Tümünü Gör ({matches.length - 6} maç daha)
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      )}
    </Card>
  );
};

export default TodaysMatches;
