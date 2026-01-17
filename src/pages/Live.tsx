import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, RefreshCw, Loader2, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppHeader from '@/components/layout/AppHeader';
import LiveMatchCard2 from '@/components/live/LiveMatchCard2';
import LeagueGrid from '@/components/league/LeagueGrid';
import BottomNav from '@/components/navigation/BottomNav';
import CommandPalette from '@/components/navigation/CommandPalette';
import { Match, CompetitionCode, SUPPORTED_COMPETITIONS } from '@/types/footballApi';
import { supabase } from '@/integrations/supabase/client';
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/animations';

const REFRESH_INTERVAL = 30000;

const LivePage: React.FC = () => {
  const navigate = useNavigate();
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<CompetitionCode | ''>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);

  const fetchLiveMatches = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    setError(null);

    try {
      // Fetch only selected league or first 2 leagues to avoid rate limits
      const competitions = selectedLeague 
        ? [selectedLeague]
        : SUPPORTED_COMPETITIONS.slice(0, 2).map(c => c.code);

      const allMatches: Match[] = [];

      // Sequential requests with delay to avoid rate limiting
      for (const code of competitions) {
        try {
          const { data, error: apiError } = await supabase.functions.invoke('football-api', {
            body: { action: 'matches', competitionCode: code, status: 'LIVE' },
          });
          
          if (apiError) {
            // Handle rate limit gracefully
            if (apiError.message?.includes('429') || apiError.message?.includes('rate')) {
              console.warn('Rate limited, using cached data if available');
              continue;
            }
          }
          
          if (data?.matches) allMatches.push(...data.matches);
          
          // Add small delay between requests to avoid rate limiting
          if (competitions.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (e) {
          console.error(`Error fetching live matches for ${code}:`, e);
        }
      }

      allMatches.sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
      setLiveMatches(allMatches);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Error fetching live matches:', e);
      setError('Canlı maçlar yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedLeague]);

  useEffect(() => {
    setIsLoading(true);
    fetchLiveMatches();
  }, [selectedLeague, fetchLiveMatches]);

  useEffect(() => {
    const interval = setInterval(() => fetchLiveMatches(), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchLiveMatches]);

  const handleMatchSelect = (match: Match) => {
    // Navigate to home with match data for analysis
    navigate('/', { state: { selectedMatch: match } });
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const headerRightContent = (
    <div className="flex items-center gap-2">
      {lastUpdated && (
        <span className="text-xs text-muted-foreground hidden sm:block">
          {formatLastUpdated()}
        </span>
      )}
      <Button
        variant="outline"
        size="icon"
        onClick={() => fetchLiveMatches(true)}
        disabled={isRefreshing}
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <AppHeader rightContent={headerRightContent} />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* League Filter */}
        <motion.div {...fadeInUp}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Lig Filtresi</h3>
          <LeagueGrid 
            selectedLeague={selectedLeague} 
            onLeagueSelect={(code) => setSelectedLeague(code === selectedLeague ? '' : code)}
            compact
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
            <Button variant="outline" onClick={() => fetchLiveMatches(true)}>
              Tekrar Dene
            </Button>
          </div>
        ) : liveMatches.length === 0 ? (
          <motion.div 
            {...fadeInUp}
            className="text-center py-16 rounded-2xl bg-muted/10 border border-dashed border-border"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
              <Radio className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Şu an canlı maç yok</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Desteklenen liglerde şu anda oynanmakta olan maç bulunmuyor. Her 30 saniyede otomatik güncellenir.
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
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
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-green-500"
            />
            <span>Otomatik güncelleme aktif (30 sn)</span>
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

export default LivePage;
