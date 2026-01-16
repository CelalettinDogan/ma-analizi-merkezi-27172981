import React from 'react';
import { cn } from '@/lib/utils';

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

  // Get top 3 most likely scores
  const topScores = [...scoreProbabilities]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3);

  const getHeatColor = (value: number): string => {
    if (value === 0) return 'bg-muted/20';
    const intensity = value / maxProb;
    if (intensity > 0.8) return 'bg-primary/80';
    if (intensity > 0.6) return 'bg-primary/60';
    if (intensity > 0.4) return 'bg-primary/40';
    if (intensity > 0.2) return 'bg-primary/25';
    return 'bg-primary/10';
  };

  return (
    <div className="space-y-6">
      {/* Expected Goals */}
      {expectedHomeGoals !== undefined && expectedAwayGoals !== undefined && (
        <div className="flex items-center justify-center gap-8 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{expectedHomeGoals.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Beklenen Ev Golü</div>
          </div>
          <div className="text-muted-foreground">vs</div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary">{expectedAwayGoals.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Beklenen Dep Golü</div>
          </div>
        </div>
      )}

      {/* Score Heatmap */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Skor Olasılık Haritası</h4>
        <div className="relative">
          {/* Away goals label */}
          <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground whitespace-nowrap">
            Deplasman Golleri
          </div>
          
          <div className="ml-4">
            {/* Home goals header */}
            <div className="flex mb-1 ml-6">
              {Array.from({ length: maxGoals + 1 }, (_, i) => (
                <div key={i} className="w-10 h-6 flex items-center justify-center text-xs text-muted-foreground">
                  {i}
                </div>
              ))}
            </div>
            
            {/* Grid */}
            {grid.map((row, awayGoals) => (
              <div key={awayGoals} className="flex">
                <div className="w-6 h-10 flex items-center justify-center text-xs text-muted-foreground">
                  {awayGoals}
                </div>
                {row.map((prob, homeGoals) => (
                  <div
                    key={`${homeGoals}-${awayGoals}`}
                    className={cn(
                      'w-10 h-10 flex items-center justify-center text-xs font-medium rounded-sm m-0.5 transition-all hover:scale-110 cursor-default',
                      getHeatColor(prob),
                      prob > 0 ? 'text-foreground' : 'text-muted-foreground/50'
                    )}
                    title={`${homeGoals}-${awayGoals}: ${prob.toFixed(1)}%`}
                  >
                    {prob > 0 ? `${prob.toFixed(0)}%` : '-'}
                  </div>
                ))}
              </div>
            ))}
            
            {/* Home goals label */}
            <div className="text-center text-xs text-muted-foreground mt-2 ml-6">
              Ev Sahibi Golleri
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Most Likely Scores */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">En Olası Skorlar</h4>
        <div className="flex gap-3">
          {topScores.map((score, index) => (
            <div 
              key={index}
              className={cn(
                'flex-1 p-3 rounded-lg text-center border transition-all',
                index === 0 
                  ? 'bg-primary/20 border-primary/40' 
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

      {/* Goal Line Probabilities */}
      {goalLineProbabilities && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Gol Çizgileri</h4>
          <div className="space-y-2">
            {[
              { label: 'Alt/Üst 1.5', under: goalLineProbabilities.under15, over: goalLineProbabilities.over15 },
              { label: 'Alt/Üst 2.5', under: goalLineProbabilities.under25, over: goalLineProbabilities.over25 },
              { label: 'Alt/Üst 3.5', under: goalLineProbabilities.under35, over: goalLineProbabilities.over35 },
            ].map((line, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-20 text-xs text-muted-foreground">{line.label}</span>
                <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden relative">
                  <div 
                    className="absolute left-0 h-full bg-blue-500/60 flex items-center justify-end pr-2"
                    style={{ width: `${line.under * 100}%` }}
                  >
                    <span className="text-xs font-medium text-white">
                      {(line.under * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div 
                    className="absolute right-0 h-full bg-primary/60 flex items-center justify-start pl-2"
                    style={{ width: `${line.over * 100}%` }}
                  >
                    <span className="text-xs font-medium text-white">
                      {(line.over * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BTTS */}
      {bttsProbability !== undefined && (
        <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
          <span className="text-sm text-muted-foreground">Karşılıklı Gol (KG)</span>
          <div className="flex-1 h-3 bg-muted/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
              style={{ width: `${bttsProbability * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-primary">
            {(bttsProbability * 100).toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ScorePredictionChart;
