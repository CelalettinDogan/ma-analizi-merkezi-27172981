import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { TeamStats } from '@/types/match';
import { Card } from '@/components/ui/card';

interface TrendAnalysisChartProps {
  homeTeam: string;
  awayTeam: string;
  homeStats: TeamStats;
  awayStats: TeamStats;
}

const TrendAnalysisChart: React.FC<TrendAnalysisChartProps> = ({
  homeTeam,
  awayTeam,
  homeStats,
  awayStats,
}) => {
  // Convert form to points trend
  const formToPoints = (result: string) => {
    switch (result) {
      case 'W': return 3;
      case 'D': return 1;
      case 'L': return 0;
      default: return 0;
    }
  };

  // Calculate cumulative points
  const buildTrendData = (homeForm: string[], awayForm: string[]) => {
    const maxLength = Math.max(homeForm.length, awayForm.length);
    let homeCumulative = 0;
    let awayCumulative = 0;
    
    return Array.from({ length: maxLength }, (_, i) => {
      if (homeForm[i]) {
        homeCumulative += formToPoints(homeForm[i]);
      }
      if (awayForm[i]) {
        awayCumulative += formToPoints(awayForm[i]);
      }
      
      return {
        match: `Maç ${i + 1}`,
        [homeTeam]: homeCumulative,
        [awayTeam]: awayCumulative,
        homePoints: homeForm[i] ? formToPoints(homeForm[i]) : null,
        awayPoints: awayForm[i] ? formToPoints(awayForm[i]) : null,
      };
    });
  };

  const data = buildTrendData(homeStats.form, awayStats.form);

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <h3 className="text-lg font-display font-bold text-foreground mb-4 text-center">
        Form Trendi (Son 5 Maç)
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="match"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              domain={[0, 15]}
              ticks={[0, 3, 6, 9, 12, 15]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: number, name: string) => [
                `${value} puan`,
                name,
              ]}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
              )}
            />
            <ReferenceLine
              y={7.5}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              label={{
                value: 'Ortalama',
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 10,
              }}
            />
            <Line
              type="monotone"
              dataKey={homeTeam}
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey={awayTeam}
              stroke="hsl(var(--secondary))"
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-win" /> Galibiyet: 3 puan
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-draw" /> Beraberlik: 1 puan
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-loss" /> Mağlubiyet: 0 puan
        </span>
      </div>
    </Card>
  );
};

export default TrendAnalysisChart;
