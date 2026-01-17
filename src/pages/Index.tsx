import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import HeroSection from '@/components/HeroSection';
import LegalDisclaimer from '@/components/LegalDisclaimer';
import BetSlipButton from '@/components/betslip/BetSlipButton';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import LeagueGrid from '@/components/league/LeagueGrid';
import MatchCarousel from '@/components/match/MatchCarousel';
import BottomNav from '@/components/navigation/BottomNav';
import CommandPalette from '@/components/navigation/CommandPalette';
import Onboarding from '@/components/Onboarding';
import TodaysMatches from '@/components/TodaysMatches';
import { MatchCardSkeleton } from '@/components/ui/skeletons';
import {
  MatchHeroCard,
  AIRecommendationCard,
  PredictionPillSelector,
  QuickStatsRow,
  H2HTimeline,
  CollapsibleAnalysis,
  AnalysisLoadingState,
} from '@/components/analysis';
import { MatchInput } from '@/types/match';
import { Match as ApiMatch, SUPPORTED_COMPETITIONS, CompetitionCode } from '@/types/footballApi';
import { useMatchAnalysis } from '@/hooks/useMatchAnalysis';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useHomeData } from '@/hooks/useHomeData';
import { Calendar, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { footballApiRequest } from '@/services/apiRequestManager';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { analysis, isLoading: analysisLoading, analyzeMatch } = useMatchAnalysis();
  const { user } = useAuth();
  const { showOnboarding, completeOnboarding } = useOnboarding();
  
  // Refs for scroll behavior
  const upcomingMatchesRef = useRef<HTMLDivElement>(null);
  
  // Centralized data fetching - single source of truth
  const { stats, liveMatches, todaysMatches, isLoading: homeDataLoading, refetch, syncMatches } = useHomeData();
  
  const [selectedLeague, setSelectedLeague] = useState<CompetitionCode | ''>('');
  const [upcomingMatches, setUpcomingMatches] = useState<ApiMatch[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // Footer stats - derived from useHomeData
  const footerStats = {
    totalAnalysis: stats.todayPredictions,
    accuracy: stats.accuracy,
    premiumAccuracy: stats.premiumAccuracy
  };

  // Handle match from Live page navigation
  useEffect(() => {
    const state = location.state as { selectedMatch?: ApiMatch } | null;
    if (state?.selectedMatch) {
      handleMatchSelect(state.selectedMatch);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch upcoming matches when league changes (using centralized rate-limited manager)
  const fetchUpcomingMatches = useCallback(async (leagueCode: CompetitionCode) => {
    setIsLoadingMatches(true);
    try {
      const response = await footballApiRequest<{ matches: ApiMatch[] }>({
        action: 'matches',
        competitionCode: leagueCode,
        status: 'SCHEDULED',
      });
      if (response?.matches) {
        setUpcomingMatches(response.matches.slice(0, 10));
      }
    } catch (e) {
      console.error('Error fetching matches:', e);
      toast.error('Maç verileri yüklenirken hata oluştu. Lütfen biraz bekleyip tekrar deneyin.');
    } finally {
      setIsLoadingMatches(false);
    }
  }, []);

  useEffect(() => {
    if (selectedLeague) {
      fetchUpcomingMatches(selectedLeague);
    }
  }, [selectedLeague, fetchUpcomingMatches]);

  const handleLeagueSelect = (code: CompetitionCode) => {
    setSelectedLeague(code);
    
    // Show toast notification
    const leagueName = SUPPORTED_COMPETITIONS.find(c => c.code === code)?.name || code;
    toast.info(`${leagueName} maçları yükleniyor...`, {
      duration: 2000,
    });

    // Scroll to upcoming matches section after a short delay
    setTimeout(() => {
      upcomingMatchesRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 300);
  };

  // Track which match is currently loading analysis with its info
  const [loadingMatchId, setLoadingMatchId] = useState<number | null>(null);
  const [analyzingMatchInfo, setAnalyzingMatchInfo] = useState<{
    homeTeam: string;
    awayTeam: string;
    homeTeamCrest?: string;
    awayTeamCrest?: string;
  } | null>(null);
  const analysisLoadingRef = useRef<HTMLDivElement>(null);

  const handleMatchSelect = async (match: ApiMatch) => {
    // Set loading state immediately for instant feedback
    setLoadingMatchId(match.id);
    setAnalyzingMatchInfo({
      homeTeam: match.homeTeam.shortName || match.homeTeam.name,
      awayTeam: match.awayTeam.shortName || match.awayTeam.name,
      homeTeamCrest: match.homeTeam.crest,
      awayTeamCrest: match.awayTeam.crest,
    });
    
    // Scroll to the loading state section
    setTimeout(() => {
      analysisLoadingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    const leagueCode = SUPPORTED_COMPETITIONS.find(
      c => c.code === match.competition.code
    )?.code || 'PL';
    
    const matchInput: MatchInput = {
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      league: leagueCode,
      matchDate: match.utcDate.split('T')[0],
    };
    
    try {
      await analyzeMatch(matchInput);
      
      // Scroll to analysis section after completion
      setTimeout(() => {
        document.getElementById('analysis-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      toast.error('Analiz yüklenirken hata oluştu');
    } finally {
      setLoadingMatchId(null);
      setAnalyzingMatchInfo(null);
    }
  };

  const handleFormSubmit = async (data: MatchInput) => {
    await analyzeMatch(data);
    setTimeout(() => {
      document.getElementById('analysis-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCommandLeagueSelect = (code: string) => {
    setSelectedLeague(code as CompetitionCode);
  };

  const searchButton = (
    <Button 
      variant="outline" 
      size="sm" 
      className="hidden md:flex gap-2 text-muted-foreground"
      onClick={() => setCommandOpen(true)}
      aria-label="Takım veya lig ara"
    >
      <Search className="w-4 h-4" />
      <span>Ara...</span>
      <kbd className="ml-2 px-1.5 py-0.5 text-[10px] bg-muted rounded">⌘K</kbd>
    </Button>
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <AppHeader rightContent={searchButton} />

      {/* Hero Section - Simplified with count-up */}
      <HeroSection stats={stats} />

      {/* Main Content - Clean Single Column Flow */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* League Selection - Compact Pills with Scroll Indicator */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <LeagueGrid 
            selectedLeague={selectedLeague} 
            onLeagueSelect={handleLeagueSelect}
            liveMatches={liveMatches}
          />
        </motion.section>

        {/* Today's Matches - Full Width with Featured & Stagger Animation */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <TodaysMatches 
            matches={todaysMatches}
            isLoading={homeDataLoading}
            loadingMatchId={loadingMatchId}
            onMatchSelect={handleMatchSelect}
            onSync={async () => {
              toast.loading('Maçlar senkronize ediliyor...', { id: 'sync' });
              await syncMatches();
              // Wait a bit then refetch from database
              setTimeout(async () => {
                await refetch();
                toast.success('Maçlar güncellendi!', { id: 'sync' });
              }, 3000);
            }}
          />
        </motion.section>

        {/* Upcoming Matches Carousel - Only when league selected */}
        {selectedLeague && (
          <motion.section 
            ref={upcomingMatchesRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">
                  Yaklaşan Maçlar
                </h2>
                <span className="text-sm text-muted-foreground">
                  {SUPPORTED_COMPETITIONS.find(c => c.code === selectedLeague)?.name}
                </span>
              </div>
            </div>
            
            {isLoadingMatches ? (
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[280px] md:w-[320px]">
                    <MatchCardSkeleton />
                  </div>
                ))}
              </div>
            ) : (
              <MatchCarousel 
                matches={upcomingMatches} 
                onMatchSelect={handleMatchSelect}
              />
            )}
          </motion.section>
        )}

        {/* In-Page Loading State */}
        <AnimatePresence>
          {analysisLoading && analyzingMatchInfo && (
            <motion.div
              ref={analysisLoadingRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              id="analysis-loading-section"
            >
              <AnalysisLoadingState
                homeTeam={analyzingMatchInfo.homeTeam}
                awayTeam={analyzingMatchInfo.awayTeam}
                homeTeamCrest={analyzingMatchInfo.homeTeamCrest}
                awayTeamCrest={analyzingMatchInfo.awayTeamCrest}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis Section */}
        <AnimatePresence>
          {analysis && !analysisLoading && (
            <motion.section 
              id="analysis-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Match Hero Card */}
              <MatchHeroCard 
                match={analysis.input} 
                insights={analysis.insights}
                homeTeamCrest={analysis.input.homeTeamCrest}
                awayTeamCrest={analysis.input.awayTeamCrest}
              />

              {/* AI Recommendation + Prediction Pills */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AIRecommendationCard 
                  predictions={analysis.predictions} 
                  matchInput={analysis.input} 
                />
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <h4 className="text-sm font-semibold text-foreground mb-4">Tüm Tahminler</h4>
                    <PredictionPillSelector 
                      predictions={analysis.predictions} 
                      matchInput={analysis.input} 
                    />
                  </div>
                </div>
              </div>

              {/* Quick Stats Row */}
              <QuickStatsRow
                homeTeam={analysis.input.homeTeam}
                awayTeam={analysis.input.awayTeam}
                homeStats={analysis.homeTeamStats}
                awayStats={analysis.awayTeamStats}
                homePower={analysis.homePower}
                awayPower={analysis.awayPower}
              />

              {/* H2H Timeline */}
              <H2HTimeline
                h2h={analysis.headToHead}
                homeTeam={analysis.input.homeTeam}
                awayTeam={analysis.input.awayTeam}
              />

              {/* Collapsible Advanced Analysis */}
              <CollapsibleAnalysis analysis={analysis} />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={() => analyzeMatch(analysis.input)}
                >
                  <RefreshCw className="w-4 h-4" />
                  Yeniden Analiz
                </Button>
              </div>

              {/* Legal Disclaimer */}
              <LegalDisclaimer />
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <AppFooter />

      {/* Bet Slip Floating Button */}
      <BetSlipButton />

      {/* Bottom Navigation */}
      <BottomNav onSearchClick={() => setCommandOpen(true)} />

      {/* Command Palette */}
      <CommandPalette 
        open={commandOpen} 
        onOpenChange={setCommandOpen}
        onLeagueSelect={handleCommandLeagueSelect}
      />

      {/* Onboarding */}
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding onComplete={completeOnboarding} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
