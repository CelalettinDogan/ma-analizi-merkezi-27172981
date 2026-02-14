import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Loader2, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import AppHeader from '@/components/layout/AppHeader';
import LeagueGrid from '@/components/league/LeagueGrid';

import CommandPalette from '@/components/navigation/CommandPalette';
import GoalStatsTab from '@/components/standings/GoalStatsTab';
import FormAnalysisTab from '@/components/standings/FormAnalysisTab';
import { CompetitionCode } from '@/types/footballApi';
import { supabase } from '@/integrations/supabase/client';
import { fadeInUp } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface CachedStanding {
  id: number;
  competition_code: string;
  competition_name: string | null;
  position: number;
  team_id: number;
  team_name: string;
  team_short_name: string | null;
  team_tla: string | null;
  team_crest: string | null;
  played_games: number;
  form: string | null;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  updated_at: string;
}

const StandingsPage: React.FC = () => {
  const [selectedLeague, setSelectedLeague] = useState<CompetitionCode>('PL');
  const [standings, setStandings] = useState<CachedStanding[]>([]);
  const [competitionName, setCompetitionName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('standings');
  
  // Refs for cleanup
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Fetch standings from database (no rate limit!)
  const fetchStandings = useCallback(async () => {
    if (!isMountedRef.current) return;
    setError(null);

    try {
      const { data, error } = await supabase
        .from('cached_standings')
        .select('*')
        .eq('competition_code', selectedLeague)
        .order('position', { ascending: true });

      if (error) throw error;
      if (!isMountedRef.current) return;

      if (data && data.length > 0) {
        setStandings(data as CachedStanding[]);
        setCompetitionName(data[0]?.competition_name || selectedLeague);
        setLastUpdated(data[0]?.updated_at || null);
      } else {
        // No cached data - pg_cron will populate it within 1 hour
        // No manual sync needed - reduces Cloud Balance usage
        setStandings([]);
        setCompetitionName(selectedLeague);
        console.log('No cached standings, pg_cron will sync shortly...');
      }
    } catch (e) {
      console.error('Error fetching standings:', e);
      if (isMountedRef.current) {
        setError('Puan durumu yüklenirken hata oluştu');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [selectedLeague]);

  useEffect(() => {
    setIsLoading(true);
    fetchStandings();
  }, [fetchStandings]);

  // Cleanup when component unmounts
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      toast.dismiss('sync-standings');
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

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
      case 'W': return <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] md:text-xs font-bold border border-primary/30">G</span>;
      case 'D': return <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-[10px] md:text-xs font-bold border border-secondary/30">B</span>;
      case 'L': return <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-destructive/20 text-destructive flex items-center justify-center text-[10px] md:text-xs font-bold border border-destructive/30">M</span>;
      default: return <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] md:text-xs">-</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      {/* Header */}
      <AppHeader />

      <main className="container mx-auto px-3 md:px-4 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* League Selector */}
        <motion.div {...fadeInUp}>
          <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-2 md:mb-3">Lig Seçin</h3>
          <LeagueGrid 
            selectedLeague={selectedLeague} 
            onLeagueSelect={(code) => code && setSelectedLeague(code)}
          />
        </motion.div>

        {/* Competition Header */}
        {standings.length > 0 && (
          <motion.div 
            {...fadeInUp}
            className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-card border border-border/50"
          >
            <div>
              <h2 className="font-display font-bold text-base md:text-lg">{competitionName}</h2>
              <p className="text-xs md:text-sm text-muted-foreground">
                2024/25 Sezonu
                {lastUpdated && (
                  <span className="ml-2 text-[10px] md:text-xs">
                    • Son güncelleme: {new Date(lastUpdated).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </p>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div {...fadeInUp}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="standings" className="flex items-center gap-1.5 text-xs md:text-sm">
                <Trophy className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Puan</span> Durumu
              </TabsTrigger>
              <TabsTrigger value="goals" className="flex items-center gap-1.5 text-xs md:text-sm">
                <Target className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Gol</span> İstatistik
              </TabsTrigger>
              <TabsTrigger value="form" className="flex items-center gap-1.5 text-xs md:text-sm">
                <TrendingUp className="w-3.5 h-3.5" />
                Form Analiz
              </TabsTrigger>
            </TabsList>

            {/* Standings Table Tab */}
            <TabsContent value="standings">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 md:py-16">
                  <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground text-sm md:text-base">Puan durumu yükleniyor...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12 md:py-16">
                  <Trophy className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4 text-sm md:text-base">{error}</p>
                  <Button variant="outline" onClick={() => fetchStandings()}>
                    Tekrar Dene
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="w-10 md:w-12 text-center text-xs md:text-sm">#</TableHead>
                          <TableHead className="min-w-[140px] md:min-w-[180px] text-xs md:text-sm">Takım</TableHead>
                          <TableHead className="w-8 md:w-10 text-center text-xs md:text-sm">O</TableHead>
                          <TableHead className="w-8 md:w-10 text-center hidden sm:table-cell text-xs md:text-sm">G</TableHead>
                          <TableHead className="w-8 md:w-10 text-center hidden sm:table-cell text-xs md:text-sm">B</TableHead>
                          <TableHead className="w-8 md:w-10 text-center hidden sm:table-cell text-xs md:text-sm">M</TableHead>
                          <TableHead className="w-12 md:w-16 text-center hidden md:table-cell text-xs md:text-sm">AG</TableHead>
                          <TableHead className="w-12 md:w-16 text-center hidden md:table-cell text-xs md:text-sm">YG</TableHead>
                          <TableHead className="w-10 md:w-12 text-center text-xs md:text-sm">Av</TableHead>
                          <TableHead className="w-10 md:w-12 text-center font-bold text-xs md:text-sm">P</TableHead>
                          <TableHead className="w-24 md:w-32 text-center hidden lg:table-cell text-xs md:text-sm">Form</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {standings.map((team) => (
                          <TableRow
                            key={team.team_id}
                            className={cn(
                              "hover:bg-muted/20 transition-colors",
                              getPositionBg(team.position, standings.length)
                            )}
                          >
                            <TableCell className="text-center font-semibold text-xs md:text-sm">
                              {team.position}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 md:gap-2">
                                {team.team_crest && (
                                  <img 
                                    src={team.team_crest} 
                                    alt={team.team_name}
                                    className="w-5 h-5 md:w-6 md:h-6 object-contain"
                                  />
                                )}
                                <span className="font-medium truncate max-w-[100px] md:max-w-none text-xs md:text-sm">
                                  {team.team_short_name || team.team_name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-xs md:text-sm">{team.played_games}</TableCell>
                            <TableCell className="text-center hidden sm:table-cell text-primary font-medium text-xs md:text-sm">{team.won}</TableCell>
                            <TableCell className="text-center hidden sm:table-cell text-secondary text-xs md:text-sm">{team.draw}</TableCell>
                            <TableCell className="text-center hidden sm:table-cell text-destructive text-xs md:text-sm">{team.lost}</TableCell>
                            <TableCell className="text-center hidden md:table-cell text-xs md:text-sm">{team.goals_for}</TableCell>
                            <TableCell className="text-center hidden md:table-cell text-xs md:text-sm">{team.goals_against}</TableCell>
                            <TableCell className={cn(
                              "text-center font-medium text-xs md:text-sm",
                              team.goal_difference > 0 ? "text-primary" : team.goal_difference < 0 ? "text-destructive" : ""
                            )}>
                              {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
                            </TableCell>
                            <TableCell className="text-center font-bold text-sm md:text-lg">{team.points}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <div className="flex items-center justify-center gap-0.5 md:gap-1">
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
                  <div className="p-3 md:p-4 border-t border-border/50 flex flex-wrap gap-2 md:gap-4 text-[10px] md:text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-primary/50 border border-primary/50" />
                      <span>Şampiyonlar Ligi</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-blue-500/50 border border-blue-500/50" />
                      <span>Avrupa Ligi</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-cyan-500/50 border border-cyan-500/50" />
                      <span>Konferans Ligi</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-destructive/50 border border-destructive/50" />
                      <span>Düşme Hattı</span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Goal Stats Tab */}
            <TabsContent value="goals">
              <GoalStatsTab standings={standings} isLoading={isLoading} />
            </TabsContent>

            {/* Form Analysis Tab */}
            <TabsContent value="form">
              <FormAnalysisTab standings={standings} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
};

export default StandingsPage;
