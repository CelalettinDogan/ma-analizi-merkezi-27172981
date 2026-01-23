import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import HeroSection from '@/components/HeroSection';
import LegalDisclaimer from '@/components/LegalDisclaimer';
import { AnalysisSetButton } from '@/components/analysis-set';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import LeagueGrid from '@/components/league/LeagueGrid';
import MatchCarousel from '@/components/match/MatchCarousel';
import BottomNav from '@/components/navigation/BottomNav';
import CommandPalette from '@/components/navigation/CommandPalette';
import Onboarding from '@/components/Onboarding';
import TodaysMatches from '@/components/TodaysMatches';
import { MatchCardSkeleton } from '@/components/ui/skeletons';
import PremiumPromotionModal from '@/components/premium/PremiumPromotionModal';
import AnalysisLimitBanner from '@/components/premium/AnalysisLimitBanner';
import AnalysisLimitSheet, { useAnalysisLimitSheet } from '@/components/premium/AnalysisLimitSheet';
import WebLimitSheet, { useWebLimitSheet } from '@/components/premium/WebLimitSheet';
import AppDownloadBanner from '@/components/promotion/AppDownloadBanner';
import {
  MatchHeroCard,
  AIRecommendationCard,
  PredictionPillSelector,
  H2HTimeline,
  AnalysisLoadingState,
  TeamComparisonCard,
  AdvancedAnalysisTabs,
  StickyAnalysisCTA,
} from '@/components/analysis';
import { MatchInput, Prediction } from '@/types/match';
import { Match as ApiMatch, SUPPORTED_COMPETITIONS, CompetitionCode } from '@/types/footballApi';
import { useMatchAnalysis } from '@/hooks/useMatchAnalysis';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useHomeData } from '@/hooks/useHomeData';
import { useAnalysisLimit } from '@/hooks/useAnalysisLimit';
import { usePremiumPromotion } from '@/hooks/usePremiumPromotion';
import { usePlatformPremium } from '@/hooks/usePlatformPremium';
import { usePlatformPromotion } from '@/hooks/usePlatformPromotion';
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
  
  // Platform-aware premium (web users can NEVER be premium)
  const { isPremium, planType, isWebPlatform, isNativePlatform } = usePlatformPremium();
  const { canAnalyze, usageCount, dailyLimit, remaining, incrementUsage, isWebPlatform: isWebFromLimit } = useAnalysisLimit();
  
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
  const { 
    isDesktop, 
    showAppDownload, 
    dismissAppDownload 
  } = usePlatformPromotion();
  
  // Bottom sheets for analysis limit - platform specific
  const analysisLimitSheet = useAnalysisLimitSheet(); // For native/mobile premium upgrade
  const webLimitSheet = useWebLimitSheet(); // For web - app download prompt
  
  // Refs for scroll behavior
  const upcomingMatchesRef = useRef<HTMLDivElement>(null);
  const pendingAnalysisScrollRef = useRef(false);
  
  // Centralized data fetching - single source of truth
  const { stats, liveMatches, todaysMatches, isLoading: homeDataLoading, lastUpdated, refetch, syncMatches } = useHomeData();
  
  const [selectedLeague, setSelectedLeague] = useState<CompetitionCode | ''>('');
  const [upcomingMatches, setUpcomingMatches] = useState<ApiMatch[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

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
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (leagueScrollTimeoutRef.current) {
        clearTimeout(leagueScrollTimeoutRef.current);
      }
    };
  }, []);

  // Scroll to AI recommendation after analysis completes
  useEffect(() => {
    if (analysis && !analysisLoading && pendingAnalysisScrollRef.current) {
      pendingAnalysisScrollRef.current = false;
      
      // Wait for Framer Motion animation to complete (300ms) + buffer
      const scrollTimeout = setTimeout(() => {
        const anchor = document.getElementById('ai-recommendation-anchor');
        if (anchor) {
          anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // Fallback to analysis section
          document.getElementById('analysis-section')?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 350);
      
      return () => clearTimeout(scrollTimeout);
    }
  }, [analysis, analysisLoading]);

  const handleMatchSelect = async (match: ApiMatch) => {
    // Check analysis limit - platform-aware logic
    if (user && !canAnalyze) {
      // Web platform: NEVER premium, show app download prompt
      if (isWebPlatform) {
        webLimitSheet.show();
        return;
      }
      
      // Native platform: Show premium upgrade sheet (for free users)
      if (!isPremium) {
        analysisLimitSheet.show();
        return;
      }
    }

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
    
    // Mark scroll request for after analysis completes
    pendingAnalysisScrollRef.current = true;
    
    try {
      await analyzeMatch(matchInput);
      
      // Increment usage for users who have limits
      // Web: always increment (no premium on web)
      // Native: only increment for non-premium users
      if (user && (isWebPlatform || !isPremium)) {
        await incrementUsage();
      }
    } catch (error) {
      toast.error('Analiz yüklenirken hata oluştu');
      pendingAnalysisScrollRef.current = false;
    } finally {
      setLoadingMatchId(null);
      setAnalyzingMatchInfo(null);
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
            lastUpdated={lastUpdated}
            onRefresh={refetch}
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

        {/* Stable Scroll Anchor - Outside AnimatePresence for reliable targeting */}
        {analysis && !analysisLoading && (
          <div id="ai-recommendation-anchor" style={{ scrollMarginTop: '80px' }} />
        )}

        {/* Analysis Section */}
        <AnimatePresence>
          {analysis && !analysisLoading && (
            <motion.section 
              id="analysis-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 pb-32"
              style={{ scrollMarginTop: '80px' }}
            >
              {/* Match Hero Card - Team vs Team Header */}
              <div id="match-hero-section">
                <MatchHeroCard 
                  match={analysis.input} 
                  insights={analysis.insights}
                  homeTeamCrest={analysis.input.homeTeamCrest}
                  awayTeamCrest={analysis.input.awayTeamCrest}
                />
              </div>

              {/* AI Recommendation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AIRecommendationCard 
                  predictions={analysis.predictions} 
                  matchInput={analysis.input}
                  fullAnalysis={analysis}
                />
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <PredictionPillSelector 
                      predictions={analysis.predictions} 
                      matchInput={analysis.input} 
                    />
                  </div>
                </div>
              </div>

              {/* Team Comparison Card - Merged Stats + Power */}
              <TeamComparisonCard
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

              {/* Advanced Analysis Tabs */}
              <AdvancedAnalysisTabs analysis={analysis} />

              {/* Legal Disclaimer - Collapsible with extra bottom padding */}
              <div className="pb-4">
                <LegalDisclaimer />
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Sticky CTA - Shows when analysis is visible */}
        <AnimatePresence>
          {analysis && !analysisLoading && analysis.predictions.length > 0 && (
            <StickyAnalysisCTA
              prediction={[...analysis.predictions].sort((a, b) => {
                const aHybrid = ((a.aiConfidence || 0) + (a.mathConfidence || 0)) / 2;
                const bHybrid = ((b.aiConfidence || 0) + (b.mathConfidence || 0)) / 2;
                return bHybrid - aHybrid;
              })[0]}
              matchInput={analysis.input}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <AppFooter />

      {/* Analysis Set Floating Button */}
      <AnalysisSetButton />

      {/* Bottom Navigation */}
      <BottomNav onSearchClick={() => setCommandOpen(true)} />

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

      {/* Analysis Limit Banner - Shows when limit reached and modal was dismissed (native only) */}
      {!isWebPlatform && (
        <AnalysisLimitBanner
          isVisible={showLimitBanner}
          onClose={() => setShowLimitBanner(false)}
          onUpgrade={() => {
            setShowLimitBanner(false);
            showPromotion('limit');
          }}
        />
      )}

      {/* App Download Banner - Desktop only */}
      {isDesktop && (
        <AppDownloadBanner
          isVisible={showAppDownload}
          onClose={dismissAppDownload}
        />
      )}

      {/* Analysis Limit Bottom Sheet - Native premium upgrade */}
      {!isWebPlatform && (
        <AnalysisLimitSheet
          isOpen={analysisLimitSheet.isOpen}
          onClose={analysisLimitSheet.close}
        />
      )}

      {/* Web Limit Bottom Sheet - App download prompt */}
      {isWebPlatform && (
        <WebLimitSheet
          isOpen={webLimitSheet.isOpen}
          onClose={webLimitSheet.close}
        />
      )}
    </div>
  );
};

export default Index;
