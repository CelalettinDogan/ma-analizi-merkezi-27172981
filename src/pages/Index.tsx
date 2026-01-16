import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import HeroSection from '@/components/HeroSection';
import LegalDisclaimer from '@/components/LegalDisclaimer';
import BetSlipButton from '@/components/betslip/BetSlipButton';
import UserMenu from '@/components/UserMenu';
import ThemeToggle from '@/components/ThemeToggle';
import LeagueGrid from '@/components/league/LeagueGrid';
import MatchCarousel from '@/components/match/MatchCarousel';
import BottomNav from '@/components/navigation/BottomNav';
import CommandPalette from '@/components/navigation/CommandPalette';
import Onboarding from '@/components/Onboarding';
import { MatchCardSkeleton } from '@/components/ui/skeletons';
import {
  MatchHeroCard,
  AIRecommendationCard,
  PredictionPillSelector,
  QuickStatsRow,
  H2HTimeline,
  CollapsibleAnalysis,
} from '@/components/analysis';
import { MatchInput } from '@/types/match';
import { Match as ApiMatch, SUPPORTED_COMPETITIONS, CompetitionCode } from '@/types/footballApi';
import { useMatchAnalysis } from '@/hooks/useMatchAnalysis';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Loader2, BarChart3, Calendar, Search, RefreshCw, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { analysis, isLoading: analysisLoading, analyzeMatch } = useMatchAnalysis();
  const { user } = useAuth();
  const { showOnboarding, completeOnboarding } = useOnboarding();
  
  const [selectedLeague, setSelectedLeague] = useState<CompetitionCode | ''>('');
  const [upcomingMatches, setUpcomingMatches] = useState<ApiMatch[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // Handle match from Live page navigation
  useEffect(() => {
    const state = location.state as { selectedMatch?: ApiMatch } | null;
    if (state?.selectedMatch) {
      handleMatchSelect(state.selectedMatch);
      // Clear state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch upcoming matches when league changes
  const fetchUpcomingMatches = useCallback(async (leagueCode: CompetitionCode) => {
    setIsLoadingMatches(true);
    try {
      const { data, error } = await supabase.functions.invoke('football-api', {
        body: { action: 'matches', competitionCode: leagueCode, status: 'SCHEDULED' },
      });
      if (!error && data?.matches) {
        setUpcomingMatches(data.matches.slice(0, 10));
      }
    } catch (e) {
      console.error('Error fetching matches:', e);
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
  };

  const handleMatchSelect = async (match: ApiMatch) => {
    const leagueCode = SUPPORTED_COMPETITIONS.find(
      c => c.code === match.competition.code
    )?.code || 'PL';
    
    const matchInput: MatchInput = {
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      league: leagueCode,
      matchDate: match.utcDate.split('T')[0],
    };
    
    await analyzeMatch(matchInput);
    
    setTimeout(() => {
      document.getElementById('analysis-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-bold text-sm">FT</span>
            </div>
            <span className="font-display font-bold text-lg text-foreground hidden sm:block">FutbolTahmin</span>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">Anasayfa</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/live" className="gap-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                Canlı
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/standings" className="gap-1">
                <Trophy className="w-4 h-4" />
                Sıralama
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard" className="gap-1">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </Link>
            </Button>
          </nav>

          <div className="flex items-center gap-2">
            {/* Search Button */}
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
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Hero Section - Compact */}
      <HeroSection />

      {/* Main Content - Bento Grid Layout */}
      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* League Selection */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="font-display font-bold text-lg mb-4">Lig Seçin</h2>
          <LeagueGrid 
            selectedLeague={selectedLeague} 
            onLeagueSelect={handleLeagueSelect}
          />
        </motion.section>

        {/* Upcoming Matches Carousel */}
        {selectedLeague && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="font-display font-bold text-lg">
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

        {/* Loading State */}
        {analysisLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <div className="absolute inset-0 w-12 h-12 bg-primary/20 rounded-full animate-ping" />
            </div>
            <p className="text-muted-foreground mt-4">AI analiz yapılıyor...</p>
            <p className="text-sm text-muted-foreground">Form, gol istatistikleri ve H2H hesaplanıyor</p>
          </motion.div>
        )}

        {/* Analysis Section - Modern 2026 Redesign */}
        <AnimatePresence>
          {analysis && !analysisLoading && (
            <motion.section 
              id="analysis-section"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-6"
            >
              {/* Match Hero Card - Compact */}
              <MatchHeroCard match={analysis.input} insights={analysis.insights} />

              {/* AI Recommendation + Prediction Pills - Hero Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AIRecommendationCard 
                  predictions={analysis.predictions} 
                  matchInput={analysis.input} 
                />
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-card border border-border/50">
                    <h4 className="text-sm font-semibold text-foreground mb-4">Tüm Tahminler</h4>
                    <PredictionPillSelector 
                      predictions={analysis.predictions} 
                      matchInput={analysis.input} 
                    />
                  </div>
                </div>
              </div>

              {/* Quick Stats Row - Form + Power Index */}
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

      {/* Footer - Desktop only */}
      <footer className="hidden md:block py-8 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">FT</span>
            </div>
            <span className="font-display font-semibold text-foreground">FutbolTahmin</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            © {new Date().getFullYear()} FutbolTahmin. Tüm hakları saklıdır.
          </p>
          <p className="text-xs text-muted-foreground">
            Bu site yalnızca bilgilendirme amaçlıdır. 18 yaş altı kullanıcılara yönelik değildir.
          </p>
        </div>
      </footer>

      {/* Bet Slip Floating Button */}
      <BetSlipButton />

      {/* Bottom Navigation - Mobile */}
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
