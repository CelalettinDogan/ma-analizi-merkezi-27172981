import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';
import LiveMatchCard2 from '@/components/live/LiveMatchCard2';
import WCHeroBanner from '@/components/wc/WCHeroBanner';
import StageChipSelector, { StageChip } from '@/components/wc/StageChipSelector';
import WCStandingsCard, { WCStandingRow } from '@/components/wc/WCStandingsCard';
import UpcomingWCCard from '@/components/wc/UpcomingWCCard';
import { Match, CompetitionCode } from '@/types/footballApi';
import { supabase } from '@/integrations/supabase/client';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

const REFRESH_INTERVAL = 60_000;

const transformLive = (c: any): Match => ({
  id: c.match_id,
  utcDate: c.utc_date,
  status: c.status as Match['status'],
  matchday: c.matchday || undefined,
  competition: {
    id: 0,
    name: c.competition_name || 'World Cup',
    code: c.competition_code as CompetitionCode,
    emblem: '',
    area: { id: 0, name: '', code: '', flag: '🏆' },
  },
  homeTeam: {
    id: c.home_team_id || 0,
    name: c.home_team_name,
    shortName: c.home_team_name,
    tla: (c.home_team_name || '').substring(0, 3).toUpperCase(),
    crest: c.home_team_crest || '',
  },
  awayTeam: {
    id: c.away_team_id || 0,
    name: c.away_team_name,
    shortName: c.away_team_name,
    tla: (c.away_team_name || '').substring(0, 3).toUpperCase(),
    crest: c.away_team_crest || '',
  },
  score: {
    winner: null,
    fullTime: { home: c.home_score, away: c.away_score },
    halfTime: { home: c.half_time_home, away: c.half_time_away },
  },
});

const transformMatch = (c: any): Match => ({
  id: c.match_id,
  utcDate: c.utc_date,
  status: c.status as Match['status'],
  matchday: c.matchday || undefined,
  competition: {
    id: 0,
    name: c.competition_name || 'World Cup',
    code: c.competition_code as CompetitionCode,
    emblem: '',
    area: { id: 0, name: '', code: '', flag: '🏆' },
  },
  homeTeam: {
    id: c.home_team_id || 0,
    name: c.home_team_name,
    shortName: c.home_team_name,
    tla: (c.home_team_name || '').substring(0, 3).toUpperCase(),
    crest: c.home_team_crest || '',
  },
  awayTeam: {
    id: c.away_team_id || 0,
    name: c.away_team_name,
    shortName: c.away_team_name,
    tla: (c.away_team_name || '').substring(0, 3).toUpperCase(),
    crest: c.away_team_crest || '',
  },
  score: {
    winner: null,
    fullTime: { home: null, away: null },
    halfTime: { home: null, away: null },
  },
  // Carry stage/group through (read by UpcomingWCCard)
  ...(c.stage ? { stage: c.stage } : {}),
  ...(c.group_name ? { group_name: c.group_name } : {}),
} as Match);

const LivePage: React.FC = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const isMountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    try {
      const [liveRes, upcomingRes, standingsRes] = await Promise.all([
        supabase
          .from('cached_live_matches')
          .select('*')
          .eq('competition_code', 'WC')
          .order('utc_date', { ascending: true }),
        supabase
          .from('cached_matches')
          .select('*')
          .eq('competition_code', 'WC')
          .gte('utc_date', new Date().toISOString())
          .in('status', ['SCHEDULED', 'TIMED'])
          .order('utc_date', { ascending: true })
          .limit(8),
        supabase
          .from('cached_standings')
          .select('*')
          .eq('competition_code', 'WC')
          .order('group_name', { ascending: true })
          .order('position', { ascending: true }),
      ]);

      if (!isMountedRef.current) return;

      setLiveMatches((liveRes.data || []).map(transformLive));
      setUpcomingMatches((upcomingRes.data || []).map(transformMatch));
      setStandings(standingsRes.data || []);
    } catch (e) {
      console.error('WC fetch error:', e);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchAll();
    const id = setInterval(() => {
      if (isMountedRef.current) fetchAll();
    }, REFRESH_INTERVAL);
    return () => {
      isMountedRef.current = false;
      clearInterval(id);
    };
  }, [fetchAll]);

  // Derive unique group labels from standings
  const groupLabels = useMemo(() => {
    const set = new Set<string>();
    standings.forEach((s) => { if (s.group_name) set.add(s.group_name); });
    return Array.from(set).sort();
  }, [standings]);

  // Stage chips: "All" + Groups
  const chips: StageChip[] = useMemo(() => {
    const base: StageChip[] = [{ id: 'ALL', label: t('wc.stages.all') }];
    groupLabels.forEach((g) => {
      // group_name examples: "GROUP_A" or "Group A"
      const letter = g.replace(/group[_\s-]*/i, '').trim().toUpperCase() || g;
      base.push({ id: g, label: t('wc.stages.group', { letter }) });
    });
    return base;
  }, [groupLabels, t]);

  // Default selected: first group
  useEffect(() => {
    if (!selectedGroup && groupLabels.length > 0) {
      setSelectedGroup(groupLabels[0]);
    }
  }, [groupLabels, selectedGroup]);

  // Filter live & upcoming by selected stage (ALL = no filter)
  const filteredLive = useMemo(() => {
    if (selectedGroup === 'ALL' || !selectedGroup) return liveMatches;
    return liveMatches.filter((m) => (m as any).group_name === selectedGroup);
  }, [liveMatches, selectedGroup]);

  const filteredUpcoming = useMemo(() => {
    if (selectedGroup === 'ALL' || !selectedGroup) return upcomingMatches;
    const filtered = upcomingMatches.filter((m) => (m as any).group_name === selectedGroup);
    return filtered.length > 0 ? filtered : upcomingMatches;
  }, [upcomingMatches, selectedGroup]);

  const selectedGroupStandings: WCStandingRow[] = useMemo(() => {
    if (!selectedGroup || selectedGroup === 'ALL') {
      // fall back to first group if "All"
      const first = groupLabels[0];
      return standings.filter((s) => s.group_name === first);
    }
    return standings.filter((s) => s.group_name === selectedGroup);
  }, [standings, selectedGroup, groupLabels]);

  const handleMatchSelect = (match: Match) => {
    navigate('/', { state: { selectedMatch: match } });
  };

  const groupDisplayLabel = useMemo(() => {
    const g = selectedGroup === 'ALL' ? groupLabels[0] : selectedGroup;
    if (!g) return '';
    const letter = g.replace(/group[_\s-]*/i, '').trim().toUpperCase() || g;
    return t('wc.stages.group', { letter });
  }, [selectedGroup, groupLabels, t]);

  const hasLive = filteredLive.length > 0;
  const displayCards = hasLive ? filteredLive.slice(0, 6) : filteredUpcoming.slice(0, 3);
  const isUpcomingMode = !hasLive;

  return (
    <div className="h-screen bg-background flex flex-col">
      <AppHeader />

      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="container mx-auto px-3 py-4 space-y-4">
          {/* Hero */}
          <WCHeroBanner />

          {/* Stage Chips */}
          {chips.length > 1 && (
            <motion.div {...fadeInUp}>
              <StageChipSelector
                chips={chips}
                selectedId={selectedGroup || 'ALL'}
                onSelect={setSelectedGroup}
              />
            </motion.div>
          )}

          {/* Matches Section */}
          <motion.div {...fadeInUp} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
                {isUpcomingMode ? t('wc.upcomingTitle') : t('wc.ongoingTitle')}
              </h2>
              {hasLive && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-destructive">
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inset-0 rounded-full bg-destructive animate-ping opacity-75" />
                    <span className="relative w-1.5 h-1.5 rounded-full bg-destructive" />
                  </span>
                  {t('wc.liveCount', { count: filteredLive.length })}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : displayCards.length === 0 ? (
              <div className="rounded-2xl bg-card/40 border border-border/30 px-4 py-8 text-center">
                <p className="text-xs text-muted-foreground">{t('wc.empty')}</p>
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-3"
              >
                {displayCards.map((match) => (
                  <motion.div key={match.id} variants={staggerItem}>
                    {hasLive ? (
                      <LiveMatchCard2 match={match} onClick={() => handleMatchSelect(match)} />
                    ) : (
                      <UpcomingWCCard match={match} onClick={() => handleMatchSelect(match)} />
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Group Standings */}
          {!isLoading && selectedGroupStandings.length > 0 && (
            <motion.div {...fadeInUp}>
              <WCStandingsCard
                groupLabel={groupDisplayLabel}
                rows={selectedGroupStandings as WCStandingRow[]}
              />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LivePage;
