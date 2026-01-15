import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '@/components/HeroSection';
import MatchInputForm from '@/components/MatchInputForm';
import MatchHeader from '@/components/MatchHeader';
import TeamStatsCard from '@/components/TeamStatsCard';
import HeadToHeadCard from '@/components/HeadToHeadCard';
import PredictionCard from '@/components/PredictionCard';
import AnalysisSection from '@/components/AnalysisSection';
import LegalDisclaimer from '@/components/LegalDisclaimer';
import BetSlipButton from '@/components/betslip/BetSlipButton';
import UserMenu from '@/components/UserMenu';
import LiveMatchesSection from '@/components/LiveMatchesSection';
import { MatchInput } from '@/types/match';
import { Match as ApiMatch, SUPPORTED_COMPETITIONS } from '@/types/footballApi';
import { useMatchAnalysis } from '@/hooks/useMatchAnalysis';
import { ArrowDown, Loader2, BarChart3, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index: React.FC = () => {
  const { analysis, isLoading, analyzeMatch } = useMatchAnalysis();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analyze');

  const handleFormSubmit = async (data: MatchInput) => {
    await analyzeMatch(data);
    
    // Scroll to analysis section
    setTimeout(() => {
      document.getElementById('analysis-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleLiveMatchSelect = (match: ApiMatch) => {
    // Find league code from match competition
    const leagueCode = SUPPORTED_COMPETITIONS.find(
      c => c.code === match.competition.code
    )?.code || 'PL';
    
    const matchInput: MatchInput = {
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      league: leagueCode,
      matchDate: match.utcDate.split('T')[0],
    };
    
    setActiveTab('analyze');
    analyzeMatch(matchInput);
    
    // Scroll to analysis section
    setTimeout(() => {
      document.getElementById('analysis-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">FT</span>
            </div>
            <span className="font-display font-bold text-lg text-foreground">FutbolTahmin</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Anasayfa</a>
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="md:hidden">
              <Button variant="ghost" size="sm">
                <BarChart3 className="w-4 h-4" />
              </Button>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection />

      {/* Main Content with Tabs */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="analyze" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Maç Analizi
              </TabsTrigger>
              <TabsTrigger value="live" className="gap-2">
                <Radio className="w-4 h-4" />
                Canlı Maçlar
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="analyze" className="max-w-3xl mx-auto">
              <MatchInputForm onSubmit={handleFormSubmit} />
            </TabsContent>
            
            <TabsContent value="live">
              <LiveMatchesSection onSelectMatch={handleLiveMatchSelect} />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Gerçek veriler analiz ediliyor...</p>
          <p className="text-sm text-muted-foreground mt-2">Form, gol istatistikleri ve H2H hesaplanıyor</p>
        </div>
      )}

      {/* Scroll Indicator */}
      {!analysis && !isLoading && (
        <div className="flex justify-center pb-8 animate-bounce">
          <ArrowDown className="w-6 h-6 text-muted-foreground" />
        </div>
      )}

      {/* Analysis Section */}
      {analysis && !isLoading && (
        <section id="analysis-section" className="py-12 md:py-16 bg-card/30">
          <div className="container mx-auto px-4">
            {/* Match Header */}
            <MatchHeader match={analysis.input} />

            {/* Team Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <TeamStatsCard 
                teamName={analysis.input.homeTeam} 
                stats={analysis.homeTeamStats} 
                isHome={true} 
              />
              <TeamStatsCard 
                teamName={analysis.input.awayTeam} 
                stats={analysis.awayTeamStats} 
                isHome={false} 
              />
            </div>

            {/* Head to Head */}
            <div className="mb-8">
              <HeadToHeadCard 
                h2h={analysis.headToHead} 
                homeTeam={analysis.input.homeTeam}
                awayTeam={analysis.input.awayTeam}
              />
            </div>

            {/* Analysis Details */}
            <div className="mb-8">
              <AnalysisSection analysis={analysis} />
            </div>

            {/* Predictions */}
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6 text-center">
                Bahis <span className="gradient-text">Tahminleri</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analysis.predictions.map((prediction, index) => (
                  <PredictionCard 
                    key={index} 
                    prediction={prediction} 
                    index={index} 
                    matchInput={analysis.input}
                  />
                ))}
              </div>
            </div>

            {/* Legal Disclaimer */}
            <LegalDisclaimer />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">FT</span>
            </div>
            <span className="font-display font-semibold text-foreground">FutbolTahmin</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            © 2024 FutbolTahmin. Tüm hakları saklıdır.
          </p>
          <p className="text-xs text-muted-foreground">
            Bu site yalnızca bilgilendirme amaçlıdır. 18 yaş altı kullanıcılara yönelik değildir.
          </p>
        </div>
      </footer>

      {/* Bet Slip Floating Button */}
      <BetSlipButton />
    </div>
  );
};

export default Index;
