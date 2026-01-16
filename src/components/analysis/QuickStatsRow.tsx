import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Zap, Shield, Activity } from 'lucide-react';
import { TeamStats, TeamPower } from '@/types/match';
import { cn } from '@/lib/utils';

interface QuickStatsRowProps {
  homeTeam: string;
  awayTeam: string;
  homeStats: TeamStats;
  awayStats: TeamStats;
  homePower?: TeamPower;
  awayPower?: TeamPower;
}

interface FormBadgeProps {
  result: string;
}

const FormBadge = memo<FormBadgeProps>(({ result }) => {
  const config = {
    W: { label: 'G', bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    L: { label: 'M', bg: 'bg-red-500/20', text: 'text-red-400' },
    D: { label: 'B', bg: 'bg-amber-500/20', text: 'text-amber-400' },
  };
  const c = config[result as keyof typeof config] || config.D;
  
  return (
    <span className={cn("w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold", c.bg, c.text)}>
      {c.label}
    </span>
  );
});

FormBadge.displayName = 'FormBadge';

interface PowerMeterProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  max?: number;
}

const PowerMeter = memo<PowerMeterProps>(({ value, label, icon, max = 200 }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const isHigh = value > (max / 2);
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-md bg-muted/50 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs mb-0.5">
          <span className="text-muted-foreground truncate">{label}</span>
          <span className={cn("font-semibold", isHigh ? "text-primary" : "text-muted-foreground")}>
            {value.toFixed(0)}
          </span>
        </div>
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all",
              isHigh ? "bg-gradient-to-r from-primary/60 to-primary" : "bg-muted-foreground/40"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
});

PowerMeter.displayName = 'PowerMeter';

const QuickStatsRow: React.FC<QuickStatsRowProps> = ({
  homeTeam,
  awayTeam,
  homeStats,
  awayStats,
  homePower,
  awayPower,
}) => {
  // Null safety for stats
  const homeForm = homeStats?.form ?? [];
  const awayForm = awayStats?.form ?? [];
  const homeGoalsScored = homeStats?.goalsScored ?? 0;
  const homeGoalsConceded = homeStats?.goalsConceded ?? 0;
  const awayGoalsScored = awayStats?.goalsScored ?? 0;
  const awayGoalsConceded = awayStats?.goalsConceded ?? 0;

  const homeAvgScored = homeGoalsScored / 5;
  const homeAvgConceded = homeGoalsConceded / 5;
  const awayAvgScored = awayGoalsScored / 5;
  const awayAvgConceded = awayGoalsConceded / 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-4"
    >
      {/* Form Card */}
      <div className="p-4 rounded-xl bg-card border border-border/50">
        <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Son 5 Maç Formu
        </h4>
        
        <div className="space-y-4">
          {/* Home Team Form */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground truncate max-w-[150px]">{homeTeam}</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold">{homeAvgScored.toFixed(1)}</span>
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold">{homeAvgConceded.toFixed(1)}</span>
              </div>
            </div>
            <div className="flex gap-1">
              {homeForm.length > 0 ? (
                homeForm.map((result, i) => (
                  <FormBadge key={i} result={result} />
                ))
              ) : (
                <span className="text-xs text-muted-foreground">Form verisi yok</span>
              )}
            </div>
          </div>

          <div className="h-px bg-border/50" />

          {/* Away Team Form */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground truncate max-w-[150px]">{awayTeam}</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold">{awayAvgScored.toFixed(1)}</span>
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold">{awayAvgConceded.toFixed(1)}</span>
              </div>
            </div>
            <div className="flex gap-1">
              {awayForm.length > 0 ? (
                awayForm.map((result, i) => (
                  <FormBadge key={i} result={result} />
                ))
              ) : (
                <span className="text-xs text-muted-foreground">Form verisi yok</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Power Index Card */}
      {homePower && awayPower && (
        <div className="p-4 rounded-xl bg-card border border-border/50">
          <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Güç Endeksi
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Home Power */}
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground text-center truncate">{homeTeam}</div>
              <PowerMeter 
                value={homePower.attackIndex} 
                label="Hücum" 
                icon={<Zap className="w-3.5 h-3.5 text-primary" />}
              />
              <PowerMeter 
                value={homePower.defenseIndex} 
                label="Savunma" 
                icon={<Shield className="w-3.5 h-3.5 text-blue-400" />}
              />
            </div>

            {/* Away Power */}
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground text-center truncate">{awayTeam}</div>
              <PowerMeter 
                value={awayPower.attackIndex} 
                label="Hücum" 
                icon={<Zap className="w-3.5 h-3.5 text-secondary" />}
              />
              <PowerMeter 
                value={awayPower.defenseIndex} 
                label="Savunma" 
                icon={<Shield className="w-3.5 h-3.5 text-blue-400" />}
              />
            </div>
          </div>

          {/* Advantage Badge */}
          <div className="mt-4 pt-3 border-t border-border/50 text-center">
            {(() => {
              const diff = homePower.overallPower - awayPower.overallPower;
              if (Math.abs(diff) < 10) {
                return <span className="text-xs text-muted-foreground">⚖️ Dengeli Maç</span>;
              }
              return (
                <span className={cn(
                  "text-xs font-medium",
                  diff > 0 ? "text-primary" : "text-secondary"
                )}>
                  {diff > 0 ? `🏠 ${homeTeam}` : `✈️ ${awayTeam}`} avantajlı (+{Math.abs(diff).toFixed(0)})
                </span>
              );
            })()}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default memo(QuickStatsRow);
