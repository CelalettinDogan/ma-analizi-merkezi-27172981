import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AppHeader from '@/components/layout/AppHeader';
import LeagueGrid from '@/components/league/LeagueGrid';
import CommandPalette from '@/components/navigation/CommandPalette';
import GoalStatsTab from '@/components/standings/GoalStatsTab';
import FormAnalysisTab from '@/components/standings/FormAnalysisTab';
import StandingsTable from '@/components/standings/StandingsTable';
import LeagueHeader from '@/components/standings/LeagueHeader';
import StandingsSegmentedControl from '@/components/standings/StandingsSegmentedControl';
import { CompetitionCode } from '@/types/footballApi';
import { supabase } from '@/integrations/supabase/client';
import { fadeInUp } from '@/lib/animations';

export interface CachedStanding {
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
  
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

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
        setStandings([]);
        setCompetitionName(selectedLeague);
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

  return (
    <div className="h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="container mx-auto px-3 py-4 space-y-3">
          {/* League Selector */}
          <motion.div {...fadeInUp}>
            <LeagueGrid 
              selectedLeague={selectedLeague} 
              onLeagueSelect={(code) => code && setSelectedLeague(code)}
            />
          </motion.div>

          {/* League Header */}
          <LeagueHeader
            competitionName={competitionName}
            selectedLeague={selectedLeague}
            lastUpdated={lastUpdated}
            hasData={standings.length > 0}
          />

          {/* Segmented Control */}
          <StandingsSegmentedControl activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content */}
          <motion.div {...fadeInUp}>
            {activeTab === 'standings' && (
              isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground text-sm">Puan durumu yükleniyor...</p>
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground mb-4 text-sm">{error}</p>
                  <Button variant="outline" onClick={() => fetchStandings()}>Tekrar Dene</Button>
                </div>
              ) : (
                <StandingsTable standings={standings} />
              )
            )}

            {activeTab === 'goals' && (
              <GoalStatsTab standings={standings} isLoading={isLoading} />
            )}

            {activeTab === 'form' && (
              <FormAnalysisTab standings={standings} isLoading={isLoading} />
            )}
          </motion.div>
        </div>
      </main>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
};

export default StandingsPage;
