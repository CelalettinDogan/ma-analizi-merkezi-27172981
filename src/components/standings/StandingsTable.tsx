import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { CachedStanding } from '@/pages/Standings';

interface StandingsTableProps {
  standings: CachedStanding[];
}

const getPositionIndicator = (position: number, total: number) => {
  if (position <= 4) return 'bg-primary'; // UCL
  if (position <= 6) return 'bg-blue-500'; // UEL
  if (position === 7) return 'bg-cyan-500'; // UECL
  if (position > total - 3) return 'bg-destructive'; // Relegation
  return 'bg-transparent';
};

const getFormIcon = (result: string) => {
  const r = result.trim().toUpperCase();
  switch (r) {
    case 'W': return <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold">G</span>;
    case 'D': return <span className="w-5 h-5 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-[10px] font-bold">B</span>;
    case 'L': return <span className="w-5 h-5 rounded-full bg-destructive/15 text-destructive flex items-center justify-center text-[10px] font-bold">M</span>;
    default: return <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px]">-</span>;
  }
};

const StandingsTable: React.FC<StandingsTableProps> = ({ standings }) => {
  const total = standings.length;

  return (
    <div className="space-y-1.5">
      {/* Column headers */}
      <div className="flex items-center px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        <span className="w-7 text-center">#</span>
        <span className="flex-1 ml-2">Takım</span>
        <span className="w-7 text-center">O</span>
        <span className="w-7 text-center hidden xs:block">G</span>
        <span className="w-7 text-center hidden xs:block">B</span>
        <span className="w-7 text-center hidden xs:block">M</span>
        <span className="w-8 text-center">Av</span>
        <span className="w-9 text-center">P</span>
        <span className="w-[88px] text-center hidden sm:block">Form</span>
      </div>

      {/* Team rows */}
      {standings.map((team, index) => (
        <motion.div
          key={team.team_id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.015, duration: 0.25 }}
          className={cn(
            "flex items-center px-3 py-3 rounded-xl",
            "bg-card border border-border/30",
            "active:scale-[0.99] transition-transform touch-manipulation"
          )}
        >
          {/* Position with color indicator */}
          <div className="w-7 flex items-center justify-center gap-1">
            <div className={cn("w-[3px] h-5 rounded-full", getPositionIndicator(team.position, total))} />
            <span className={cn(
              "text-xs font-bold tabular-nums",
              team.position <= 4 ? "text-primary" : 
              team.position > total - 3 ? "text-destructive" : 
              "text-muted-foreground"
            )}>
              {team.position}
            </span>
          </div>

          {/* Team info */}
          <div className="flex-1 flex items-center gap-2.5 ml-2 min-w-0">
            {team.team_crest && (
              <img 
                src={team.team_crest} 
                alt={team.team_name}
                className="w-7 h-7 object-contain flex-shrink-0"
              />
            )}
            <span className="text-sm font-medium truncate">
              {team.team_short_name || team.team_name}
            </span>
          </div>

          {/* Stats */}
          <span className="w-7 text-center text-xs text-muted-foreground tabular-nums">{team.played_games}</span>
          <span className="w-7 text-center text-xs text-primary font-medium tabular-nums hidden xs:block">{team.won}</span>
          <span className="w-7 text-center text-xs text-muted-foreground tabular-nums hidden xs:block">{team.draw}</span>
          <span className="w-7 text-center text-xs text-destructive/70 tabular-nums hidden xs:block">{team.lost}</span>
          <span className={cn(
            "w-8 text-center text-xs font-medium tabular-nums",
            team.goal_difference > 0 ? "text-primary" : team.goal_difference < 0 ? "text-destructive" : "text-muted-foreground"
          )}>
            {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
          </span>

          {/* Points - prominent */}
          <span className="w-9 text-center text-sm font-bold text-primary tabular-nums">
            {team.points}
          </span>

          {/* Form badges */}
          <div className="w-[88px] items-center justify-center gap-0.5 hidden sm:flex">
            {team.form ? (
              team.form.split(',').slice(0, 5).map((result, i) => (
                <React.Fragment key={i}>{getFormIcon(result)}</React.Fragment>
              ))
            ) : (
              <span className="text-[10px] text-muted-foreground">—</span>
            )}
          </div>
        </motion.div>
      ))}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-3 px-1 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-[3px] h-3 rounded-full bg-primary" />
          <span>Şampiyonlar Ligi</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-[3px] h-3 rounded-full bg-blue-500" />
          <span>Avrupa Ligi</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-[3px] h-3 rounded-full bg-cyan-500" />
          <span>Konferans Ligi</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-[3px] h-3 rounded-full bg-destructive" />
          <span>Düşme Hattı</span>
        </div>
      </div>
    </div>
  );
};

export default StandingsTable;
