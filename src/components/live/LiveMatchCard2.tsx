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
  const minute = match.status === 'IN_PLAY' ? "90'" : isHalfTime ? 'HT' : '';

  return (
    <motion.button
      whileHover={cardHover}
      whileTap={cardTap}
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-2xl text-left transition-all duration-300",
        "bg-gradient-to-br from-card via-card to-red-950/20",
        "border border-red-500/30 hover:border-red-500/50",
        "shadow-lg shadow-red-500/5 hover:shadow-red-500/10"
      )}
    >
      {/* Live Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative"
          >
            <span className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-50" />
            <span className="relative w-2.5 h-2.5 bg-red-500 rounded-full block" />
          </motion.div>
          <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">
            Canlı
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-lg">{match.competition.area?.flag || '🏆'}</span>
          <span className="text-xs text-muted-foreground max-w-[100px] truncate">
            {match.competition.name}
          </span>
        </div>
      </div>

      {/* Score Section */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Home Team */}
        <div className="flex-1 text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden">
            {match.homeTeam.crest ? (
              <img src={match.homeTeam.crest} alt="" className="w-8 h-8 object-contain" />
            ) : (
              <span className="text-sm font-bold">{match.homeTeam.tla || 'H'}</span>
            )}
          </div>
          <p className="text-sm font-medium truncate">
            {match.homeTeam.shortName || match.homeTeam.name}
          </p>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <motion.span
              key={`home-${match.score.fullTime.home}`}
              initial={{ scale: 1.5, color: 'hsl(var(--primary))' }}
              animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
              className="text-3xl font-bold tabular-nums"
            >
              {match.score.fullTime.home ?? 0}
            </motion.span>
            <span className="text-xl text-muted-foreground">-</span>
            <motion.span
              key={`away-${match.score.fullTime.away}`}
              initial={{ scale: 1.5, color: 'hsl(var(--primary))' }}
              animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
              className="text-3xl font-bold tabular-nums"
            >
              {match.score.fullTime.away ?? 0}
            </motion.span>
          </div>
          
          {/* Match Time */}
          <div className="flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3 text-red-500" />
            <span className="text-xs font-medium text-red-500">{minute}</span>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex-1 text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden">
            {match.awayTeam.crest ? (
              <img src={match.awayTeam.crest} alt="" className="w-8 h-8 object-contain" />
            ) : (
              <span className="text-sm font-bold">{match.awayTeam.tla || 'A'}</span>
            )}
          </div>
          <p className="text-sm font-medium truncate">
            {match.awayTeam.shortName || match.awayTeam.name}
          </p>
        </div>
      </div>

      {/* Half Time Score */}
      {match.score.halfTime.home !== null && (
        <div className="text-center text-xs text-muted-foreground mb-3">
          İY: {match.score.halfTime.home} - {match.score.halfTime.away}
        </div>
      )}

      {/* Action */}
      <div className="flex items-center justify-center gap-2 pt-3 border-t border-border/30">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary">Hızlı Analiz</span>
      </div>
    </motion.button>
  );
};

export default LiveMatchCard2;
