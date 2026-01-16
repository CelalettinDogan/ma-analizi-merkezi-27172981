import React from 'react';
import { Flame, Snowflake, Swords, Trophy, TrendingUp, TrendingDown, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MatchInsights {
  homeFormScore?: number;
  awayFormScore?: number;
  homeMomentum?: number;
  awayMomentum?: number;
  isDerby?: boolean;
  matchImportance?: 'critical' | 'high' | 'medium' | 'low';
  homeCleanSheetRatio?: number;
  awayCleanSheetRatio?: number;
  homeAttackIndex?: number;
  awayAttackIndex?: number;
}

interface BadgeProps {
  icon: React.ReactNode;
  label: string;
  variant: 'fire' | 'ice' | 'derby' | 'critical' | 'rising' | 'falling' | 'defense' | 'attack';
  team?: 'home' | 'away';
}

const badgeStyles: Record<string, string> = {
  fire: 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border-orange-500/30',
  ice: 'bg-gradient-to-r from-blue-400/20 to-cyan-400/20 text-blue-400 border-blue-400/30',
  derby: 'bg-gradient-to-r from-purple-500/20 to-amber-500/20 text-purple-400 border-purple-500/30',
  critical: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border-red-500/30',
  rising: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30',
  falling: 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 border-red-500/30',
  defense: 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
  attack: 'bg-gradient-to-r from-green-500/20 to-yellow-500/20 text-green-400 border-green-500/30',
};

const Badge: React.FC<BadgeProps> = ({ icon, label, variant, team }) => (
  <div 
    className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-sm transition-all hover:scale-105',
      badgeStyles[variant]
    )}
  >
    {icon}
    <span>{label}</span>
    {team && (
      <span className="opacity-60 text-[10px]">({team === 'home' ? 'Ev' : 'Dep'})</span>
    )}
  </div>
);

interface MatchInsightBadgesProps {
  insights: MatchInsights;
  compact?: boolean;
}

const MatchInsightBadges: React.FC<MatchInsightBadgesProps> = ({ insights, compact = false }) => {
  const badges: React.ReactNode[] = [];

  // Derby badge
  if (insights.isDerby) {
    badges.push(
      <Badge 
        key="derby" 
        icon={<Swords className="w-3.5 h-3.5" />} 
        label="Derbi" 
        variant="derby" 
      />
    );
  }

  // Critical match badge
  if (insights.matchImportance === 'critical') {
    badges.push(
      <Badge 
        key="critical" 
        icon={<Trophy className="w-3.5 h-3.5" />} 
        label="Kritik Maç" 
        variant="critical" 
      />
    );
  }

  // Hot form badges (form score > 80)
  if (insights.homeFormScore && insights.homeFormScore > 80) {
    badges.push(
      <Badge 
        key="home-hot" 
        icon={<Flame className="w-3.5 h-3.5" />} 
        label="Sıcak Form" 
        variant="fire" 
        team="home"
      />
    );
  }
  if (insights.awayFormScore && insights.awayFormScore > 80) {
    badges.push(
      <Badge 
        key="away-hot" 
        icon={<Flame className="w-3.5 h-3.5" />} 
        label="Sıcak Form" 
        variant="fire" 
        team="away"
      />
    );
  }

  // Cold form badges (form score < 30)
  if (insights.homeFormScore && insights.homeFormScore < 30) {
    badges.push(
      <Badge 
        key="home-cold" 
        icon={<Snowflake className="w-3.5 h-3.5" />} 
        label="Soğuk Form" 
        variant="ice" 
        team="home"
      />
    );
  }
  if (insights.awayFormScore && insights.awayFormScore < 30) {
    badges.push(
      <Badge 
        key="away-cold" 
        icon={<Snowflake className="w-3.5 h-3.5" />} 
        label="Soğuk Form" 
        variant="ice" 
        team="away"
      />
    );
  }

  // Rising momentum (momentum > 20)
  if (insights.homeMomentum && insights.homeMomentum > 20) {
    badges.push(
      <Badge 
        key="home-rising" 
        icon={<TrendingUp className="w-3.5 h-3.5" />} 
        label="Yükselişte" 
        variant="rising" 
        team="home"
      />
    );
  }
  if (insights.awayMomentum && insights.awayMomentum > 20) {
    badges.push(
      <Badge 
        key="away-rising" 
        icon={<TrendingUp className="w-3.5 h-3.5" />} 
        label="Yükselişte" 
        variant="rising" 
        team="away"
      />
    );
  }

  // Falling momentum (momentum < -20)
  if (insights.homeMomentum && insights.homeMomentum < -20) {
    badges.push(
      <Badge 
        key="home-falling" 
        icon={<TrendingDown className="w-3.5 h-3.5" />} 
        label="Düşüşte" 
        variant="falling" 
        team="home"
      />
    );
  }
  if (insights.awayMomentum && insights.awayMomentum < -20) {
    badges.push(
      <Badge 
        key="away-falling" 
        icon={<TrendingDown className="w-3.5 h-3.5" />} 
        label="Düşüşte" 
        variant="falling" 
        team="away"
      />
    );
  }

  // Defense master (clean sheet ratio > 40%)
  if (insights.homeCleanSheetRatio && insights.homeCleanSheetRatio > 40) {
    badges.push(
      <Badge 
        key="home-defense" 
        icon={<Shield className="w-3.5 h-3.5" />} 
        label="Savunma Ustası" 
        variant="defense" 
        team="home"
      />
    );
  }
  if (insights.awayCleanSheetRatio && insights.awayCleanSheetRatio > 40) {
    badges.push(
      <Badge 
        key="away-defense" 
        icon={<Shield className="w-3.5 h-3.5" />} 
        label="Savunma Ustası" 
        variant="defense" 
        team="away"
      />
    );
  }

  // Goal machine (attack index > 130)
  if (insights.homeAttackIndex && insights.homeAttackIndex > 130) {
    badges.push(
      <Badge 
        key="home-attack" 
        icon={<Zap className="w-3.5 h-3.5" />} 
        label="Gol Makinesi" 
        variant="attack" 
        team="home"
      />
    );
  }
  if (insights.awayAttackIndex && insights.awayAttackIndex > 130) {
    badges.push(
      <Badge 
        key="away-attack" 
        icon={<Zap className="w-3.5 h-3.5" />} 
        label="Gol Makinesi" 
        variant="attack" 
        team="away"
      />
    );
  }

  if (badges.length === 0) return null;

  const displayBadges = compact ? badges.slice(0, 3) : badges;

  return (
    <div className="flex flex-wrap gap-2">
      {displayBadges}
      {compact && badges.length > 3 && (
        <span className="text-xs text-muted-foreground self-center">
          +{badges.length - 3} daha
        </span>
      )}
    </div>
  );
};

export default MatchInsightBadges;
