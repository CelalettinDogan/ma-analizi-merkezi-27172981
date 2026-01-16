import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Crosshair, History, Brain, Users, AlertCircle } from 'lucide-react';
import { MatchAnalysis } from '@/types/match';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ScorePredictionChart from '@/components/charts/ScorePredictionChart';
import SimilarMatchesSection from '@/components/SimilarMatchesSection';
import { cn } from '@/lib/utils';

interface CollapsibleAnalysisProps {
  analysis: MatchAnalysis;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}

const CollapsibleSection: React.FC<SectionProps> = ({ 
  title, 
  icon, 
  children, 
  defaultOpen = false,
  badge 
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <motion.div 
          className={cn(
            "flex items-center justify-between p-4 rounded-xl bg-card border border-border/50 transition-colors",
            "hover:bg-muted/30",
            isOpen && "rounded-b-none border-b-0"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
              {icon}
            </div>
            <span className="font-medium text-foreground">{title}</span>
            {badge && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                {badge}
              </span>
            )}
          </div>
          <ChevronDown className={cn(
            "w-5 h-5 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )} />
        </motion.div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-b-xl bg-card border border-t-0 border-border/50">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
};

const CollapsibleAnalysis: React.FC<CollapsibleAnalysisProps> = ({ analysis }) => {
  const hasPoisson = analysis.poissonData;
  const hasSimilar = analysis.similarMatches && analysis.similarMatches.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-3"
    >
      {/* Poisson Analysis */}
      {hasPoisson && (
        <CollapsibleSection
          title="Poisson Gol Analizi"
          icon={<Crosshair className="w-4 h-4 text-primary" />}
          badge="İstatistiksel"
        >
          <ScorePredictionChart
            scoreProbabilities={analysis.poissonData!.scoreProbabilities}
            goalLineProbabilities={analysis.poissonData!.goalLineProbabilities}
            bttsProbability={analysis.poissonData!.bttsProbability}
            expectedHomeGoals={analysis.poissonData!.expectedHomeGoals}
            expectedAwayGoals={analysis.poissonData!.expectedAwayGoals}
          />
        </CollapsibleSection>
      )}

      {/* Similar Matches */}
      {hasSimilar && (
        <CollapsibleSection
          title="Benzer Maçlar"
          icon={<History className="w-4 h-4 text-secondary" />}
          badge={`${analysis.similarMatches!.length} maç`}
        >
          <SimilarMatchesSection 
            matches={analysis.similarMatches!}
            stats={analysis.similarMatchStats}
          />
        </CollapsibleSection>
      )}

      {/* Tactical Analysis */}
      <CollapsibleSection
        title="Taktiksel Analiz"
        icon={<Brain className="w-4 h-4 text-primary" />}
      >
        <p className="text-muted-foreground leading-relaxed">
          {analysis.tacticalAnalysis}
        </p>
      </CollapsibleSection>

      {/* Key Factors */}
      <CollapsibleSection
        title="Önemli Faktörler"
        icon={<AlertCircle className="w-4 h-4 text-amber-400" />}
        badge={`${analysis.keyFactors.length} faktör`}
      >
        <ul className="space-y-2">
          {analysis.keyFactors.map((factor, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {index + 1}
              </span>
              <span className="text-muted-foreground text-sm">{factor}</span>
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      {/* Injuries */}
      {(analysis.injuries.home.length > 0 || analysis.injuries.away.length > 0) && (
        <CollapsibleSection
          title="Sakat / Cezalı Oyuncular"
          icon={<Users className="w-4 h-4 text-red-400" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-primary mb-2">{analysis.input.homeTeam}</h5>
              {analysis.injuries.home.length > 0 ? (
                <ul className="space-y-1">
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
              <h5 className="text-sm font-medium text-secondary mb-2">{analysis.input.awayTeam}</h5>
              {analysis.injuries.away.length > 0 ? (
                <ul className="space-y-1">
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
        </CollapsibleSection>
      )}
    </motion.div>
  );
};

export default CollapsibleAnalysis;
