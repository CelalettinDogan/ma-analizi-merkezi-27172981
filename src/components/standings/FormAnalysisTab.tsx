import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StandingData {
  team_name: string;
  team_short_name: string | null;
  team_crest: string | null;
  form: string | null;
  won: number;
  draw: number;
  lost: number;
  points: number;
  played_games: number;
}

interface FormAnalysisTabProps {
  standings: StandingData[];
  isLoading?: boolean;
}

const calculateFormPoints = (team: StandingData): number => {
  if (team.form) {
    return team.form.split(',').reduce((total, r) => {
      const u = r.trim().toUpperCase();
      return total + (u === 'W' ? 3 : u === 'D' ? 1 : 0);
    }, 0);
  }
  return (team.won * 3) + (team.draw * 1);
};

const getPointsPerGame = (team: StandingData): number => {
  const pts = calculateFormPoints(team);
  return team.played_games > 0 ? pts / team.played_games : 0;
};

const generateFallbackForm = (team: StandingData): string[] => {
  const total = team.won + team.draw + team.lost;
  if (total === 0) return [];
  const slots = Math.min(5, total);
  const result: string[] = [];
  for (let i = 0; i < slots; i++) {
    const pos = (i + 0.5) / slots;
    const wRatio = team.won / total;
    const dRatio = team.draw / total;
    if (pos < wRatio) result.push('W');
    else if (pos < wRatio + dRatio) result.push('D');
    else result.push('L');
  }
  return result;
};

const getFormIcon = (result: string) => {
  const r = result.trim().toUpperCase();
  switch (r) {
    case 'W': return <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold">G</span>;
    case 'D': return <span className="w-5 h-5 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-[10px] font-bold">B</span>;
    case 'L': return <span className="w-5 h-5 rounded-full bg-destructive/15 text-destructive flex items-center justify-center text-[10px] font-bold">M</span>;
    default: return <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px]">-</span>;
  }
};

const FormAnalysisTab: React.FC<FormAnalysisTabProps> = ({ standings, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border/30 bg-card p-4 space-y-3">
            <div className="h-4 w-28 bg-muted/50 rounded animate-pulse" />
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-muted/50 rounded-full animate-pulse" />
                <div className="flex-1 h-3 bg-muted/50 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  const hasRealForm = standings.some(t => t.form != null);

  const teamsWithFormData = standings.map(team => ({
    ...team,
    formPoints: calculateFormPoints(team),
    pointsPerGame: getPointsPerGame(team),
    formArray: team.form ? team.form.split(',').slice(0, 5) : generateFallbackForm(team),
  }));

  const risingTeams = [...teamsWithFormData].sort((a, b) => b.pointsPerGame - a.pointsPerGame).slice(0, 5);
  const fallingTeams = [...teamsWithFormData].sort((a, b) => a.pointsPerGame - b.pointsPerGame).slice(0, 5);

  const renderTeamRow = (team: typeof teamsWithFormData[0], index: number, badge: string) => (
    <motion.div
      key={team.team_name}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-3 py-1.5"
    >
      <span className="text-[10px] font-bold text-muted-foreground w-4 text-center">{index + 1}</span>
      {team.team_crest && <img src={team.team_crest} alt="" className="w-6 h-6 object-contain flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{team.team_short_name || team.team_name}</p>
        <span className="text-[10px] text-muted-foreground">{badge}</span>
      </div>
      <div className="flex items-center gap-0.5">
        {team.formArray.map((result, i) => (
          <React.Fragment key={i}>{getFormIcon(result)}</React.Fragment>
        ))}
      </div>
    </motion.div>
  );

  const sections = [
    { title: 'Yükselen Takımlar', subtitle: 'En iyi maç başı puan ortalaması', icon: TrendingUp, iconColor: 'text-primary', teams: risingTeams },
    { title: 'Düşüşte Olanlar', subtitle: 'En düşük maç başı puan ortalaması', icon: TrendingDown, iconColor: 'text-destructive', teams: fallingTeams },
  ];

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <div key={section.title} className="rounded-xl border border-border/30 bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={cn("w-4 h-4", section.iconColor)} />
              <h3 className="text-sm font-semibold">{section.title}</h3>
            </div>
            <p className="text-[10px] text-muted-foreground mb-3">{section.subtitle}</p>
            {!hasRealForm && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2">
                <Info className="w-3 h-3" />
                <span>Sezon geneli performansa göre hesaplanmıştır</span>
              </div>
            )}
            <div className="space-y-1">
              {section.teams.map((t, i) => renderTeamRow(t, i, `${t.pointsPerGame.toFixed(2)} puan/maç`))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FormAnalysisTab;
