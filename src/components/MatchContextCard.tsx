import React from 'react';
import { AlertTriangle, Calendar, Clock, TrendingUp, TrendingDown, Minus, Swords } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface MatchContext {
  matchImportance: 'critical' | 'high' | 'medium' | 'low';
  seasonPhase: 'early' | 'mid' | 'late' | 'final';
  isDerby: boolean;
  homeRestDays?: number;
  awayRestDays?: number;
  homeMomentum?: number;
  awayMomentum?: number;
  contextTags?: string[];
}

interface MatchContextCardProps {
  context: MatchContext;
  homeTeam: string;
  awayTeam: string;
}

const importanceConfig = {
  critical: { label: 'Kritik', color: 'text-red-400', bg: 'bg-red-500/20', progress: 100 },
  high: { label: 'Yüksek', color: 'text-orange-400', bg: 'bg-orange-500/20', progress: 75 },
  medium: { label: 'Orta', color: 'text-yellow-400', bg: 'bg-yellow-500/20', progress: 50 },
  low: { label: 'Düşük', color: 'text-muted-foreground', bg: 'bg-muted/30', progress: 25 },
};

const seasonPhaseConfig = {
  early: { label: 'Sezon Başı', icon: '🌱', description: 'Takımlar form arıyor' },
  mid: { label: 'Sezon Ortası', icon: '⚡', description: 'Rekabet kızışıyor' },
  late: { label: 'Sezon Sonu', icon: '🔥', description: 'Her puan kritik' },
  final: { label: 'Final Haftaları', icon: '🏆', description: 'Şampiyonluk mücadelesi' },
};

const MomentumIndicator: React.FC<{ value: number; team: string }> = ({ value, team }) => {
  const getTrendIcon = () => {
    if (value > 10) return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (value < -10) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getColor = () => {
    if (value > 20) return 'text-emerald-400';
    if (value > 0) return 'text-green-400';
    if (value < -20) return 'text-red-400';
    if (value < 0) return 'text-orange-400';
    return 'text-muted-foreground';
  };

  const normalizedValue = Math.min(Math.max((value + 50) / 100, 0), 1) * 100;

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground truncate">{team}</span>
        <div className="flex items-center gap-1">
          {getTrendIcon()}
          <span className={cn('text-sm font-medium', getColor())}>
            {value > 0 ? '+' : ''}{value}
          </span>
        </div>
      </div>
      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
        <div 
          className={cn(
            'h-full rounded-full transition-all',
            value > 0 ? 'bg-gradient-to-r from-green-600 to-emerald-400' : 'bg-gradient-to-r from-red-600 to-orange-400'
          )}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  );
};

const MatchContextCard: React.FC<MatchContextCardProps> = ({ context, homeTeam, awayTeam }) => {
  const importance = importanceConfig[context?.matchImportance] ?? importanceConfig.medium;
  const phase = seasonPhaseConfig[context?.seasonPhase] ?? seasonPhaseConfig.mid;

  return (
    <div className="glass-card p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-primary" />
        Maç Bağlamı
      </h3>

      {/* Match Importance */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Maç Önemi</span>
          <span className={cn('text-sm font-medium', importance.color)}>
            {importance.label}
          </span>
        </div>
        <Progress value={importance.progress} className="h-2" />
      </div>

      {/* Season Phase */}
      <div className={cn('p-3 rounded-lg', importance.bg)}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{phase.icon}</span>
          <div>
            <div className="text-sm font-medium text-foreground">{phase.label}</div>
            <div className="text-xs text-muted-foreground">{phase.description}</div>
          </div>
        </div>
      </div>

      {/* Derby Badge */}
      {context.isDerby && (
        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-500/20 to-amber-500/20 rounded-lg border border-purple-500/30">
          <Swords className="w-5 h-5 text-purple-400" />
          <div>
            <div className="text-sm font-medium text-purple-400">Derbi Maçı</div>
            <div className="text-xs text-muted-foreground">Yüksek motivasyon ve rekabet</div>
          </div>
        </div>
      )}

      {/* Rest Days */}
      {(context.homeRestDays !== undefined || context.awayRestDays !== undefined) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">{homeTeam}</span>
            </div>
            <div className="text-lg font-bold text-foreground">
              {context.homeRestDays ?? '-'} <span className="text-sm font-normal text-muted-foreground">gün</span>
            </div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">{awayTeam}</span>
            </div>
            <div className="text-lg font-bold text-foreground">
              {context.awayRestDays ?? '-'} <span className="text-sm font-normal text-muted-foreground">gün</span>
            </div>
          </div>
        </div>
      )}

      {/* Momentum */}
      {(context.homeMomentum !== undefined || context.awayMomentum !== undefined) && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground font-medium">Momentum</div>
          <div className="flex gap-4">
            {context.homeMomentum !== undefined && (
              <MomentumIndicator value={context.homeMomentum} team={homeTeam} />
            )}
            {context.awayMomentum !== undefined && (
              <MomentumIndicator value={context.awayMomentum} team={awayTeam} />
            )}
          </div>
        </div>
      )}

      {/* Context Tags */}
      {context.contextTags && context.contextTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {context.contextTags.map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-0.5 text-xs bg-muted/50 text-muted-foreground rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchContextCard;
