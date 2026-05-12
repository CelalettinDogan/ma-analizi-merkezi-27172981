import React from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface KpiSparklineProps {
  data: number[];
  colorVar?: string; // e.g. '--primary'
  height?: number;
}

const KpiSparkline: React.FC<KpiSparklineProps> = ({
  data,
  colorVar = '--primary',
  height = 36,
}) => {
  if (!data || data.length === 0) return null;
  const points = data.map((v, i) => ({ i, v }));
  const stroke = `hsl(var(${colorVar}))`;
  const gradId = `spark-${colorVar.replace('--', '')}`;

  return (
    <div className="w-full" style={{ height }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default KpiSparkline;
