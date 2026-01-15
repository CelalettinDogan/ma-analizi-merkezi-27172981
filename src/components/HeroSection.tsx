import React from 'react';
import { TrendingUp, Shield, BarChart3 } from 'lucide-react';

const HeroSection: React.FC = () => {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      
      <div className="relative container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Profesyonel Futbol Analizi</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
            Akıllı Maç{' '}
            <span className="gradient-text">Tahminleri</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: '200ms' }}>
            Veri odaklı analizler, detaylı istatistikler ve profesyonel değerlendirmelerle futbol maçlarını daha iyi anlayın.
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-card/50 border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Detaylı İstatistik</h3>
              <p className="text-sm text-muted-foreground text-center">Takım ve oyuncu bazlı kapsamlı veri analizi</p>
            </div>
            <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-card/50 border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-foreground">Tahmin Analizi</h3>
              <p className="text-sm text-muted-foreground text-center">Gerekçeli ve şeffaf tahmin önerileri</p>
            </div>
            <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-card/50 border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Sorumlu Yaklaşım</h3>
              <p className="text-sm text-muted-foreground text-center">Yasal uyumlu ve bilinçli içerik</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
