import React from 'react';
import { History, TrendingUp, Minus, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SimilarMatch {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
  league: string;
  similarityScore: number;
}

export interface SimilarMatchStats {
  homeWinRate: number;
  drawRate: number;
  awayWinRate: number;
  avgHomeGoals: number;
  avgAwayGoals: number;
  bttsRate: number;
  over25Rate: number;
}

interface SimilarMatchesSectionProps {
  matches: SimilarMatch[];
  stats?: SimilarMatchStats;
}

const ResultIndicator: React.FC<{ homeScore: number; awayScore: number }> = ({ homeScore, awayScore }) => {
  if (homeScore > awayScore) {
    return (
      <div className="w-6 h-6 rounded-full bg-win/20 flex items-center justify-center">
        <TrendingUp className="w-3.5 h-3.5 text-win" />
      </div>
    );
  }
  if (homeScore < awayScore) {
    return (
      <div className="w-6 h-6 rounded-full bg-loss/20 flex items-center justify-center">
        <TrendingDown className="w-3.5 h-3.5 text-loss" />
      </div>
    );
  }
  return (
    <div className="w-6 h-6 rounded-full bg-draw/20 flex items-center justify-center">
      <Minus className="w-3.5 h-3.5 text-draw" />
    </div>
  );
};

const SimilarMatchesSection: React.FC<SimilarMatchesSectionProps> = ({ matches, stats }) => {
  if (matches.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <History className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">Benzer maç bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      {stats && (
        <div className="glass-card p-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Benzer Maçların Özeti</h4>
          
          {/* Result Distribution */}
          <div className="mb-4">
            <div className="flex h-3 rounded-full overflow-hidden">
              <div 
                className="bg-win transition-all"
                style={{ width: `${stats.homeWinRate}%` }}
                title={`Ev Sahibi: ${stats.homeWinRate.toFixed(0)}%`}
              />
              <div 
                className="bg-draw transition-all"
                style={{ width: `${stats.drawRate}%` }}
                title={`Beraberlik: ${stats.drawRate.toFixed(0)}%`}
              />
              <div 
                className="bg-loss transition-all"
                style={{ width: `${stats.awayWinRate}%` }}
                title={`Deplasman: ${stats.awayWinRate.toFixed(0)}%`}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs">
              <span className="text-win">Ev %{stats.homeWinRate.toFixed(0)}</span>
              <span className="text-draw">Ber %{stats.drawRate.toFixed(0)}</span>
              <span className="text-loss">Dep %{stats.awayWinRate.toFixed(0)}</span>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2 bg-muted/30 rounded-lg">
              <div className="text-base sm:text-lg font-bold text-foreground">{stats.avgHomeGoals.toFixed(1)}</div>
              <div className="text-[10px] xs:text-xs text-muted-foreground">Ev Golü</div>
            </div>
            <div className="p-2 bg-muted/30 rounded-lg">
              <div className="text-base sm:text-lg font-bold text-foreground">{stats.avgAwayGoals.toFixed(1)}</div>
              <div className="text-[10px] xs:text-xs text-muted-foreground">Dep Golü</div>
            </div>
            <div className="p-2 bg-muted/30 rounded-lg">
              <div className="text-base sm:text-lg font-bold text-primary">{stats.bttsRate.toFixed(0)}%</div>
              <div className="text-[10px] xs:text-xs text-muted-foreground">KG Var</div>
            </div>
            <div className="p-2 bg-muted/30 rounded-lg">
              <div className="text-base sm:text-lg font-bold text-secondary">{stats.over25Rate.toFixed(0)}%</div>
              <div className="text-[10px] xs:text-xs text-muted-foreground">Üst 2.5</div>
            </div>
          </div>
        </div>
      )}

      {/* Match List */}
      <div className="glass-card p-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <History className="w-4 h-4" />
          En Benzer {matches.length} Maç
        </h4>
        
        <div className="space-y-2">
          {matches.map((match, index) => (
            <div 
              key={index}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-colors',
                index === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/20 hover:bg-muted/30'
              )}
            >
              {/* Similarity Score */}
              <div className="w-12 text-center">
                <div className={cn(
                  'text-sm font-bold',
                  match.similarityScore > 80 ? 'text-primary' : 
                  match.similarityScore > 60 ? 'text-secondary' : 'text-muted-foreground'
                )}>
                  {match.similarityScore.toFixed(0)}%
                </div>
                <div className="text-[10px] text-muted-foreground">benzerlik</div>
              </div>

              {/* Match Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col xs:flex-row xs:items-center gap-0.5 xs:gap-2">
                  <span className="text-sm font-medium text-foreground truncate max-w-[90px] xs:max-w-[110px]">{match.homeTeam}</span>
                  <span className="text-xs text-muted-foreground hidden xs:block">vs</span>
                  <span className="text-sm font-medium text-foreground truncate max-w-[90px] xs:max-w-[110px]">{match.awayTeam}</span>
                </div>
                <div className="text-[10px] xs:text-xs text-muted-foreground mt-0.5">
                  {match.league} • {new Date(match.date).toLocaleDateString('tr-TR')}
                </div>
              </div>

              {/* Score */}
              <div className="flex items-center gap-2">
                <div className="text-lg font-bold text-foreground">
                  {match.homeScore} - {match.awayScore}
                </div>
                <ResultIndicator homeScore={match.homeScore} awayScore={match.awayScore} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimilarMatchesSection;
