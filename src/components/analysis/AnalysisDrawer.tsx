import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  MatchHeroCard,
  AIRecommendationCard,
  PredictionPillSelector,
  H2HTimeline,
  TeamComparisonCard,
  AdvancedAnalysisTabs,
} from '@/components/analysis';
import LegalDisclaimer from '@/components/LegalDisclaimer';

interface AnalysisDrawerProps {
  analysis: any;
  isOpen: boolean;
  onClose: () => void;
}

const AnalysisDrawer: React.FC<AnalysisDrawerProps> = ({ analysis, isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Mount → forced reflow → animate in
  useEffect(() => {
    let rafId: number;
    if (isOpen && analysis) {
      setMounted(true);
      rafId = requestAnimationFrame(() => {
        // Force synchronous reflow so browser paints translate-y-full first
        drawerRef.current?.offsetHeight;
        setVisible(true);
      });
      return () => cancelAnimationFrame(rafId);
    } else {
      setVisible(false);
      const timeout = setTimeout(() => setMounted(false), 350);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, analysis]);

  // Lock body scroll
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [visible]);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ touchAction: 'none' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed inset-x-0 bottom-0 top-8 z-50 bg-background rounded-t-2xl overflow-hidden flex flex-col transition-transform duration-300 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ willChange: 'transform' }}
      >
        {/* Handle bar + Close */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-1 rounded-full bg-muted-foreground/30 mx-auto" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable content */}
        {analysis && (
          <div className="flex-1 overflow-y-auto overscroll-contain pb-safe">
            <div className="container mx-auto px-4 py-4 space-y-4 pb-24">
              <MatchHeroCard 
                match={analysis.input} 
                insights={analysis.insights}
                homeTeamCrest={analysis.input.homeTeamCrest}
                awayTeamCrest={analysis.input.awayTeamCrest}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AIRecommendationCard 
                  predictions={analysis.predictions} 
                  matchInput={analysis.input}
                />
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-card border border-border/50">
                    <PredictionPillSelector 
                      predictions={analysis.predictions} 
                      matchInput={analysis.input} 
                    />
                  </div>
                </div>
              </div>

              <TeamComparisonCard
                homeTeam={analysis.input.homeTeam}
                awayTeam={analysis.input.awayTeam}
                homeStats={analysis.homeTeamStats}
                awayStats={analysis.awayTeamStats}
                homePower={analysis.homePower}
                awayPower={analysis.awayPower}
              />

              <H2HTimeline
                h2h={analysis.headToHead}
                homeTeam={analysis.input.homeTeam}
                awayTeam={analysis.input.awayTeam}
              />

              <AdvancedAnalysisTabs analysis={analysis} />

              <LegalDisclaimer />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AnalysisDrawer;
