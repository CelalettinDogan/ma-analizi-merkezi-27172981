import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { TeamStats } from '@/types/match';
import { Card } from '@/components/ui/card';

interface GoalDistributionChartProps {
  homeTeam: string;
  awayTeam: string;
  homeStats: TeamStats;
  awayStats: TeamStats;
}

const GoalDistributionChart: React.FC<GoalDistributionChartProps> = ({
  homeTeam,
  awayTeam,
  homeStats,
  awayStats,
}) => {
  const data = [
    {
      name: 'Atılan Gol',
      [homeTeam]: homeStats.goalsScored,
      [awayTeam]: awayStats.goalsScored,
    },
    {
      name: 'Yenilen Gol',
      [homeTeam]: homeStats.goalsConceded,
      [awayTeam]: awayStats.goalsConceded,
    },
    {
      name: 'Gol Ortalaması',
      [homeTeam]: Number((homeStats.goalsScored / 5).toFixed(1)),
      [awayTeam]: Number((awayStats.goalsScored / 5).toFixed(1)),
    },
  ];

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <h3 className="text-lg font-display font-bold text-foreground mb-4 text-center">
        Gol Dağılımı
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
              )}
            />
            <Bar dataKey={homeTeam} fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            <Bar dataKey={awayTeam} fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default GoalDistributionChart;
