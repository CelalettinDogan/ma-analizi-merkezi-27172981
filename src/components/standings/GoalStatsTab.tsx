import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border/50">
            <CardHeader className="pb-2">
              <div className="h-5 w-32 bg-muted/50 rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-muted/50 rounded-full animate-pulse" />
                  <div className="flex-1 h-4 bg-muted/50 rounded animate-pulse" />
                  <div className="w-8 h-4 bg-muted/50 rounded animate-pulse" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Top scorers (most goals)
  const topScorers = [...standings]
    .sort((a, b) => b.goals_for - a.goals_for)
    .slice(0, 5);

  // Best defense (least goals conceded)
  const bestDefense = [...standings]
    .sort((a, b) => a.goals_against - b.goals_against)
    .slice(0, 5);

  // Best goal difference
  const bestDifference = [...standings]
    .sort((a, b) => b.goal_difference - a.goal_difference)
    .slice(0, 5);

  // Goals per match average
  const goalsPerMatch = [...standings]
    .map(team => ({
      ...team,
      avgGoals: team.played_games > 0 ? (team.goals_for / team.played_games) : 0
    }))
    .sort((a, b) => b.avgGoals - a.avgGoals)
    .slice(0, 5);

  const renderTeamRow = (team: StandingData, index: number, value: string | number, maxValue: number, color: string) => (
    <motion.div
      key={team.team_name}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3"
    >
      <span className="text-xs font-semibold text-muted-foreground w-5">{index + 1}</span>
      {team.team_crest && (
        <img src={team.team_crest} alt="" className="w-5 h-5 object-contain" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {team.team_short_name || team.team_name}
        </p>
        <div className="w-full bg-muted/30 rounded-full h-1.5 mt-1">
          <div 
            className={cn("h-full rounded-full transition-all", color)}
            style={{ width: `${(Number(value) / maxValue) * 100}%` }}
          />
        </div>
      </div>
      <span className="text-sm font-bold tabular-nums">{value}</span>
    </motion.div>
  );

  const maxGoalsFor = Math.max(...topScorers.map(t => t.goals_for), 1);
  const maxGoalsAgainst = Math.max(...bestDefense.map(t => t.goals_against), 1);
  const maxDiff = Math.max(...bestDifference.map(t => Math.abs(t.goal_difference)), 1);
  const maxAvg = Math.max(...goalsPerMatch.map(t => t.avgGoals), 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top Scorers */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="w-4 h-4 text-primary" />
            En Golcü Takımlar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topScorers.map((team, i) => 
            renderTeamRow(team, i, team.goals_for, maxGoalsFor, "bg-primary")
          )}
        </CardContent>
      </Card>

      {/* Best Defense */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4 text-blue-500" />
            En Sağlam Defanslar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bestDefense.map((team, i) => 
            renderTeamRow(team, i, team.goals_against, maxGoalsAgainst, "bg-blue-500")
          )}
        </CardContent>
      </Card>

      {/* Best Goal Difference */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            En İyi Averaj
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bestDifference.map((team, i) => 
            renderTeamRow(
              team, 
              i, 
              team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference,
              maxDiff,
              "bg-emerald-500"
            )
          )}
        </CardContent>
      </Card>

      {/* Goals per Match */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-4 h-4 text-amber-500" />
            Maç Başı Gol Ort.
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {goalsPerMatch.map((team, i) => 
            renderTeamRow(
              team, 
              i, 
              team.avgGoals.toFixed(2),
              maxAvg,
              "bg-amber-500"
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoalStatsTab;
