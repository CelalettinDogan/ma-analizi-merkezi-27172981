import React, { useState, useEffect, useCallback } from 'react';
import { Radio, RefreshCw, Loader2, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LiveMatchCard from './LiveMatchCard';
import { Match, CompetitionCode, SUPPORTED_COMPETITIONS } from '@/types/footballApi';
import { footballApiRequest } from '@/services/apiRequestManager';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LiveMatchesSectionProps {
  onSelectMatch?: (match: Match) => void;
}

const REFRESH_INTERVAL = 30000; // 30 seconds

const LiveMatchesSection: React.FC<LiveMatchesSectionProps> = ({ onSelectMatch }) => {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<CompetitionCode | 'ALL'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveMatches = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const allowedCodes = selectedLeague === 'ALL'
        ? new Set(SUPPORTED_COMPETITIONS.map(c => c.code))
        : new Set([selectedLeague]);

      const response = await footballApiRequest<{ matches: Match[] }>({
        action: 'live',
      });

      const allMatches: Match[] = (response?.matches || [])
        .filter(m => allowedCodes.has(m.competition?.code as CompetitionCode))
        .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

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
    fetchLiveMatches(true);
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString('tr-TR', { 
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
            <h2 className="text-xl font-bold">Canlı Maçlar</h2>
            <p className="text-xs text-muted-foreground">
              {lastUpdated && `Son güncelleme: ${formatLastUpdated()}`}
            </p>
          </div>
          {liveMatches.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {liveMatches.length} maç
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={selectedLeague}
            onValueChange={(value) => setSelectedLeague(value as CompetitionCode | 'ALL')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lig seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tüm Ligler</SelectItem>
              {SUPPORTED_COMPETITIONS.map((comp) => (
                <SelectItem key={comp.code} value={comp.code}>
                  {comp.flag} {comp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Canlı maçlar yükleniyor...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <WifiOff className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={handleRefresh} className="mt-4">
            Tekrar Dene
          </Button>
        </div>
      ) : liveMatches.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed border-border">
          <Radio className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-1">Şu an canlı maç yok</h3>
          <p className="text-sm text-muted-foreground">
            Desteklenen liglerde şu anda oynanmakta olan maç bulunmuyor.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Her 30 saniyede otomatik güncellenir
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
          <span>Otomatik güncelleme aktif (30 sn)</span>
        </div>
      )}
    </div>
  );
};

export default LiveMatchesSection;
