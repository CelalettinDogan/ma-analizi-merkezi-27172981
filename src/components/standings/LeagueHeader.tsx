import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock } from 'lucide-react';
import { SUPPORTED_COMPETITIONS, CompetitionCode } from '@/types/footballApi';
import { fadeInUp } from '@/lib/animations';

interface LeagueHeaderProps {
  competitionName: string;
  selectedLeague: CompetitionCode;
  lastUpdated: string | null;
  hasData: boolean;
}

const LeagueHeader: React.FC<LeagueHeaderProps> = ({
  competitionName,
  selectedLeague,
  lastUpdated,
  hasData,
}) => {
  const league = SUPPORTED_COMPETITIONS.find(c => c.code === selectedLeague);

  if (!hasData) return null;

  return (
    <motion.div {...fadeInUp}>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-card to-card border border-border/40">
        {/* Subtle gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary/30 to-transparent" />
        
        <div className="p-4 flex items-center gap-3.5">
          {/* League Icon */}
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">{league?.flag}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-base leading-tight truncate">
              {competitionName}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              2024/25 Sezonu
            </p>
            {lastUpdated && (
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-muted-foreground/60" />
                <span className="text-[10px] text-muted-foreground/60">
                  {new Date(lastUpdated).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>

          {/* Trophy decoration */}
          <Trophy className="w-5 h-5 text-primary/25 flex-shrink-0" />
        </div>
      </div>
    </motion.div>
  );
};

export default LeagueHeader;
