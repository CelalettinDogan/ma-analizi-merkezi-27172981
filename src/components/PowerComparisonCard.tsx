import React from 'react';
import { Zap, Shield, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamPower {
  attackIndex: number;
  defenseIndex: number;
  overallPower: number;
  formScore: number;
}

interface PowerComparisonCardProps {
  homeTeam: string;
  awayTeam: string;
  homePower: TeamPower;
  awayPower: TeamPower;
}

const PowerGauge: React.FC<{ 
  value: number; 
  label: string; 
  icon: React.ReactNode;
  color: string;
  max?: number;
}> = ({ value, label, icon, color, max = 200 }) => {
  // Value is relative to 100 (league average)
  const percentage = Math.min((value / max) * 100, 100);
  const isAboveAverage = value > 100;
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <span className={cn(
          'text-sm font-bold',
          isAboveAverage ? color : 'text-muted-foreground'
        )}>
          {value.toFixed(0)}
        </span>
      </div>
      <div className="h-2 bg-muted/30 rounded-full overflow-hidden relative">
        {/* Average marker */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-muted-foreground/50 z-10"
          style={{ left: '50%' }}
        />
        <div 
          className={cn(
            'h-full rounded-full transition-all',
            isAboveAverage 
              ? `bg-gradient-to-r ${color === 'text-primary' ? 'from-primary/60 to-primary' : color === 'text-blue-400' ? 'from-blue-600 to-blue-400' : 'from-secondary/60 to-secondary'}`
              : 'bg-muted-foreground/40'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const ComparisonBar: React.FC<{
  homeValue: number;
  awayValue: number;
  label: string;
  homeColor?: string;
  awayColor?: string;
}> = ({ homeValue, awayValue, label, homeColor = 'bg-primary', awayColor = 'bg-secondary' }) => {
  const total = homeValue + awayValue;
  const homePercentage = total > 0 ? (homeValue / total) * 100 : 50;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-primary font-medium">{homeValue.toFixed(0)}</span>
        <span className="text-muted-foreground">{label}</span>
        <span className="text-secondary font-medium">{awayValue.toFixed(0)}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden">
        <div 
          className={cn('transition-all', homeColor)}
          style={{ width: `${homePercentage}%` }}
        />
        <div 
          className={cn('transition-all', awayColor)}
          style={{ width: `${100 - homePercentage}%` }}
        />
      </div>
    </div>
  );
};

const PowerComparisonCard: React.FC<PowerComparisonCardProps> = ({
  homeTeam,
  awayTeam,
  homePower,
  awayPower,
}) => {
  const homeAdvantage = homePower.overallPower - awayPower.overallPower;
  
  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Güç Karşılaştırması
        </h3>
        <div className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-full',
          homeAdvantage > 10 ? 'bg-primary/20 text-primary' :
          homeAdvantage < -10 ? 'bg-secondary/20 text-secondary' :
          'bg-muted text-muted-foreground'
        )}>
          {homeAdvantage > 10 ? `${homeTeam} +${homeAdvantage.toFixed(0)}` :
           homeAdvantage < -10 ? `${awayTeam} +${Math.abs(homeAdvantage).toFixed(0)}` :
           'Dengeli'}
        </div>
      </div>

      {/* Team Headers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-sm font-medium text-foreground truncate">{homeTeam}</div>
          <div className="text-xs text-muted-foreground">Ev Sahibi</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-foreground truncate">{awayTeam}</div>
          <div className="text-xs text-muted-foreground">Deplasman</div>
        </div>
      </div>

      {/* Power Gauges Side by Side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Home Team */}
        <div className="space-y-3">
          <PowerGauge 
            value={homePower.attackIndex} 
            label="Hücum" 
            icon={<Zap className="w-3.5 h-3.5 text-primary" />}
            color="text-primary"
          />
          <PowerGauge 
            value={homePower.defenseIndex} 
            label="Savunma" 
            icon={<Shield className="w-3.5 h-3.5 text-blue-400" />}
            color="text-blue-400"
          />
          <PowerGauge 
            value={homePower.formScore} 
            label="Form" 
            icon={<Activity className="w-3.5 h-3.5 text-secondary" />}
            color="text-secondary"
            max={100}
          />
        </div>
        
        {/* Away Team */}
        <div className="space-y-3">
          <PowerGauge 
            value={awayPower.attackIndex} 
            label="Hücum" 
            icon={<Zap className="w-3.5 h-3.5 text-primary" />}
            color="text-primary"
          />
          <PowerGauge 
            value={awayPower.defenseIndex} 
            label="Savunma" 
            icon={<Shield className="w-3.5 h-3.5 text-blue-400" />}
            color="text-blue-400"
          />
          <PowerGauge 
            value={awayPower.formScore} 
            label="Form" 
            icon={<Activity className="w-3.5 h-3.5 text-secondary" />}
            color="text-secondary"
            max={100}
          />
        </div>
      </div>

      {/* Direct Comparisons */}
      <div className="pt-3 border-t border-border/50 space-y-3">
        <div className="text-xs text-muted-foreground font-medium">Doğrudan Karşılaştırma</div>
        <ComparisonBar 
          homeValue={homePower.attackIndex} 
          awayValue={awayPower.attackIndex} 
          label="Hücum Gücü"
        />
        <ComparisonBar 
          homeValue={homePower.defenseIndex} 
          awayValue={awayPower.defenseIndex} 
          label="Savunma Gücü"
          homeColor="bg-blue-500"
          awayColor="bg-blue-400"
        />
        <ComparisonBar 
          homeValue={homePower.overallPower} 
          awayValue={awayPower.overallPower} 
          label="Toplam Güç"
          homeColor="bg-gradient-to-r from-primary to-secondary"
          awayColor="bg-gradient-to-l from-primary to-secondary"
        />
      </div>
    </div>
  );
};

export default PowerComparisonCard;
