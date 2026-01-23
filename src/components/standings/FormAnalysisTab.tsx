import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Flame, Snowflake } from 'lucide-react';
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

// Calculate form points (W=3, D=1, L=0)
const calculateFormPoints = (form: string | null): number => {
  if (!form) return 0;
  return form.split(',').reduce((total, result) => {
    const r = result.trim().toUpperCase();
    if (r === 'W') return total + 3;
    if (r === 'D') return total + 1;
    return total;
  }, 0);
};

// Get form display
const getFormIcon = (result: string) => {
  switch (result.trim().toUpperCase()) {
    case 'W': return <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold border border-primary/30">G</span>;
    case 'D': return <span className="w-6 h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-xs font-bold border border-secondary/30">B</span>;
    case 'L': return <span className="w-6 h-6 rounded-full bg-destructive/20 text-destructive flex items-center justify-center text-xs font-bold border border-destructive/30">M</span>;
    default: return <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">-</span>;
  }
};

const FormAnalysisTab: React.FC<FormAnalysisTabProps> = ({ standings, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border/50">
            <CardHeader className="pb-2">
              <div className="h-5 w-32 bg-muted/50 rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-muted/50 rounded-full animate-pulse" />
                  <div className="flex-1 h-4 bg-muted/50 rounded animate-pulse" />
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((k) => (
                      <div key={k} className="w-6 h-6 bg-muted/50 rounded-full animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate form points for each team
  const teamsWithFormPoints = standings.map(team => ({
    ...team,
    formPoints: calculateFormPoints(team.form),
    formArray: team.form ? team.form.split(',').slice(0, 5) : []
  }));

  // Rising teams (best form)
  const risingTeams = [...teamsWithFormPoints]
    .sort((a, b) => b.formPoints - a.formPoints)
    .slice(0, 5);

  // Falling teams (worst form)
  const fallingTeams = [...teamsWithFormPoints]
    .sort((a, b) => a.formPoints - b.formPoints)
    .slice(0, 5);

  // Hot streaks (consecutive wins)
  const getWinStreak = (form: string | null): number => {
    if (!form) return 0;
    const results = form.split(',');
    let streak = 0;
    for (const r of results) {
      if (r.trim().toUpperCase() === 'W') streak++;
      else break;
    }
    return streak;
  };

  const hotStreaks = [...teamsWithFormPoints]
    .map(team => ({ ...team, winStreak: getWinStreak(team.form) }))
    .filter(team => team.winStreak >= 2)
    .sort((a, b) => b.winStreak - a.winStreak)
    .slice(0, 5);

  // Cold streaks (consecutive losses/no wins)
  const getNoWinStreak = (form: string | null): number => {
    if (!form) return 0;
    const results = form.split(',');
    let streak = 0;
    for (const r of results) {
      if (r.trim().toUpperCase() !== 'W') streak++;
      else break;
    }
    return streak;
  };

  const coldStreaks = [...teamsWithFormPoints]
    .map(team => ({ ...team, noWinStreak: getNoWinStreak(team.form) }))
    .filter(team => team.noWinStreak >= 2)
    .sort((a, b) => b.noWinStreak - a.noWinStreak)
    .slice(0, 5);

  const renderTeamWithForm = (team: typeof teamsWithFormPoints[0], index: number, badge?: string) => (
    <motion.div
      key={team.team_name}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3"
    >
      <span className="text-xs font-semibold text-muted-foreground w-5">{index + 1}</span>
      {team.team_crest && (
        <img src={team.team_crest} alt="" className="w-5 h-5 object-contain" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {team.team_short_name || team.team_name}
        </p>
        {badge && (
          <span className="text-xs text-muted-foreground">{badge}</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {team.formArray.map((result, i) => (
          <React.Fragment key={i}>
            {getFormIcon(result)}
          </React.Fragment>
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Rising Teams */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4 text-primary" />
            Yükselen Takımlar
          </CardTitle>
          <p className="text-xs text-muted-foreground">Son 5 maçta en iyi performans</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {risingTeams.map((team, i) => 
            renderTeamWithForm(team, i, `${team.formPoints} puan`)
          )}
        </CardContent>
      </Card>

      {/* Falling Teams */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="w-4 h-4 text-destructive" />
            Düşüşte Olanlar
          </CardTitle>
          <p className="text-xs text-muted-foreground">Son 5 maçta düşük performans</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {fallingTeams.map((team, i) => 
            renderTeamWithForm(team, i, `${team.formPoints} puan`)
          )}
        </CardContent>
      </Card>

      {/* Hot Streaks */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="w-4 h-4 text-orange-500" />
            Galibiyet Serisi
          </CardTitle>
          <p className="text-xs text-muted-foreground">Üst üste kazanan takımlar</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {hotStreaks.length > 0 ? (
            hotStreaks.map((team, i) => 
              renderTeamWithForm(team, i, `${team.winStreak} galibiyet`)
            )
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Şu an galibiyet serisinde takım yok
            </p>
          )}
        </CardContent>
      </Card>

      {/* Cold Streaks */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Snowflake className="w-4 h-4 text-cyan-500" />
            Galibiyetsiz Seri
          </CardTitle>
          <p className="text-xs text-muted-foreground">Galibiyet alamayan takımlar</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {coldStreaks.length > 0 ? (
            coldStreaks.map((team, i) => 
              renderTeamWithForm(team, i, `${team.noWinStreak} maç galibiyetsiz`)
            )
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Şu an galibiyetsiz seride takım yok
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FormAnalysisTab;
