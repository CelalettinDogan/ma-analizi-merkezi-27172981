import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import AppHeader from '@/components/layout/AppHeader';
import LeagueGrid from '@/components/league/LeagueGrid';
import BottomNav from '@/components/navigation/BottomNav';
import CommandPalette from '@/components/navigation/CommandPalette';
import { CompetitionCode } from '@/types/footballApi';
import { footballApiRequest } from '@/services/apiRequestManager';
import { fadeInUp } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface Standing {
  position: number;
  team: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  playedGames: number;
  form: string | null;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

interface StandingsData {
  competition: {
    name: string;
    emblem: string;
  };
  season: {
    currentMatchday: number;
  };
  standings: Array<{
    type: string;
    table: Standing[];
  }>;
}

const StandingsPage: React.FC = () => {
  const [selectedLeague, setSelectedLeague] = useState<CompetitionCode>('PL');
  const [standingsData, setStandingsData] = useState<StandingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);

  const fetchStandings = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    setError(null);

    try {
      const data = await footballApiRequest<StandingsData>({
        action: 'standings',
        competitionCode: selectedLeague,
      });

      setStandingsData(data);
    } catch (e) {
      console.error('Error fetching standings:', e);
      setError('Puan durumu yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchStandings();
  }, [selectedLeague]);

  const getPositionBg = (position: number, totalTeams: number): string => {
    // Champions League zone (top 4 for most leagues)
    if (position <= 4) return 'bg-primary/10 border-l-4 border-l-primary';
    // Europa League zone
    if (position <= 6) return 'bg-blue-500/10 border-l-4 border-l-blue-500';
    // Conference League zone (usually 7th)
    if (position === 7) return 'bg-cyan-500/10 border-l-4 border-l-cyan-500';
    // Relegation zone (bottom 3)
    if (position > totalTeams - 3) return 'bg-destructive/10 border-l-4 border-l-destructive';
    return '';
  };

  const getFormIcon = (result: string) => {
    switch (result.trim().toUpperCase()) {
      case 'W': return <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold border border-primary/30">G</span>;
      case 'D': return <span className="w-6 h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-xs font-bold border border-secondary/30">B</span>;
      case 'L': return <span className="w-6 h-6 rounded-full bg-destructive/20 text-destructive flex items-center justify-center text-xs font-bold border border-destructive/30">M</span>;
      default: return <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">-</span>;
    }
  };

  const table = standingsData?.standings?.find(s => s.type === 'TOTAL')?.table || [];

  const headerRightContent = (
    <Button
      variant="outline"
      size="icon"
      onClick={() => fetchStandings(true)}
      disabled={isRefreshing}
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
    </Button>
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <AppHeader rightContent={headerRightContent} />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* League Selector */}
        <motion.div {...fadeInUp}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Lig Seçin</h3>
          <LeagueGrid 
            selectedLeague={selectedLeague} 
            onLeagueSelect={(code) => code && setSelectedLeague(code)}
          />
        </motion.div>

        {/* Competition Header */}
        {standingsData && (
          <motion.div 
            {...fadeInUp}
            className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50"
          >
            {standingsData.competition?.emblem && (
              <img 
                src={standingsData.competition.emblem} 
                alt={standingsData.competition.name}
                className="w-12 h-12 object-contain"
              />
            )}
            <div>
              <h2 className="font-display font-bold text-lg">{standingsData.competition?.name}</h2>
              <p className="text-sm text-muted-foreground">
                2024/25 Sezonu • Hafta {standingsData.season?.currentMatchday}
              </p>
            </div>
          </motion.div>
        )}

        {/* Standings Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Puan durumu yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={() => fetchStandings(true)}>
              Tekrar Dene
            </Button>
          </div>
        ) : (
          <motion.div
            {...fadeInUp}
            className="rounded-xl border border-border/50 overflow-hidden bg-card"
          >
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead className="min-w-[180px]">Takım</TableHead>
                    <TableHead className="w-10 text-center">O</TableHead>
                    <TableHead className="w-10 text-center hidden sm:table-cell">G</TableHead>
                    <TableHead className="w-10 text-center hidden sm:table-cell">B</TableHead>
                    <TableHead className="w-10 text-center hidden sm:table-cell">M</TableHead>
                    <TableHead className="w-16 text-center hidden md:table-cell">AG</TableHead>
                    <TableHead className="w-16 text-center hidden md:table-cell">YG</TableHead>
                    <TableHead className="w-12 text-center">Av</TableHead>
                    <TableHead className="w-12 text-center font-bold">P</TableHead>
                    <TableHead className="w-32 text-center hidden lg:table-cell">Form</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.map((team, index) => (
                    <TableRow
                      key={team.team.id}
                      className={cn(
                        "hover:bg-muted/20 transition-colors",
                        getPositionBg(team.position, table.length)
                      )}
                    >
                      <TableCell className="text-center font-semibold">
                        {team.position}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {team.team.crest && (
                            <img 
                              src={team.team.crest} 
                              alt={team.team.name}
                              className="w-6 h-6 object-contain"
                            />
                          )}
                          <span className="font-medium truncate max-w-[120px] sm:max-w-none">
                            {team.team.shortName || team.team.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{team.playedGames}</TableCell>
                      <TableCell className="text-center hidden sm:table-cell text-primary font-medium">{team.won}</TableCell>
                      <TableCell className="text-center hidden sm:table-cell text-secondary">{team.draw}</TableCell>
                      <TableCell className="text-center hidden sm:table-cell text-destructive">{team.lost}</TableCell>
                      <TableCell className="text-center hidden md:table-cell">{team.goalsFor}</TableCell>
                      <TableCell className="text-center hidden md:table-cell">{team.goalsAgainst}</TableCell>
                      <TableCell className={cn(
                        "text-center font-medium",
                        team.goalDifference > 0 ? "text-primary" : team.goalDifference < 0 ? "text-destructive" : ""
                      )}>
                        {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                      </TableCell>
                      <TableCell className="text-center font-bold text-lg">{team.points}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center justify-center gap-1">
                          {team.form ? (
                            team.form.split(',').slice(0, 5).map((result, i) => (
                              <React.Fragment key={i}>
                                {getFormIcon(result)}
                              </React.Fragment>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* Legend */}
            <div className="p-4 border-t border-border/50 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary/50 border border-primary/50" />
                <span>Şampiyonlar Ligi</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500/50 border border-blue-500/50" />
                <span>Avrupa Ligi</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-cyan-500/50 border border-cyan-500/50" />
                <span>Konferans Ligi</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-destructive/50 border border-destructive/50" />
                <span>Düşme Hattı</span>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav onSearchClick={() => setCommandOpen(true)} />
      
      {/* Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
};

export default StandingsPage;
