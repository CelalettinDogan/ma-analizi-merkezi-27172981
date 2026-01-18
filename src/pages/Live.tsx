import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, RefreshCw, Loader2, WifiOff, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/layout/AppHeader';
import LiveMatchCard2 from '@/components/live/LiveMatchCard2';
import LeagueGrid from '@/components/league/LeagueGrid';
import BottomNav from '@/components/navigation/BottomNav';
import CommandPalette from '@/components/navigation/CommandPalette';
import { Match, CompetitionCode, SUPPORTED_COMPETITIONS } from '@/types/footballApi';
import { supabase } from '@/integrations/supabase/client';
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/animations';
import { toast } from 'sonner';

const REFRESH_INTERVAL = 15000; // 15 seconds - faster since we read from cache

// Transform cached match to Match type
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
    fullTime: {
      home: cached.home_score,
      away: cached.away_score
    },
    halfTime: {
      home: cached.half_time_home,
      away: cached.half_time_away
    }
  }
});

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
  
  // Ref for cleanup
  const isMountedRef = React.useRef(true);

  // Fetch from database cache
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
        // Default to first 2 leagues if none selected
        const defaultCodes = SUPPORTED_COMPETITIONS.slice(0, 2).map(c => c.code);
        query = query.in('competition_code', defaultCodes);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      if (!isMountedRef.current) return;

      const matches = (data || []).map(transformCachedLiveMatch);
      setLiveMatches(matches);
      
      // Get last updated time from most recent record
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

  // Trigger sync edge function
  const syncLiveMatches = useCallback(async () => {
    if (!isMountedRef.current) return;
    setIsSyncing(true);
    try {
      const { error: syncError } = await supabase.functions.invoke('sync-live-matches');
      if (syncError) throw syncError;
      
      // Refetch from cache after sync
      await fetchFromCache();
      if (isMountedRef.current) {
        toast.success('Canlı maçlar güncellendi');
      }
    } catch (e) {
      console.error('Sync error:', e);
      if (isMountedRef.current) {
        toast.error('Senkronizasyon hatası');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSyncing(false);
      }
    }
  }, [fetchFromCache]);

  // Initial load and cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    const init = async () => {
      if (!isMountedRef.current) return;
      setIsLoading(true);
      // First fetch from cache
      await fetchFromCache();
      // Then trigger sync in background
      if (isMountedRef.current) {
        syncLiveMatches();
      }
    };
    init();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [selectedLeague]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh from cache
  useEffect(() => {
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        fetchFromCache();
      }
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchFromCache]);

  const handleMatchSelect = (match: Match) => {
    navigate('/', { state: { selectedMatch: match } });
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await syncLiveMatches();
  };

  const headerRightContent = lastUpdated ? (
    <span className="text-xs text-muted-foreground hidden sm:block">
      {formatLastUpdated()}
    </span>
  ) : null;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <AppHeader rightContent={headerRightContent} />

      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-x-hidden">
        {/* League Filter */}
        <motion.div {...fadeInUp}>
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3">Lig Filtresi</h3>
          <LeagueGrid 
            selectedLeague={selectedLeague} 
            onLeagueSelect={(code) => setSelectedLeague(code === selectedLeague ? '' : code)}
          />
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Canlı maçlar yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <WifiOff className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={handleRefresh}>
              Tekrar Dene
            </Button>
          </div>
        ) : liveMatches.length === 0 ? (
          <motion.div 
            {...fadeInUp}
            className="rounded-2xl bg-gradient-to-br from-card via-card to-muted/20 border border-border/50 overflow-hidden"
          >
            <div className="relative p-6 sm:p-8 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
              <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center border border-border/50">
                  <Radio className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                </div>
                
                <h3 className="font-display font-bold text-lg sm:text-xl mb-2">Şu an canlı maç yok</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mb-4 sm:mb-6 px-2">
                  Desteklenen liglerde şu anda oynanmakta olan maç bulunmuyor. Sayfa her 15 saniyede otomatik güncellenir.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                  <Button 
                    variant="default" 
                    onClick={() => navigate('/')}
                    className="gap-2 w-full sm:w-auto"
                    size="sm"
                  >
                    <Trophy className="w-4 h-4" />
                    Yaklaşan Maçlara Git
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleRefresh}
                    disabled={isSyncing}
                    className="gap-2 w-full sm:w-auto"
                    size="sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    Yenile
                  </Button>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border/30 bg-muted/10">
              <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-primary/50"
                />
                <span>Otomatik güncelleme aktif</span>
              </div>
            </div>
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

        {/* Auto-refresh indicator */}
        {!isLoading && liveMatches.length > 0 && (
          <motion.div 
            {...fadeInUp}
            className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-muted-foreground"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-green-500"
            />
            <span>Otomatik güncelleme aktif (15 sn)</span>
          </motion.div>
        )}
      </main>

      <BottomNav onSearchClick={() => setCommandOpen(true)} />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
};

export default LivePage;
