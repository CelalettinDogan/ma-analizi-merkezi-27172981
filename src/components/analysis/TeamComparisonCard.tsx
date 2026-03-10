import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Zap, Shield, Activity, Users, Home, Plane } from 'lucide-react';
import { TeamStats, TeamPower } from '@/types/match';
import { cn } from '@/lib/utils';

interface TeamComparisonCardProps {
  homeTeam: string;
  awayTeam: string;
  homeStats: TeamStats;
  awayStats: TeamStats;
  homePower?: TeamPower;
  awayPower?: TeamPower;
}

const FormBadge = memo<{ result: string }>(({ result }) => {
  const config = {
    W: { label: 'G', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    L: { label: 'M', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    D: { label: 'B', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  };
  const c = config[result as keyof typeof config] || config.D;
  
  return (
    <span className={cn(
      "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border",
      c.bg, c.text, c.border
    )}>
      {c.label}
    </span>
  );
});

FormBadge.displayName = 'FormBadge';

const ComparisonRow = memo<{
  label: string;
  homeValue: number;
  awayValue: number;
  icon: React.ReactNode;
  format?: 'number' | 'decimal';
}>(({ label, homeValue, awayValue, icon, format = 'number' }) => {
  const total = homeValue + awayValue;
  const homePercentage = total > 0 ? (homeValue / total) * 100 : 50;
  const homeWins = homeValue > awayValue;
  const awayWins = awayValue > homeValue;
  
  const formatValue = (val: number) => format === 'decimal' ? val.toFixed(1) : val.toFixed(0);
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className={cn("font-semibold tabular-nums", homeWins ? "text-primary" : "text-muted-foreground")}>
          {formatValue(homeValue)}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          {icon}
          <span className="truncate">{label}</span>
        </div>
        <span className={cn("font-semibold tabular-nums", awayWins ? "text-secondary" : "text-muted-foreground")}>
          {formatValue(awayValue)}
        </span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-muted/30">
        <div 
          className={cn("transition-all rounded-l-full", homeWins ? "bg-primary" : "bg-muted-foreground/40")}
          style={{ width: `${homePercentage}%` }}
        />
        <div 
          className={cn("transition-all rounded-r-full", awayWins ? "bg-secondary" : "bg-muted-foreground/40")}
          style={{ width: `${100 - homePercentage}%` }}
        />
      </div>
    </div>
  );
});

ComparisonRow.displayName = 'ComparisonRow';

const FormTabs = memo<{
  homeTeam: string;
  awayTeam: string;
  homeForm: string[];
  awayForm: string[];
  homeStats: TeamStats;
  awayStats: TeamStats;
}>(({ homeTeam, awayTeam, homeForm, awayForm, homeStats, awayStats }) => {
  const [tab, setTab] = useState<'home' | 'away'>('home');

  const homePerf = homeStats?.homePerformance;
  const awayPerf = awayStats?.awayPerformance;

  return (
    <div className="mb-5">
      <div className="flex gap-1 p-1 rounded-xl bg-muted/30 mb-3">
        <button
          onClick={() => setTab('home')}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all touch-manipulation min-h-[44px]",
            "active:scale-95",
            tab === 'home' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          <Home className="w-3 h-3" />
          İç Saha
        </button>
        <button
          onClick={() => setTab('away')}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all touch-manipulation min-h-[44px]",
            "active:scale-95",
            tab === 'away' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          <Plane className="w-3 h-3" />
          Deplasman
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2 truncate">
            {homeTeam} {tab === 'home' ? 'İç Saha' : 'Deplasman'}
          </p>
          <div className="flex gap-1 flex-wrap">
            {homeForm.length > 0 ? (
              homeForm.slice(0, 5).map((result, i) => <FormBadge key={i} result={result} />)
            ) : (
              <span className="text-xs text-muted-foreground">Veri yok</span>
            )}
          </div>
          {tab === 'home' && homePerf && (
            <p className="text-micro text-muted-foreground mt-1.5">
              {homePerf.wins}G {homePerf.draws}B {homePerf.losses}M
            </p>
          )}
          {tab === 'away' && awayPerf && (
            <p className="text-micro text-muted-foreground mt-1.5">
              {awayPerf.wins}G {awayPerf.draws}B {awayPerf.losses}M
            </p>
          )}
        </div>
        <div className="flex flex-col items-end">
          <p className="text-xs text-muted-foreground mb-2 truncate">
            {awayTeam} {tab === 'home' ? 'İç Saha' : 'Deplasman'}
          </p>
          <div className="flex gap-1 flex-wrap">
            {awayForm.length > 0 ? (
              awayForm.slice(0, 5).map((result, i) => <FormBadge key={i} result={result} />)
            ) : (
              <span className="text-xs text-muted-foreground">Veri yok</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

FormTabs.displayName = 'FormTabs';

const TeamComparisonCard: React.FC<TeamComparisonCardProps> = ({
  homeTeam, awayTeam, homeStats, awayStats, homePower, awayPower,
}) => {
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

  const hasAdvantage = homePower && awayPower;
  const advantageDiff = hasAdvantage ? homePower.overallPower - awayPower.overallPower : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="p-4 rounded-xl bg-card border border-border/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Takım Karşılaştırması
        </h4>
        {hasAdvantage && (
          <div className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            Math.abs(advantageDiff) < 10 
              ? "bg-muted text-muted-foreground"
              : advantageDiff > 0 
                ? "bg-primary/20 text-primary"
                : "bg-secondary/20 text-secondary"
          )}>
            {Math.abs(advantageDiff) < 10 
              ? "⚖️ Dengeli"
              : advantageDiff > 0 
                ? `🏠 +${advantageDiff.toFixed(0)}`
                : `✈️ +${Math.abs(advantageDiff).toFixed(0)}`
            }
          </div>
        )}
      </div>

      {/* Team Headers — fixed grid */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 mb-4 text-center">
        <div className="text-left min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{homeTeam}</p>
          <p className="text-xs text-muted-foreground">Ev Sahibi</p>
        </div>
        <div className="flex items-center justify-center px-2">
          <span className="text-xs text-muted-foreground">vs</span>
        </div>
        <div className="text-right min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{awayTeam}</p>
          <p className="text-xs text-muted-foreground">Deplasman</p>
        </div>
      </div>

      <FormTabs
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        homeForm={homeForm}
        awayForm={awayForm}
        homeStats={homeStats}
        awayStats={awayStats}
      />

      <div className="space-y-3 pt-3 border-t border-border/50">
        <ComparisonRow label="Atılan Gol Ort." homeValue={homeAvgScored} awayValue={awayAvgScored} icon={<TrendingUp className="w-3 h-3" />} format="decimal" />
        <ComparisonRow label="Yenen Gol Ort." homeValue={homeAvgConceded} awayValue={awayAvgConceded} icon={<TrendingDown className="w-3 h-3" />} format="decimal" />
        
        {homePower && awayPower && (
          <>
            <ComparisonRow label="Hücum Gücü" homeValue={homePower.attackIndex} awayValue={awayPower.attackIndex} icon={<Zap className="w-3 h-3" />} />
            <ComparisonRow label="Savunma Gücü" homeValue={homePower.defenseIndex} awayValue={awayPower.defenseIndex} icon={<Shield className="w-3 h-3" />} />
            <ComparisonRow label="Form Skoru" homeValue={homePower.formScore} awayValue={awayPower.formScore} icon={<Activity className="w-3 h-3" />} />
          </>
        )}
      </div>
    </motion.div>
  );
};

export default memo(TeamComparisonCard);
