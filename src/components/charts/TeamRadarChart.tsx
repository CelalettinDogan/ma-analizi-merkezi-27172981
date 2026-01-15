import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { TeamStats } from '@/types/match';
import { Card } from '@/components/ui/card';

interface TeamRadarChartProps {
  homeTeam: string;
  awayTeam: string;
  homeStats: TeamStats;
  awayStats: TeamStats;
}

const TeamRadarChart: React.FC<TeamRadarChartProps> = ({
  homeTeam,
  awayTeam,
  homeStats,
  awayStats,
}) => {
  // Calculate normalized values (0-100)
  const calculateFormScore = (form: string[]) => {
    const points = form.reduce((acc, result) => {
      if (result === 'W') return acc + 3;
      if (result === 'D') return acc + 1;
      return acc;
    }, 0);
    return (points / 15) * 100; // Max 15 points for 5 wins
  };

  const normalizeGoals = (goals: number, max: number = 15) => {
    return Math.min((goals / max) * 100, 100);
  };

  const calculateDefenseScore = (goalsConceded: number) => {
    // Lower is better, so invert the score
    return Math.max(100 - (goalsConceded / 10) * 100, 0);
  };

  const calculateWinRate = (stats: TeamStats, isHome: boolean) => {
    const perf = isHome ? stats.homePerformance : stats.awayPerformance;
    if (!perf) return 50;
    const total = perf.wins + perf.draws + perf.losses;
    return total > 0 ? (perf.wins / total) * 100 : 50;
  };

  const data = [
    {
      stat: 'Form',
      home: calculateFormScore(homeStats.form),
      away: calculateFormScore(awayStats.form),
      fullMark: 100,
    },
    {
      stat: 'Hücum',
      home: normalizeGoals(homeStats.goalsScored),
      away: normalizeGoals(awayStats.goalsScored),
      fullMark: 100,
    },
    {
      stat: 'Savunma',
      home: calculateDefenseScore(homeStats.goalsConceded),
      away: calculateDefenseScore(awayStats.goalsConceded),
      fullMark: 100,
    },
    {
      stat: 'Galibiyet',
      home: calculateWinRate(homeStats, true),
      away: calculateWinRate(awayStats, false),
      fullMark: 100,
    },
    {
      stat: 'Gol Farkı',
      home: normalizeGoals(homeStats.goalsScored - homeStats.goalsConceded + 10, 20),
      away: normalizeGoals(awayStats.goalsScored - awayStats.goalsConceded + 10, 20),
      fullMark: 100,
    },
  ];

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <h3 className="text-lg font-display font-bold text-foreground mb-4 text-center">
        Takım Performans Karşılaştırması
      </h3>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="stat"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={false}
            />
            <Radar
              name={homeTeam}
              dataKey="home"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Radar
              name={awayTeam}
              dataKey="away"
              stroke="hsl(var(--secondary))"
              fill="hsl(var(--secondary))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => (
                <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
              )}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: number) => [`${value.toFixed(0)}%`, '']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default TeamRadarChart;
