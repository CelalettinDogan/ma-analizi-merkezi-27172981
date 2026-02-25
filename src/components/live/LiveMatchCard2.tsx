import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Match } from '@/types/footballApi';
import { cardHover, cardTap } from '@/lib/animations';

interface LiveMatchCard2Props {
  match: Match;
  onClick?: () => void;
}

const LiveMatchCard2: React.FC<LiveMatchCard2Props> = ({ match, onClick }) => {
  const isHalfTime = match.status === 'PAUSED';
  const minute = match.status === 'IN_PLAY' 
    ? ((match as any).minute ? `${(match as any).minute}'` : "●") 
    : isHalfTime ? 'HT' : '';

  return (
    <motion.button
      whileHover={cardHover}
      whileTap={cardTap}
      onClick={onClick}
      className={cn(
        "w-full max-w-full p-3 sm:p-4 rounded-2xl text-left transition-all duration-300 overflow-hidden",
        "bg-gradient-to-br from-card via-card to-red-950/20",
        "border border-red-500/30 hover:border-red-500/50",
        "shadow-lg shadow-red-500/5 hover:shadow-red-500/10"
      )}
    >
      {/* Live Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative"
          >
            <span className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-50" />
            <span className="relative w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full block" />
          </motion.div>
          <span className="text-micro sm:text-xs font-semibold text-red-500 uppercase tracking-wider">
            Canlı
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="text-base sm:text-lg flex-shrink-0">{match.competition.area?.flag || '🏆'}</span>
          <span className="text-micro sm:text-xs text-muted-foreground max-w-[70px] sm:max-w-[100px] truncate">
            {match.competition.name}
          </span>
        </div>
      </div>

      {/* Score Section */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
        {/* Home Team */}
        <div className="flex-1 text-center min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-1.5 sm:mb-2 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden">
            {match.homeTeam.crest ? (
              <img src={match.homeTeam.crest} alt="" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
            ) : (
              <span className="text-xs sm:text-sm font-bold">{match.homeTeam.tla || 'H'}</span>
            )}
          </div>
          <p className="text-micro sm:text-sm font-medium truncate px-1">
            {match.homeTeam.shortName || match.homeTeam.name}
          </p>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <motion.span
              key={`home-${match.score.fullTime.home}`}
              initial={{ scale: 1.5, color: 'hsl(var(--primary))' }}
              animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
              className="text-2xl sm:text-3xl font-bold tabular-nums"
            >
              {match.score.fullTime.home ?? 0}
            </motion.span>
            <span className="text-lg sm:text-xl text-muted-foreground">-</span>
            <motion.span
              key={`away-${match.score.fullTime.away}`}
              initial={{ scale: 1.5, color: 'hsl(var(--primary))' }}
              animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
              className="text-2xl sm:text-3xl font-bold tabular-nums"
            >
              {match.score.fullTime.away ?? 0}
            </motion.span>
          </div>
          
          {/* Match Time */}
          <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-500" />
            <span className="text-micro sm:text-xs font-medium text-red-500">{minute}</span>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex-1 text-center min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-1.5 sm:mb-2 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden">
            {match.awayTeam.crest ? (
              <img src={match.awayTeam.crest} alt="" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
            ) : (
              <span className="text-xs sm:text-sm font-bold">{match.awayTeam.tla || 'A'}</span>
            )}
          </div>
          <p className="text-micro sm:text-sm font-medium truncate px-1">
            {match.awayTeam.shortName || match.awayTeam.name}
          </p>
        </div>
      </div>

      {/* Half Time Score */}
      {match.score.halfTime.home !== null && (
        <div className="text-center text-micro sm:text-xs text-muted-foreground mb-2 sm:mb-3">
          İY: {match.score.halfTime.home} - {match.score.halfTime.away}
        </div>
      )}

      {/* Action */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-2.5 sm:pt-3 border-t border-border/30">
        <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
        <span className="text-xs sm:text-sm font-medium text-primary">Hızlı Analiz</span>
      </div>
    </motion.button>
  );
};

export default LiveMatchCard2;
