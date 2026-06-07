import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface WCStandingRow {
  position: number;
  team_name: string;
  team_short_name: string | null;
  team_tla: string | null;
  team_crest: string | null;
  played_games: number;
  goal_difference: number;
  points: number;
}

interface Props {
  groupLabel: string;
  rows: WCStandingRow[];
}

const WCStandingsCard: React.FC<Props> = ({ groupLabel, rows }) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const top4 = rows.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl bg-card border border-border/40 overflow-hidden"
    >
      <button
        onClick={() => navigate('/standings')}
        className="w-full px-4 py-3 border-b border-border/30 flex justify-between items-center active:bg-muted/20 transition-colors touch-manipulation"
      >
        <h3 className="text-xs font-bold text-foreground">
          {t('wc.standings.title', { group: groupLabel })}
        </h3>
        <span className="text-[10px] font-semibold text-primary inline-flex items-center gap-0.5">
          {t('wc.standings.fullTable')}
          <ChevronRight className="w-3 h-3" />
        </span>
      </button>

      {top4.length === 0 ? (
        <div className="px-4 py-6 text-center text-[11px] text-muted-foreground/70">
          {t('wc.standings.empty')}
        </div>
      ) : (
        <table className="w-full text-[11px]">
          <thead className="bg-muted/20 text-muted-foreground font-bold uppercase tracking-wider">
            <tr>
              <th className="py-2 pl-4 text-left w-8">#</th>
              <th className="py-2 px-2 text-left">{t('wc.standings.team')}</th>
              <th className="py-2 px-2 text-center w-7">P</th>
              <th className="py-2 px-2 text-center w-9">GD</th>
              <th className="py-2 pr-4 text-center w-9">PTS</th>
            </tr>
          </thead>
          <tbody>
            {top4.map((row, idx) => {
              const isLeader = idx === 0;
              const qualifies = idx < 2;
              return (
                <tr
                  key={row.position}
                  className={cn(
                    'border-t border-border/20',
                    isLeader && 'bg-primary/[0.06]'
                  )}
                >
                  <td className={cn(
                    'py-2.5 pl-4 font-bold tabular-nums',
                    qualifies ? 'text-primary' : 'text-muted-foreground/60'
                  )}>
                    {row.position}
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {row.team_crest ? (
                        <img src={row.team_crest} alt="" className="w-4 h-4 object-contain shrink-0" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-muted/40 shrink-0" />
                      )}
                      <span className="font-semibold truncate text-foreground">
                        {row.team_tla || row.team_short_name || row.team_name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center tabular-nums text-muted-foreground">{row.played_games}</td>
                  <td className="py-2.5 px-2 text-center tabular-nums text-muted-foreground">
                    {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
                  </td>
                  <td className="py-2.5 pr-4 text-center font-black tabular-nums text-foreground">
                    {row.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </motion.div>
  );
};

export default WCStandingsCard;
