import React from 'react';
import { motion } from 'framer-motion';
import { Target, Shield, TrendingUp, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StandingData {
  team_name: string;
  team_short_name: string | null;
  team_crest: string | null;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  played_games: number;
}

interface GoalStatsTabProps {
  standings: StandingData[];
  isLoading?: boolean;
}

const GoalStatsTab: React.FC<GoalStatsTabProps> = ({ standings, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border/30 bg-card p-4 space-y-3">
            <div className="h-4 w-28 bg-muted/50 rounded animate-pulse" />
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-muted/50 rounded-full animate-pulse" />
                <div className="flex-1 h-3 bg-muted/50 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  const topScorers = [...standings].sort((a, b) => b.goals_for - a.goals_for).slice(0, 5);
  const bestDefense = [...standings].sort((a, b) => a.goals_against - b.goals_against).slice(0, 5);
  const bestDifference = [...standings].sort((a, b) => b.goal_difference - a.goal_difference).slice(0, 5);
  const goalsPerMatch = [...standings]
    .map(team => ({ ...team, avgGoals: team.played_games > 0 ? (team.goals_for / team.played_games) : 0 }))
    .sort((a, b) => b.avgGoals - a.avgGoals)
    .slice(0, 5);

  const renderTeamRow = (team: StandingData, index: number, value: string | number, maxValue: number, color: string) => (
    <motion.div
      key={team.team_name}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-3 py-1"
    >
      <span className="text-[10px] font-bold text-muted-foreground w-4 text-center">{index + 1}</span>
      {team.team_crest && <img src={team.team_crest} alt="" className="w-6 h-6 object-contain flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{team.team_short_name || team.team_name}</p>
        <div className="w-full bg-muted/20 rounded-full h-1 mt-1">
          <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${(Number(value) / maxValue) * 100}%` }} />
        </div>
      </div>
      <span className="text-sm font-bold tabular-nums text-foreground">{value}</span>
    </motion.div>
  );

  const maxGoalsFor = Math.max(...topScorers.map(t => t.goals_for), 1);
  const maxGoalsAgainst = Math.max(...bestDefense.map(t => t.goals_against), 1);
  const maxDiff = Math.max(...bestDifference.map(t => Math.abs(t.goal_difference)), 1);
  const maxAvg = Math.max(...goalsPerMatch.map(t => t.avgGoals), 1);

  const sections = [
    { title: 'En Golcü Takımlar', icon: Target, iconColor: 'text-primary', data: topScorers, render: (t: StandingData, i: number) => renderTeamRow(t, i, t.goals_for, maxGoalsFor, 'bg-primary') },
    { title: 'En Sağlam Defanslar', icon: Shield, iconColor: 'text-blue-500', data: bestDefense, render: (t: StandingData, i: number) => renderTeamRow(t, i, t.goals_against, maxGoalsAgainst, 'bg-blue-500') },
    { title: 'En İyi Averaj', icon: TrendingUp, iconColor: 'text-emerald-500', data: bestDifference, render: (t: StandingData, i: number) => renderTeamRow(t, i, t.goal_difference > 0 ? `+${t.goal_difference}` : t.goal_difference, maxDiff, 'bg-emerald-500') },
    { title: 'Maç Başı Gol Ort.', icon: Activity, iconColor: 'text-amber-500', data: goalsPerMatch, render: (t: any, i: number) => renderTeamRow(t, i, t.avgGoals.toFixed(2), maxAvg, 'bg-amber-500') },
  ];

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <div key={section.title} className="rounded-xl border border-border/30 bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon className={cn("w-4 h-4", section.iconColor)} />
              <h3 className="text-sm font-semibold">{section.title}</h3>
            </div>
            <div className="space-y-2">
              {section.data.map((t, i) => section.render(t, i))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GoalStatsTab;
