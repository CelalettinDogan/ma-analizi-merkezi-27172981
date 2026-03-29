import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, WifiOff, Trophy, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppHeader from '@/components/layout/AppHeader';
import LiveMatchCard2 from '@/components/live/LiveMatchCard2';
import LeagueGrid from '@/components/league/LeagueGrid';
import { Skeleton } from '@/components/ui/skeleton';
import CommandPalette from '@/components/navigation/CommandPalette';
import { Match, CompetitionCode, SUPPORTED_COMPETITIONS } from '@/types/footballApi';
import { supabase } from '@/integrations/supabase/client';
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/animations';
import { toast } from 'sonner';
import { getTeamNextMatch } from '@/services/footballApiService';

const REFRESH_INTERVAL = 60000;

const transformCachedLiveMatch = (cached: {
  match_id: number;
  competition_code: string;
  competition_name: string | null;
  home_team_id: number | null;
  home_team_name: string;
  home_team_crest: string | null;
  away_team_id: number | null;
  away_team_name: string;
  away_team_crest: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
  matchday: number | null;
  utc_date: string;
  half_time_home: number | null;
  half_time_away: number | null;
  updated_at: string | null;
}): Match => ({
  id: cached.match_id,
  utcDate: cached.utc_date,
  status: cached.status as Match['status'],
  matchday: cached.matchday || undefined,
  competition: {
    id: 0,
    name: cached.competition_name || '',
    code: cached.competition_code as CompetitionCode,
    emblem: '',
    area: { id: 0, name: '', code: '', flag: '' }
  },
  homeTeam: {
    id: cached.home_team_id || 0,
    name: cached.home_team_name,
    shortName: cached.home_team_name,
    tla: cached.home_team_name.substring(0, 3).toUpperCase(),
    crest: cached.home_team_crest || ''
  },
  awayTeam: {
    id: cached.away_team_id || 0,
    name: cached.away_team_name,
    shortName: cached.away_team_name,
    tla: cached.away_team_name.substring(0, 3).toUpperCase(),
    crest: cached.away_team_crest || ''
  },
  score: {
    winner: null,
    fullTime: { home: cached.home_score, away: cached.away_score },
    halfTime: { home: cached.half_time_home, away: cached.half_time_away }
  }
});

/* Skeleton for loading state */
const LiveMatchSkeleton = () => (
  <div className="p-4 rounded-2xl border border-border/50 bg-card space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Skeleton className="w-2.5 h-2.5 rounded-full" />
        <Skeleton className="w-10 h-3" />
      </div>
      <Skeleton className="w-20 h-3" />
    </div>
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 flex flex-col items-center gap-2">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-16 h-3" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <Skeleton className="w-20 h-8 rounded-lg" />
        <Skeleton className="w-10 h-3" />
      </div>
      <div className="flex-1 flex flex-col items-center gap-2">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-16 h-3" />
      </div>
    </div>
    <Skeleton className="w-full h-8 rounded-full" />
  </div>
);

const LivePage: React.FC = () => {
  const navigate = useNavigate();
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<CompetitionCode | ''>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const isMountedRef = React.useRef(true);

  const fetchFromCache = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      let query = supabase
        .from('cached_live_matches')
        .select('*')
        .order('utc_date', { ascending: true });

      if (selectedLeague) {
        query = query.eq('competition_code', selectedLeague);
      } else {
        const defaultCodes = SUPPORTED_COMPETITIONS.slice(0, 2).map(c => c.code);
        query = query.in('competition_code', defaultCodes);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      if (!isMountedRef.current) return;

      const matches = (data || []).map(transformCachedLiveMatch);
      setLiveMatches(matches);
      
      if (data && data.length > 0) {
        const latestUpdate = data.reduce((latest, m) => {
          const mTime = m.updated_at ? new Date(m.updated_at).getTime() : 0;
          return mTime > latest ? mTime : latest;
        }, 0);
        if (latestUpdate) setLastUpdated(new Date(latestUpdate));
      } else {
        setLastUpdated(new Date());
      }

      setError(null);
    } catch (e) {
      console.error('Error fetching from cache:', e);
      if (isMountedRef.current) {
        setError('Canlı maçlar yüklenirken hata oluştu');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [selectedLeague]);

  const syncLiveMatches = useCallback(async () => {
    if (!isMountedRef.current) return;
    setIsSyncing(true);
    await fetchFromCache();
    if (isMountedRef.current) {
      setIsSyncing(false);
    }
  }, [fetchFromCache]);

  useEffect(() => {
    isMountedRef.current = true;
    const init = async () => {
      if (!isMountedRef.current) return;
      setIsLoading(true);
      await fetchFromCache();
    };
    init();
    return () => { isMountedRef.current = false; };
  }, [selectedLeague]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const interval = setInterval(() => {
      if (isMountedRef.current) fetchFromCache();
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchFromCache]);

  const handleMatchSelect = (match: Match) => {
    navigate('/', { state: { selectedMatch: match } });
  };

  const handleCommandTeamSelect = async (teamName: string, leagueCode: string) => {
    setCommandOpen(false);
    toast.info(`${teamName} için maç aranıyor...`);
    try {
      const nextMatch = await getTeamNextMatch(teamName);
      if (nextMatch) {
        navigate('/', { state: { selectedMatch: nextMatch } });
      } else {
        toast.warning(`${teamName} için yaklaşan maç bulunamadı.`);
        navigate('/');
      }
    } catch (error) {
      console.error('Team match search error:', error);
      toast.error('Maç aranırken hata oluştu');
    }
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5 overflow-x-hidden">
          
          {/* Live Header */}
          <motion.div {...fadeInUp} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 bg-destructive rounded-full block" />
              <h1 className="font-display font-bold text-lg">Canlı Skorlar</h1>
              {!isLoading && liveMatches.length > 0 && (
                <Badge variant="secondary" className="text-micro font-semibold px-2 py-0.5">
                  {liveMatches.length} maç
                </Badge>
              )}
            </div>
          </motion.div>

          {/* League Filter with live match counts */}
          <motion.div {...fadeInUp}>
            <LeagueGrid 
              selectedLeague={selectedLeague} 
              onLeagueSelect={(code) => setSelectedLeague(code === selectedLeague ? '' : code)}
              liveMatches={liveMatches}
            />
          </motion.div>

          {/* Subtle delay note */}
          <p className="text-[10px] text-muted-foreground/50 text-center">Veriler ~15 dk gecikmeli olabilir</p>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3].map((i) => (
                <LiveMatchSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <WifiOff className="w-14 h-14 mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" onClick={syncLiveMatches} disabled={isSyncing} size="sm">
                Tekrar Dene
              </Button>
            </div>
          ) : liveMatches.length === 0 ? (
            <motion.div 
              {...fadeInUp}
              className="py-12 sm:py-16 text-center"
            >
              <Radio className="w-12 h-12 text-muted-foreground/25 mx-auto mb-5" />
              
              <h3 className="font-display font-bold text-base sm:text-lg mb-1.5">Şu an canlı maç yok</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-8">
                Desteklenen liglerde oynanmakta olan maç bulunmuyor.
              </p>

              <Button 
                variant="default" 
                onClick={() => navigate('/')}
                className="gap-2.5 rounded-xl h-12 px-6 font-semibold text-sm shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.35)] active:scale-[0.97] transition-all duration-200"
              >
                <Trophy className="w-4.5 h-4.5" />
                Yaklaşan Maçlara Git
              </Button>

              <p className="text-[11px] text-muted-foreground/40 mt-4">Maçlar başladığında burada görünecek</p>
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
            >
              <AnimatePresence mode="popLayout">
                {liveMatches.map((match) => (
                  <motion.div
                    key={match.id}
                    variants={staggerItem}
                    layout
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <LiveMatchCard2 match={match} onClick={() => handleMatchSelect(match)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

        </div>
      </main>

      <CommandPalette 
        open={commandOpen} 
        onOpenChange={setCommandOpen}
        onTeamSelect={handleCommandTeamSelect}
      />
    </div>
  );
};

export default LivePage;
