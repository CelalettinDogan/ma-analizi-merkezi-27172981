import React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import type { TimeSeriesPoint } from '@/hooks/admin/useAnalyticsTimeSeries';

interface ActivityTrendChartProps {
  data: TimeSeriesPoint[];
}

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });

const ActivityTrendChart: React.FC<ActivityTrendChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={fmt}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(l) => fmt(l as string)}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
          <Line
            type="monotone"
            dataKey="active_users_24h"
            name="Aktif (24s)"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="today_analysis"
            name="Analiz"
            stroke="hsl(var(--chart-2, var(--primary)))"
            strokeWidth={2}
            dot={false}
            strokeOpacity={0.7}
          />
          <Line
            type="monotone"
            dataKey="today_chats"
            name="Chat"
            stroke="hsl(var(--accent-foreground, var(--muted-foreground)))"
            strokeWidth={2}
            dot={false}
            strokeOpacity={0.6}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ActivityTrendChart;
