import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Match } from '@/types/footballApi';
import { cardTap } from '@/lib/animations';

interface LiveMatchCard2Props {
  match: Match;
  onClick?: () => void;
}

const LiveMatchCard2: React.FC<LiveMatchCard2Props> = ({ match, onClick }) => {
  const isHalfTime = match.status === 'PAUSED';
  const minute = match.status === 'IN_PLAY' 
    ? ((match as any).minute ? `${(match as any).minute}'` : "●") 
    : isHalfTime ? 'HT' : '';

  const homeScore = match.score.fullTime.home ?? 0;
  const awayScore = match.score.fullTime.away ?? 0;
  const homeName = match.homeTeam.shortName || match.homeTeam.name;
  const awayName = match.awayTeam.shortName || match.awayTeam.name;

  return (
    <motion.button
      whileTap={cardTap}
      onClick={onClick}
      aria-label={`${homeName} ${homeScore} - ${awayScore} ${awayName}, Canlı`}
      className={cn(
        "w-full max-w-full p-3.5 sm:p-4 rounded-2xl text-left transition-all duration-200 overflow-hidden",
        "bg-card border border-border/50 shadow-sm",
        "active:scale-[0.98] active:bg-muted/20"
      )}
    >
      {/* Live Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 bg-destructive rounded-full animate-ping opacity-40" />
            <span className="relative w-2 h-2 bg-destructive rounded-full block" />
          </span>
          <span className="text-micro font-semibold text-destructive uppercase tracking-wider">
            Canlı
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm flex-shrink-0">{match.competition.area?.flag || '🏆'}</span>
          <span className="text-micro text-muted-foreground max-w-[90px] truncate">
            {match.competition.name}
          </span>
        </div>
      </div>

      {/* Score Section */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {/* Home Team */}
        <div className="flex-1 text-center min-w-0">
          <div className="w-10 h-10 mx-auto mb-1.5 rounded-xl bg-muted/40 ring-1 ring-border/30 flex items-center justify-center overflow-hidden">
            {match.homeTeam.crest ? (
              <img src={match.homeTeam.crest} alt="" className="w-6 h-6 object-contain" />
            ) : (
              <span className="text-xs font-bold text-muted-foreground">{match.homeTeam.tla || 'H'}</span>
            )}
          </div>
          <p className="text-micro font-medium truncate px-0.5">
            {homeName}
          </p>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center flex-shrink-0" role="status" aria-live="polite">
          <div className="flex items-center gap-1.5">
            <motion.span
              key={`home-${homeScore}`}
              initial={{ scale: 1.4, color: 'hsl(var(--primary))' }}
              animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="text-2xl font-bold tabular-nums"
            >
              {homeScore}
            </motion.span>
            <span className="text-lg text-muted-foreground/60">-</span>
            <motion.span
              key={`away-${awayScore}`}
              initial={{ scale: 1.4, color: 'hsl(var(--primary))' }}
              animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="text-2xl font-bold tabular-nums"
            >
              {awayScore}
            </motion.span>
          </div>
          
          {/* Match Time */}
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="w-2.5 h-2.5 text-destructive/80" />
            <span className="text-micro font-semibold text-destructive/80">{minute}</span>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex-1 text-center min-w-0">
          <div className="w-10 h-10 mx-auto mb-1.5 rounded-xl bg-muted/40 ring-1 ring-border/30 flex items-center justify-center overflow-hidden">
            {match.awayTeam.crest ? (
              <img src={match.awayTeam.crest} alt="" className="w-6 h-6 object-contain" />
            ) : (
              <span className="text-xs font-bold text-muted-foreground">{match.awayTeam.tla || 'A'}</span>
            )}
          </div>
          <p className="text-micro font-medium truncate px-0.5">
            {awayName}
          </p>
        </div>
      </div>

      {/* Half Time Score Pill */}
      {match.score.halfTime.home !== null && (
        <div className="flex justify-center mb-2.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted/40 text-micro text-muted-foreground font-medium">
            İY {match.score.halfTime.home} - {match.score.halfTime.away}
          </span>
        </div>
      )}

      {/* CTA */}
      <div className="flex items-center justify-center pt-2.5 border-t border-border/20">
        <span className="inline-flex items-center gap-1.5 bg-primary/10 rounded-full px-3.5 py-1.5 shadow-sm">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">Hızlı Analiz</span>
        </span>
      </div>
    </motion.button>
  );
};

export default LiveMatchCard2;
