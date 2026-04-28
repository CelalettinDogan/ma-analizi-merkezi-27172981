import React, { useState, useEffect, useCallback } from 'react';
import { Radio, Loader2, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LiveMatchCard from './LiveMatchCard';
import { Match, CompetitionCode, SUPPORTED_COMPETITIONS } from '@/types/footballApi';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import i18n from '@/i18n/config';

interface LiveMatchesSectionProps {
  onSelectMatch?: (match: Match) => void;
}

const REFRESH_INTERVAL = 30000; // 30 seconds

const LIVE_LOCALE_MAP: Record<string, string> = { tr: 'tr-TR', en: 'en-US', de: 'de-DE', es: 'es-ES', ar: 'ar-EG' };

const LiveMatchesSection: React.FC<LiveMatchesSectionProps> = ({ onSelectMatch }) => {
  const { t } = useTranslation('home');
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<CompetitionCode | 'ALL'>('ALL');
  const [error, setError] = useState<string | null>(null);

  // Fetch from cached_live_matches table (no API rate limits!)
  const fetchLiveMatches = useCallback(async () => {
    setError(null);

    try {
      const allowedCodes = selectedLeague === 'ALL'
        ? SUPPORTED_COMPETITIONS.map(c => c.code)
        : [selectedLeague];

      const { data, error: fetchError } = await supabase
        .from('cached_live_matches')
        .select('*')
        .in('competition_code', allowedCodes)
        .order('utc_date', { ascending: true });

      if (fetchError) throw fetchError;

      // Transform cached data to Match format
      const allMatches: Match[] = (data || []).map(m => ({
        id: m.match_id,
        utcDate: m.utc_date,
        status: m.status as Match['status'],
        matchday: m.matchday ?? 0,
        minute: m.minute ?? undefined,
        competition: {
          id: 0,
          code: m.competition_code as CompetitionCode,
          name: m.competition_name || '',
          emblem: '',
          area: { id: 0, name: '', code: '', flag: '' },
        },
        homeTeam: {
          id: m.home_team_id ?? 0,
          name: m.home_team_name,
          shortName: m.home_team_name,
          tla: '',
          crest: m.home_team_crest ?? '',
        },
        awayTeam: {
          id: m.away_team_id ?? 0,
          name: m.away_team_name,
          shortName: m.away_team_name,
          tla: '',
          crest: m.away_team_crest ?? '',
        },
        score: {
          winner: null,
          fullTime: { home: m.home_score ?? null, away: m.away_score ?? null },
          halfTime: { home: m.half_time_home ?? null, away: m.half_time_away ?? null },
        },
      }));

      setLiveMatches(allMatches);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Error fetching live matches:', e);
      setError(t('live.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedLeague, t]);

  // Initial load and when league changes
  useEffect(() => {
    setIsLoading(true);
    fetchLiveMatches();
  }, [selectedLeague]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLiveMatches();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchLiveMatches]);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchLiveMatches();
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    const lang = (i18n.language || 'tr').split('-')[0];
    return lastUpdated.toLocaleTimeString(LIVE_LOCALE_MAP[lang] || 'tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-6 h-6 text-red-500" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{t('live.title')}</h2>
            <p className="text-xs text-muted-foreground">
              {lastUpdated && t('live.lastUpdated', { time: formatLastUpdated() })}
            </p>
          </div>
          {liveMatches.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {t('live.matchesCount', { count: liveMatches.length })}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={selectedLeague}
            onValueChange={(value) => setSelectedLeague(value as CompetitionCode | 'ALL')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('live.selectLeague')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('live.allLeagues')}</SelectItem>
              {SUPPORTED_COMPETITIONS.map((comp) => (
                <SelectItem key={comp.code} value={comp.code}>
                  {comp.flag} {comp.name}
                </SelectItem>
              ))}
          </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">{t('live.loading')}</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <WifiOff className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={handleRefresh} className="mt-4">
            {t('live.retry')}
          </Button>
        </div>
      ) : liveMatches.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed border-border">
          <Radio className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-1">{t('live.emptyTitle')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('live.emptyDescription')}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {t('live.emptyHint')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveMatches.map((match) => (
            <LiveMatchCard
              key={match.id}
              match={match}
              onClick={() => onSelectMatch?.(match)}
            />
          ))}
        </div>
      )}

      {/* Auto-refresh indicator */}
      {!isLoading && liveMatches.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>{t('live.autoRefresh')}</span>
        </div>
      )}
    </div>
  );
};

export default LiveMatchesSection;
