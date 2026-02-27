import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';
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
  return (
    <AnimatePresence>
      {isOpen && analysis && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 top-8 z-50 bg-background rounded-t-2xl overflow-hidden flex flex-col"
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
            <div className="flex-1 overflow-y-auto overscroll-contain pb-safe">
              <div className="container mx-auto px-4 py-4 space-y-4 pb-24">
                {/* Match Hero Card */}
                <MatchHeroCard 
                  match={analysis.input} 
                  insights={analysis.insights}
                  homeTeamCrest={analysis.input.homeTeamCrest}
                  awayTeamCrest={analysis.input.awayTeamCrest}
                />

                {/* AI Recommendation */}
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

                {/* Team Comparison */}
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

                {/* Legal Disclaimer */}
                <LegalDisclaimer />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AnalysisDrawer;
