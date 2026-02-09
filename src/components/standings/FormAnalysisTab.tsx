import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Flame, Snowflake, Info } from 'lucide-react';

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

  const hasRealForm = standings.some(t => t.form != null);

  const teamsWithFormData = standings.map(team => ({
    ...team,
    formPoints: calculateFormPoints(team),
    pointsPerGame: getPointsPerGame(team),
    formArray: team.form ? team.form.split(',').slice(0, 5) : generateFallbackForm(team),
  }));

  const risingTeams = [...teamsWithFormData]
    .sort((a, b) => b.pointsPerGame - a.pointsPerGame)
    .slice(0, 5);

  const fallingTeams = [...teamsWithFormData]
    .sort((a, b) => a.pointsPerGame - b.pointsPerGame)
    .slice(0, 5);

  const renderTeamRow = (team: typeof teamsWithFormData[0], index: number, badge: string) => (
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
        <span className="text-xs text-muted-foreground">{badge}</span>
      </div>
      <div className="flex items-center gap-1">
        {team.formArray.map((result, i) => (
          <React.Fragment key={i}>{getFormIcon(result)}</React.Fragment>
        ))}
      </div>
    </motion.div>
  );

  const FallbackNotice = () => (
    !hasRealForm ? (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
        <Info className="w-3 h-3" />
        <span>Sezon geneli performansa göre hesaplanmıştır</span>
      </div>
    ) : null
  );

  // Streak cards: only show real streaks if form data exists
  const getWinStreak = (form: string | null): number => {
    if (!form) return 0;
    let streak = 0;
    for (const r of form.split(',')) {
      if (r.trim().toUpperCase() === 'W') streak++; else break;
    }
    return streak;
  };

  const getNoWinStreak = (form: string | null): number => {
    if (!form) return 0;
    let streak = 0;
    for (const r of form.split(',')) {
      if (r.trim().toUpperCase() !== 'W') streak++; else break;
    }
    return streak;
  };

  const hotStreaks = hasRealForm
    ? [...teamsWithFormData]
        .map(t => ({ ...t, winStreak: getWinStreak(t.form) }))
        .filter(t => t.winStreak >= 2)
        .sort((a, b) => b.winStreak - a.winStreak)
        .slice(0, 5)
    : [];

  const coldStreaks = hasRealForm
    ? [...teamsWithFormData]
        .map(t => ({ ...t, noWinStreak: getNoWinStreak(t.form) }))
        .filter(t => t.noWinStreak >= 2)
        .sort((a, b) => b.noWinStreak - a.noWinStreak)
        .slice(0, 5)
    : [];

  const StreakUnavailable = () => (
    <div className="flex flex-col items-center gap-2 py-4 text-center">
      <Info className="w-5 h-5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Form verisi mevcut değil – genel performansa göre sıralama gösteriliyor
      </p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4 text-primary" />
            Yükselen Takımlar
          </CardTitle>
          <p className="text-xs text-muted-foreground">En iyi maç başı puan ortalaması</p>
          <FallbackNotice />
        </CardHeader>
        <CardContent className="space-y-3">
          {risingTeams.map((t, i) => renderTeamRow(t, i, `${t.pointsPerGame.toFixed(2)} puan/maç`))}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="w-4 h-4 text-destructive" />
            Düşüşte Olanlar
          </CardTitle>
          <p className="text-xs text-muted-foreground">En düşük maç başı puan ortalaması</p>
          <FallbackNotice />
        </CardHeader>
        <CardContent className="space-y-3">
          {fallingTeams.map((t, i) => renderTeamRow(t, i, `${t.pointsPerGame.toFixed(2)} puan/maç`))}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="w-4 h-4 text-orange-500" />
            Galibiyet Serisi
          </CardTitle>
          <p className="text-xs text-muted-foreground">Üst üste kazanan takımlar</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {!hasRealForm ? <StreakUnavailable /> : hotStreaks.length > 0 ? (
            hotStreaks.map((t, i) => renderTeamRow(t, i, `${t.winStreak} galibiyet`))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Şu an galibiyet serisinde takım yok</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Snowflake className="w-4 h-4 text-cyan-500" />
            Galibiyetsiz Seri
          </CardTitle>
          <p className="text-xs text-muted-foreground">Galibiyet alamayan takımlar</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {!hasRealForm ? <StreakUnavailable /> : coldStreaks.length > 0 ? (
            coldStreaks.map((t, i) => renderTeamRow(t, i, `${t.noWinStreak} maç galibiyetsiz`))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Şu an galibiyetsiz seride takım yok</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FormAnalysisTab;
