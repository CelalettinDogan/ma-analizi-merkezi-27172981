import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';

export interface ScoreProbability {
  homeGoals: number;
  awayGoals: number;
  probability: number;
}

export interface GoalLineProbabilities {
  over05: number;
  over15: number;
  over25: number;
  over35: number;
  under05: number;
  under15: number;
  under25: number;
  under35: number;
}

interface ScorePredictionChartProps {
  scoreProbabilities: ScoreProbability[];
  goalLineProbabilities?: GoalLineProbabilities;
  bttsProbability?: number;
  expectedHomeGoals?: number;
  expectedAwayGoals?: number;
}

const ScorePredictionChart: React.FC<ScorePredictionChartProps> = ({
  scoreProbabilities,
  goalLineProbabilities,
  bttsProbability,
  expectedHomeGoals,
  expectedAwayGoals,
}) => {
  // Create 6x6 grid (0-5 goals each)
  const maxGoals = 5;
  const grid: number[][] = Array(maxGoals + 1).fill(null).map(() => Array(maxGoals + 1).fill(0));
  
  // Fill grid with probabilities
  scoreProbabilities.forEach(({ homeGoals, awayGoals, probability }) => {
    if (homeGoals <= maxGoals && awayGoals <= maxGoals) {
      grid[awayGoals][homeGoals] = probability * 100;
    }
  });

  // Find max probability for color scaling
  const maxProb = Math.max(...grid.flat());

  // Get top 5 most likely scores for mobile
  const topScores = [...scoreProbabilities]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5);

  const getHeatColor = (value: number): string => {
    if (value === 0) return 'bg-muted/20';
    const intensity = value / maxProb;
    if (intensity > 0.8) return 'bg-primary/80';
    if (intensity > 0.6) return 'bg-primary/60';
    if (intensity > 0.4) return 'bg-primary/40';
    if (intensity > 0.2) return 'bg-primary/20';
    return 'bg-primary/10';
  };

  return (
    <div className="space-y-6">
      {/* Expected Goals - Compact */}
      {expectedHomeGoals !== undefined && expectedAwayGoals !== undefined && (
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Beklenen Gol</div>
              <div className="text-lg font-bold text-foreground">
                {expectedHomeGoals.toFixed(2)} - {expectedAwayGoals.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Toplam: <span className="font-semibold text-foreground">{(expectedHomeGoals + expectedAwayGoals).toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Mobile: Top 5 Scores List */}
      <div className="md:hidden">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">En Olası Skorlar</h4>
        <div className="space-y-2">
          {topScores.map((score, index) => (
            <div 
              key={index}
              className={cn(
                'flex items-center justify-between p-3 rounded-xl border transition-all',
                index === 0 
                  ? 'bg-primary/10 border-primary/30' 
                  : 'bg-muted/30 border-border/30'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold',
                  index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {index + 1}
                </div>
                <div className={cn(
                  'text-xl font-bold',
                  index === 0 ? 'text-primary' : 'text-foreground'
                )}>
                  {score.homeGoals} - {score.awayGoals}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-muted/50 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      'h-full rounded-full transition-all',
                      index === 0 ? 'bg-primary' : 'bg-muted-foreground/50'
                    )}
                    style={{ width: `${score.probability * 100}%` }}
                  />
                </div>
                <span className={cn(
                  'text-sm font-medium min-w-[3rem] text-right',
                  index === 0 ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {(score.probability * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: Score Heatmap */}
      <div className="hidden md:block">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Skor Olasılık Haritası</h4>
        <div className="relative overflow-x-auto">
          {/* Away goals label */}
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground whitespace-nowrap">
            Deplasman
          </div>
          
          <div className="ml-6">
            {/* Home goals header */}
            <div className="flex mb-1 ml-8">
              {Array.from({ length: maxGoals + 1 }, (_, i) => (
                <div key={i} className="w-12 h-6 flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {i}
                </div>
              ))}
            </div>
            
            {/* Grid */}
            {grid.map((row, awayGoals) => (
              <div key={awayGoals} className="flex">
                <div className="w-8 h-12 flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {awayGoals}
                </div>
                {row.map((prob, homeGoals) => (
                  <div
                    key={`${homeGoals}-${awayGoals}`}
                    className={cn(
                      'w-12 h-12 flex items-center justify-center text-xs font-medium rounded-lg m-0.5 transition-all hover:scale-105 cursor-default',
                      getHeatColor(prob),
                      prob > 0 ? 'text-foreground' : 'text-muted-foreground/30'
                    )}
                    title={`${homeGoals}-${awayGoals}: ${prob.toFixed(1)}%`}
                  >
                    {prob > 0 ? `${prob.toFixed(0)}%` : '-'}
                  </div>
                ))}
              </div>
            ))}
            
            {/* Home goals label */}
            <div className="text-center text-xs text-muted-foreground mt-2 ml-8">
              Ev Sahibi
            </div>
          </div>
        </div>

        {/* Desktop: Top 3 Summary */}
        <div className="flex gap-3 mt-4">
          {topScores.slice(0, 3).map((score, index) => (
            <div 
              key={index}
              className={cn(
                'flex-1 p-3 rounded-xl text-center border transition-all',
                index === 0 
                  ? 'bg-primary/10 border-primary/30' 
                  : 'bg-muted/30 border-border/30'
              )}
            >
              <div className={cn(
                'text-xl font-bold',
                index === 0 ? 'text-primary' : 'text-foreground'
              )}>
                {score.homeGoals} - {score.awayGoals}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {(score.probability * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goal Line Probabilities - Vertical on mobile */}
      {goalLineProbabilities && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Gol Çizgileri</h4>
          <div className="space-y-3">
            {[
              { label: '1.5', under: goalLineProbabilities.under15, over: goalLineProbabilities.over15 },
              { label: '2.5', under: goalLineProbabilities.under25, over: goalLineProbabilities.over25 },
              { label: '3.5', under: goalLineProbabilities.under35, over: goalLineProbabilities.over35 },
            ].map((line, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="w-10 text-sm font-medium text-foreground">{line.label}</span>
                <div className="flex-1 flex gap-1">
                  {/* Under */}
                  <div 
                    className="h-8 bg-muted/50 rounded-l-lg flex items-center justify-end px-2 transition-all"
                    style={{ width: `${line.under * 100}%` }}
                  >
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <TrendingDown className="w-3 h-3" />
                      {(line.under * 100).toFixed(0)}%
                    </div>
                  </div>
                  {/* Over */}
                  <div 
                    className="h-8 bg-primary/50 rounded-r-lg flex items-center justify-start px-2 transition-all"
                    style={{ width: `${line.over * 100}%` }}
                  >
                    <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                      <TrendingUp className="w-3 h-3" />
                      {(line.over * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-muted/50" />
              <span>Alt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary/50" />
              <span>Üst</span>
            </div>
          </div>
        </div>
      )}

      {/* BTTS - Cleaner */}
      {bttsProbability !== undefined && (
        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Karşılıklı Gol (KG)</span>
              <span className="text-lg font-bold text-primary">
                {(bttsProbability * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all rounded-full"
                style={{ width: `${bttsProbability * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScorePredictionChart;
