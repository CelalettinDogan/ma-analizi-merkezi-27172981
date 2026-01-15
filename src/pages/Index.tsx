import React, { useState } from 'react';
import HeroSection from '@/components/HeroSection';
import MatchInputForm from '@/components/MatchInputForm';
import MatchHeader from '@/components/MatchHeader';
import TeamStatsCard from '@/components/TeamStatsCard';
import HeadToHeadCard from '@/components/HeadToHeadCard';
import PredictionCard from '@/components/PredictionCard';
import AnalysisSection from '@/components/AnalysisSection';
import LegalDisclaimer from '@/components/LegalDisclaimer';
import { MatchInput, MatchAnalysis } from '@/types/match';
import { generateMockAnalysis } from '@/utils/mockData';
import { ArrowDown } from 'lucide-react';

const Index: React.FC = () => {
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);

  const handleFormSubmit = (data: MatchInput) => {
    // Generate mock analysis based on input
    const mockAnalysis = generateMockAnalysis(data);
    setAnalysis(mockAnalysis);
    
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
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Analizler</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">İletişim</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection />

      {/* Input Form Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <MatchInputForm onSubmit={handleFormSubmit} />
        </div>
      </section>

      {/* Scroll Indicator */}
      {!analysis && (
        <div className="flex justify-center pb-8 animate-bounce">
          <ArrowDown className="w-6 h-6 text-muted-foreground" />
        </div>
      )}

      {/* Analysis Section */}
      {analysis && (
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
                  <PredictionCard key={index} prediction={prediction} index={index} />
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
    </div>
  );
};

export default Index;
