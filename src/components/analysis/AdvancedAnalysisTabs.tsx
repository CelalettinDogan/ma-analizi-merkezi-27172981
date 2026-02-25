import React, { useState, lazy, Suspense, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crosshair, History, Brain, AlertCircle, Users } from 'lucide-react';
import { MatchAnalysis } from '@/types/match';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, getHybridConfidence } from '@/lib/utils';

// Lazy load heavy components
const ScorePredictionChart = lazy(() => import('@/components/charts/ScorePredictionChart'));
const SimilarMatchesSection = lazy(() => import('@/components/SimilarMatchesSection'));

interface AdvancedAnalysisTabsProps {
  analysis: MatchAnalysis;
}

// Loading skeleton for tab content
const TabSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

const AdvancedAnalysisTabs: React.FC<AdvancedAnalysisTabsProps> = ({ analysis }) => {
  const [activeTab, setActiveTab] = useState('poisson');
  
  const hasPoisson = !!analysis.poissonData;
  const hasSimilar = analysis.similarMatches && analysis.similarMatches.length > 0;
  const hasInjuries = analysis.injuries.home.length > 0 || analysis.injuries.away.length > 0;

  const bttsHybridConfidence = useMemo(() => {
    const bttsPred = analysis.predictions.find(p => p.type === 'Karşılıklı Gol');
    if (!bttsPred) return undefined;
    return getHybridConfidence(bttsPred);
  }, [analysis.predictions]);

  // Determine default tab
  const defaultTab = hasPoisson ? 'poisson' : hasSimilar ? 'similar' : 'tactical';

  // Tab configuration
  const tabs = [
    { 
      id: 'poisson', 
      label: 'Gol Analizi', 
      icon: <Crosshair className="w-4 h-4" />,
      badge: hasPoisson ? null : 'Yok',
      disabled: !hasPoisson
    },
    { 
      id: 'similar', 
      label: 'Benzer Maçlar', 
      icon: <History className="w-4 h-4" />,
      badge: hasSimilar ? `${analysis.similarMatches?.length}` : null,
      disabled: !hasSimilar
    },
    { 
      id: 'tactical', 
      label: 'Taktik', 
      icon: <Brain className="w-4 h-4" />,
      badge: null,
      disabled: false
    },
    { 
      id: 'factors', 
      label: 'Faktörler', 
      icon: <AlertCircle className="w-4 h-4" />,
      badge: `${analysis.keyFactors.length}`,
      disabled: false
    },
  ];

  // Add injuries tab if there are injuries
  if (hasInjuries) {
    tabs.push({
      id: 'injuries',
      label: 'Eksikler',
      icon: <Users className="w-4 h-4" />,
      badge: `${analysis.injuries.home.length + analysis.injuries.away.length}`,
      disabled: false
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-xl bg-card border border-border/50 overflow-hidden"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue={defaultTab}>
        {/* Tab List - Horizontal Scroll on Mobile */}
        <div className="border-b border-border/50 overflow-x-auto scrollbar-none">
          <TabsList className="inline-flex w-auto min-w-full h-12 bg-transparent p-0 gap-0">
            {tabs.filter(t => !t.disabled).map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                disabled={tab.disabled}
                className={cn(
                  "flex-1 min-w-max px-4 py-3 rounded-none border-b-2 border-transparent",
                  "data-[state=active]:border-primary data-[state=active]:bg-transparent",
                  "data-[state=active]:text-primary",
                  "transition-all gap-2"
                )}
              >
                {tab.icon}
                <span className="text-sm">{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-muted text-muted-foreground">
                    {tab.badge}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Contents */}
        <div className="p-4">
          {/* Poisson Analysis */}
          {hasPoisson && (
            <TabsContent value="poisson" className="mt-0">
              <Suspense fallback={<TabSkeleton />}>
                <ScorePredictionChart
                  scoreProbabilities={analysis.poissonData!.scoreProbabilities}
                  goalLineProbabilities={analysis.poissonData!.goalLineProbabilities}
                  bttsProbability={analysis.poissonData!.bttsProbability}
                  expectedHomeGoals={analysis.poissonData!.expectedHomeGoals}
                  expectedAwayGoals={analysis.poissonData!.expectedAwayGoals}
                  bttsHybridConfidence={bttsHybridConfidence}
                />
              </Suspense>
            </TabsContent>
          )}

          {/* Similar Matches */}
          {hasSimilar && (
            <TabsContent value="similar" className="mt-0">
              <Suspense fallback={<TabSkeleton />}>
                <SimilarMatchesSection 
                  matches={analysis.similarMatches!}
                  stats={analysis.similarMatchStats}
                />
              </Suspense>
            </TabsContent>
          )}

          {/* Tactical Analysis */}
          <TabsContent value="tactical" className="mt-0">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Brain className="w-4 h-4 text-primary" />
                Taktiksel Değerlendirme
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.tacticalAnalysis}
              </p>
            </div>
          </TabsContent>

          {/* Key Factors */}
          <TabsContent value="factors" className="mt-0">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Önemli Faktörler
              </div>
              <ul className="space-y-2">
                {analysis.keyFactors.map((factor, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm text-muted-foreground">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          {/* Injuries */}
          {hasInjuries && (
            <TabsContent value="injuries" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {analysis.input.homeTeam}
                  </h5>
                  {analysis.injuries.home.length > 0 ? (
                    <ul className="space-y-2">
                      {analysis.injuries.home.map((player, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          {player}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Eksik oyuncu yok</p>
                  )}
                </div>
                <div>
                  <h5 className="text-sm font-medium text-secondary mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    {analysis.input.awayTeam}
                  </h5>
                  {analysis.injuries.away.length > 0 ? (
                    <ul className="space-y-2">
                      {analysis.injuries.away.map((player, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          {player}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Eksik oyuncu yok</p>
                  )}
                </div>
              </div>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </motion.div>
  );
};

export default AdvancedAnalysisTabs;
