import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { getDateLocale } from '@/i18n/dateLocale';
import { useTranslation } from 'react-i18next';
import { Match } from '@/types/footballApi';
import { cardTap } from '@/lib/animations';

interface Props {
  match: Match;
  onClick?: () => void;
}

const UpcomingWCCard: React.FC<Props> = ({ match, onClick }) => {
  const { t } = useTranslation('common');
  const locale = getDateLocale();
  const home = match.homeTeam.shortName || match.homeTeam.name;
  const away = match.awayTeam.shortName || match.awayTeam.name;

  return (
    <motion.button
      whileTap={cardTap}
      onClick={onClick}
      className="w-full p-4 rounded-2xl bg-card border border-border/40 text-left active:bg-muted/15 touch-manipulation transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {format(new Date(match.utcDate), 'd MMM • HH:mm', { locale })}
        </span>
        {(match as any).stage && (
          <span className="text-[10px] font-bold text-primary/70 uppercase">
            {(match as any).stage}
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex flex-col items-center gap-1.5 min-w-0">
          {match.homeTeam.crest ? (
            <img src={match.homeTeam.crest} alt="" className="w-9 h-9 object-contain" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-muted/30" />
          )}
          <span className="text-xs font-bold text-foreground truncate w-full text-center">{home}</span>
        </div>

        <div className="flex flex-col items-center px-2">
          <span className="text-[11px] font-bold text-muted-foreground/60 tracking-wider">VS</span>
        </div>

        <div className="flex flex-col items-center gap-1.5 min-w-0">
          {match.awayTeam.crest ? (
            <img src={match.awayTeam.crest} alt="" className="w-9 h-9 object-contain" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-muted/30" />
          )}
          <span className="text-xs font-bold text-foreground truncate w-full text-center">{away}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border/20 flex justify-end">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary">
          {t('wc.viewDetails')} <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </motion.button>
  );
};

export default UpcomingWCCard;
