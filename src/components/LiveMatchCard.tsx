import React from 'react';
import { Match } from '@/types/footballApi';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Radio, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveMatchCardProps {
  match: Match;
  onClick?: () => void;
}

const LiveMatchCard: React.FC<LiveMatchCardProps> = ({ match, onClick }) => {
  const isInPlay = match.status === 'IN_PLAY';
  const isPaused = match.status === 'PAUSED';
  const isLive = isInPlay || isPaused;

  const getMatchMinute = () => {
    // Calculate approximate minute based on match start time
    const matchStart = new Date(match.utcDate);
    const now = new Date();
    const diffMs = now.getTime() - matchStart.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins <= 45) {
      return `${diffMins}'`;
    } else if (diffMins > 45 && diffMins <= 60) {
      return "HT"; // Half time
    } else if (diffMins > 60 && diffMins <= 105) {
      return `${diffMins - 15}'`; // Account for half-time break
    } else {
      return "90+";
    }
  };

  const getStatusBadge = () => {
    if (isInPlay) {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse gap-1">
          <Radio className="w-3 h-3" />
          CANLI
        </Badge>
      );
    }
    if (isPaused) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-1">
          <Clock className="w-3 h-3" />
          DEVRE ARASI
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all cursor-pointer hover:scale-[1.02]",
        isLive && "ring-2 ring-red-500/50 bg-gradient-to-br from-red-500/10 to-transparent"
      )}
      onClick={onClick}
    >
      {/* Live indicator pulse */}
      {isLive && (
        <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12">
          <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
          <div className="absolute inset-0 bg-red-500/10 rounded-full" />
        </div>
      )}

      <div className="p-4">
        {/* Header with status and minute */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {match.competition.emblem && (
              <img 
                src={match.competition.emblem} 
                alt={match.competition.name}
                className="w-5 h-5 object-contain"
              />
            )}
            <span className="text-xs text-muted-foreground">
              {match.competition.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="text-lg font-bold text-red-400">
                {getMatchMinute()}
              </span>
            )}
            {getStatusBadge()}
          </div>
        </div>

        {/* Teams and Score */}
        <div className="flex items-center justify-between gap-4">
          {/* Home Team */}
          <div className="flex-1 text-center">
            {match.homeTeam.crest && (
              <img 
                src={match.homeTeam.crest} 
                alt={match.homeTeam.name}
                className="w-12 h-12 mx-auto mb-2 object-contain"
              />
            )}
            <p className="font-semibold text-sm truncate">
              {match.homeTeam.shortName || match.homeTeam.name}
            </p>
          </div>

          {/* Score */}
          <div className="flex items-center gap-2">
            <div className={cn(
              "text-3xl font-bold min-w-[40px] text-center",
              isLive && "text-foreground"
            )}>
              {match.score.fullTime.home ?? 0}
            </div>
            <span className="text-muted-foreground text-xl">-</span>
            <div className={cn(
              "text-3xl font-bold min-w-[40px] text-center",
              isLive && "text-foreground"
            )}>
              {match.score.fullTime.away ?? 0}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex-1 text-center">
            {match.awayTeam.crest && (
              <img 
                src={match.awayTeam.crest} 
                alt={match.awayTeam.name}
                className="w-12 h-12 mx-auto mb-2 object-contain"
              />
            )}
            <p className="font-semibold text-sm truncate">
              {match.awayTeam.shortName || match.awayTeam.name}
            </p>
          </div>
        </div>

        {/* Half-time score if available */}
        {match.score.halfTime.home !== null && (
          <div className="mt-3 pt-3 border-t border-border/50 text-center">
            <span className="text-xs text-muted-foreground">
              İlk Yarı: {match.score.halfTime.home} - {match.score.halfTime.away}
            </span>
          </div>
        )}

        {/* Live indicator bar */}
        {isLive && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-red-400">
            <Activity className="w-3 h-3 animate-pulse" />
            <span>Canlı yayın</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default LiveMatchCard;
