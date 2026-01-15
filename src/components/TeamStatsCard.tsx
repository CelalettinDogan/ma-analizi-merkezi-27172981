import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TeamStats } from '@/types/match';

interface TeamStatsCardProps {
  teamName: string;
  stats: TeamStats;
  isHome?: boolean;
}

const FormIcon: React.FC<{ result: string }> = ({ result }) => {
  switch (result) {
    case 'W':
      return <span className="w-6 h-6 rounded-full bg-win/20 text-win flex items-center justify-center text-xs font-bold">G</span>;
    case 'L':
      return <span className="w-6 h-6 rounded-full bg-loss/20 text-loss flex items-center justify-center text-xs font-bold">M</span>;
    case 'D':
      return <span className="w-6 h-6 rounded-full bg-draw/20 text-draw flex items-center justify-center text-xs font-bold">B</span>;
    default:
      return null;
  }
};

const TeamStatsCard: React.FC<TeamStatsCardProps> = ({ teamName, stats, isHome = true }) => {
  const performance = isHome ? stats.homePerformance : stats.awayPerformance;
  const avgGoalsScored = stats.goalsScored / 5;
  const avgGoalsConceded = stats.goalsConceded / 5;

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-display font-bold text-foreground">{teamName}</h3>
        <span className={`prediction-badge ${isHome ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
          {isHome ? 'Ev Sahibi' : 'Deplasman'}
        </span>
      </div>

      {/* Son 5 Maç Formu */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-3">Son 5 Maç</p>
        <div className="flex gap-2">
          {stats.form.map((result, index) => (
            <FormIcon key={index} result={result} />
          ))}
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-win" />
            <span className="text-xs text-muted-foreground">Atılan Gol Ort.</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{avgGoalsScored.toFixed(1)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-loss" />
            <span className="text-xs text-muted-foreground">Yenilen Gol Ort.</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{avgGoalsConceded.toFixed(1)}</p>
        </div>
      </div>

      {/* Performans */}
      {performance && (
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">
            {isHome ? 'Ev Sahibi' : 'Deplasman'} Performansı
          </p>
          <div className="flex justify-between">
            <div className="text-center">
              <p className="text-lg font-bold text-win">{performance.wins}</p>
              <p className="text-xs text-muted-foreground">Galibiyet</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-draw">{performance.draws}</p>
              <p className="text-xs text-muted-foreground">Beraberlik</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-loss">{performance.losses}</p>
              <p className="text-xs text-muted-foreground">Mağlubiyet</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamStatsCard;
