import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import HeroSection from '@/components/HeroSection';
import LegalDisclaimer from '@/components/LegalDisclaimer';
import { AnalysisSetButton } from '@/components/analysis-set';
import AppHeader from '@/components/layout/AppHeader';

import LeagueGrid from '@/components/league/LeagueGrid';
import MatchCarousel from '@/components/match/MatchCarousel';

import CommandPalette from '@/components/navigation/CommandPalette';
import Onboarding from '@/components/Onboarding';
import TodaysMatches from '@/components/TodaysMatches';
import { MatchCardSkeleton } from '@/components/ui/skeletons';
import PremiumPromotionModal from '@/components/premium/PremiumPromotionModal';
import AnalysisLimitBanner from '@/components/premium/AnalysisLimitBanner';
import AnalysisLimitSheet, { useAnalysisLimitSheet } from '@/components/premium/AnalysisLimitSheet';
import {
  AnalysisLoadingState,
} from '@/components/analysis';
import AnalysisDrawer from '@/components/analysis/AnalysisDrawer';
import { MatchInput } from '@/types/match';
import { Match as ApiMatch, SUPPORTED_COMPETITIONS, CompetitionCode } from '@/types/footballApi';
import { useMatchAnalysis } from '@/hooks/useMatchAnalysis';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useHomeData } from '@/hooks/useHomeData';
import { useAnalysisLimit } from '@/hooks/useAnalysisLimit';
import { usePremiumPromotion } from '@/hooks/usePremiumPromotion';
import { usePlatformPremium } from '@/hooks/usePlatformPremium';
import { Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getUpcomingMatches, getTeamNextMatch } from '@/services/footballApiService';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { analysis, isLoading: analysisLoading, analyzeMatch } = useMatchAnalysis();
  const { user } = useAuth();
  const { showOnboarding, completeOnboarding } = useOnboarding();
  
  // Premium status (Android-only)
  const { isPremium, planType } = usePlatformPremium();
  const { canAnalyze, usageCount, dailyLimit, remaining, incrementUsage } = useAnalysisLimit();
  
  const { 
    showPromotion, 
    dismissPromotion, 
    promotionVisible, 
    promotionType,
    shouldShowPromotion,
    showLimitBanner,
    setShowLimitBanner,
    triggerLimitFeedback 
  } = usePremiumPromotion();
  
  // Bottom sheet for analysis limit
  const analysisLimitSheet = useAnalysisLimitSheet();
  
  // Refs for scroll behavior
  const upcomingMatchesRef = useRef<HTMLDivElement>(null);
  const pendingAnalysisScrollRef = useRef(false);
  
  // Centralized data fetching - single source of truth
  const { stats, liveMatches, todaysMatches, isLoading: homeDataLoading, lastUpdated, refetch } = useHomeData();
  
  const [selectedLeague, setSelectedLeague] = useState<CompetitionCode | ''>('');
  const [upcomingMatches, setUpcomingMatches] = useState<ApiMatch[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [analysisDrawerOpen, setAnalysisDrawerOpen] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const drawerDelayRef = useRef<NodeJS.Timeout | null>(null);

  // Footer stats - derived from useHomeData
  const footerStats = {
    totalAnalysis: stats.totalPredictions,
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

  // Fetch upcoming matches when league changes (from cached database - NO API CALL!)
  const fetchUpcomingMatchesFromCache = useCallback(async (leagueCode: CompetitionCode) => {
    setIsLoadingMatches(true);
    try {
      const matches = await getUpcomingMatches(leagueCode, 14);
      setUpcomingMatches(matches.slice(0, 10));
    } catch (e) {
      console.error('Error fetching matches:', e);
      toast.error('Maç verileri yüklenirken hata oluştu.');
    } finally {
      setIsLoadingMatches(false);
    }
  }, []);

  useEffect(() => {
    if (selectedLeague) {
      fetchUpcomingMatchesFromCache(selectedLeague);
    }
  }, [selectedLeague, fetchUpcomingMatchesFromCache]);

  const handleLeagueSelect = (code: CompetitionCode) => {
    setSelectedLeague(code);

    // Clear previous timeout if exists
    if (leagueScrollTimeoutRef.current) {
      clearTimeout(leagueScrollTimeoutRef.current);
    }
    
    // Scroll to upcoming matches section after a short delay
    leagueScrollTimeoutRef.current = setTimeout(() => {
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
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leagueScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (leagueScrollTimeoutRef.current) clearTimeout(leagueScrollTimeoutRef.current);
      if (drawerDelayRef.current) clearTimeout(drawerDelayRef.current);
    };
  }, []);

  // Sequenced transition: analysis completes → show 100% → delay → open drawer
  useEffect(() => {
    if (analysis && !analysisLoading && pendingAnalysisScrollRef.current) {
      pendingAnalysisScrollRef.current = false;
      // Phase 1: show completion state
      setAnalysisComplete(true);
      // Phase 2: after 500ms, open drawer
      drawerDelayRef.current = setTimeout(() => {
        setAnalysisDrawerOpen(true);
        setAnalysisComplete(false);
      }, 500);
    }
  }, [analysis, analysisLoading]);

  const handleMatchSelect = async (match: ApiMatch) => {
    // Check analysis limit
    if (user && !canAnalyze) {
      // Show premium upgrade sheet (for free users)
      if (!isPremium) {
        analysisLimitSheet.show();
        return;
      }
    }

    // Close drawer and reset for new analysis
    setAnalysisDrawerOpen(false);
    setAnalysisComplete(false);
    if (drawerDelayRef.current) clearTimeout(drawerDelayRef.current);

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
      matchId: match.id,
      homeTeamId: match.homeTeam.id,
      awayTeamId: match.awayTeam.id,
      homeTeamCrest: match.homeTeam.crest,
      awayTeamCrest: match.awayTeam.crest,
    };
    
    // Mark scroll request for after analysis completes
    pendingAnalysisScrollRef.current = true;
    
    try {
      await analyzeMatch(matchInput);
      
      // Increment usage for non-premium users
      if (user && !isPremium) {
        await incrementUsage();
      }
    } catch (error) {
      toast.error('Analiz yüklenirken hata oluştu');
      pendingAnalysisScrollRef.current = false;
    } finally {
      setLoadingMatchId(null);
      // Don't clear analyzingMatchInfo here — it's needed during the completion phase
      // It gets cleared when a new analysis starts (handleMatchSelect)
    }
  };

  const handleFormSubmit = async (data: MatchInput) => {
    pendingAnalysisScrollRef.current = true;
    await analyzeMatch(data);
  };

  const handleCommandLeagueSelect = (code: string) => {
    setSelectedLeague(code as CompetitionCode);
  };

  const handleCommandTeamSelect = async (teamName: string, leagueCode: string) => {
    setCommandOpen(false);
    toast.info(`${teamName} için maç aranıyor...`);
    
    try {
      const nextMatch = await getTeamNextMatch(teamName);
      
      if (nextMatch) {
        handleMatchSelect(nextMatch);
      } else {
        toast.warning(`${teamName} için yaklaşan maç bulunamadı.`);
        // Fallback: Select the league and scroll to upcoming matches
        setSelectedLeague(leagueCode as CompetitionCode);
      }
    } catch (error) {
      console.error('Team match search error:', error);
      toast.error('Maç aranırken hata oluştu');
    }
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
      <kbd className="ml-2 px-1.5 py-0.5 text-micro bg-muted rounded">⌘K</kbd>
    </Button>
  );

  return (
    <div className="min-h-screen bg-background md:pb-8" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <AppHeader rightContent={searchButton} />

      {/* Hero Section - Simplified with count-up */}
      <HeroSection stats={stats} onAnalyzeClick={() => setCommandOpen(true)} />

      {/* Main Content - Clean Single Column Flow */}
      <main className="container mx-auto px-4 py-6 space-y-6">
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
            lastUpdated={lastUpdated}
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
                <div className="w-1.5 h-5 rounded-full bg-primary" />
                <h2 className="font-semibold">Yaklaşan Maçlar</h2>
                <span className="text-sm text-muted-foreground">
                  {SUPPORTED_COMPETITIONS.find(c => c.code === selectedLeague)?.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLeague('')}
                className="text-xs text-muted-foreground"
              >
                Temizle
              </Button>
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
          {(analysisLoading || analysisComplete) && analyzingMatchInfo && (
            <motion.div
              ref={analysisLoadingRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              id="analysis-loading-section"
              style={{ scrollMarginTop: '100px' }}
            >
              <AnalysisLoadingState
                homeTeam={analyzingMatchInfo.homeTeam}
                awayTeam={analyzingMatchInfo.awayTeam}
                homeTeamCrest={analyzingMatchInfo.homeTeamCrest}
                awayTeamCrest={analyzingMatchInfo.awayTeamCrest}
                isComplete={analysisComplete}
              />
            </motion.div>
          )}
        </AnimatePresence>



      </main>

      {/* Analysis Drawer — full-screen overlay */}
      <AnalysisDrawer
        analysis={analysis}
        isOpen={analysisDrawerOpen}
        onClose={() => setAnalysisDrawerOpen(false)}
      />


      {/* Analysis Set Floating Button */}
      <AnalysisSetButton />

      {/* Command Palette */}
      <CommandPalette 
        open={commandOpen} 
        onOpenChange={setCommandOpen}
        onLeagueSelect={handleCommandLeagueSelect}
        onTeamSelect={handleCommandTeamSelect}
      />

      {/* Onboarding */}
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding onComplete={completeOnboarding} />
        )}
      </AnimatePresence>

      {/* Premium Promotion Modal */}
      <PremiumPromotionModal
        isOpen={promotionVisible}
        type={promotionType}
        onClose={dismissPromotion}
      />

      {/* Analysis Limit Banner - Shows when limit reached and modal was dismissed */}
      <AnalysisLimitBanner
        isVisible={showLimitBanner}
        onClose={() => setShowLimitBanner(false)}
        onUpgrade={() => {
          setShowLimitBanner(false);
          showPromotion('limit');
        }}
      />

      {/* Analysis Limit Bottom Sheet - Premium upgrade */}
      <AnalysisLimitSheet
        isOpen={analysisLimitSheet.isOpen}
        onClose={analysisLimitSheet.close}
      />
    </div>
  );
};

export default Index;
