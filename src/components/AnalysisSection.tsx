import React from 'react';
import { AlertCircle, Users, Brain } from 'lucide-react';
import { MatchAnalysis } from '@/types/match';

interface AnalysisSectionProps {
  analysis: MatchAnalysis;
}

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ analysis }) => {
  return (
    <div className="space-y-6">
      {/* Taktiksel Analiz */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground">Taktiksel Analiz</h3>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          {analysis.tacticalAnalysis}
        </p>
      </div>

      {/* Önemli Faktörler */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-secondary" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground">Önemli Faktörler</h3>
        </div>
        <ul className="space-y-3">
          {analysis.keyFactors.map((factor, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                {index + 1}
              </span>
              <span className="text-muted-foreground">{factor}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Sakat ve Cezalı Oyuncular */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-loss/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-loss" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground">Sakat / Cezalı Oyuncular</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">{analysis.input.homeTeam}</h4>
            {analysis.injuries.home.length > 0 ? (
              <ul className="space-y-2">
                {analysis.injuries.home.map((player, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-loss" />
                    {player}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Eksik oyuncu bulunmamaktadır.</p>
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-secondary mb-3">{analysis.input.awayTeam}</h4>
            {analysis.injuries.away.length > 0 ? (
              <ul className="space-y-2">
                {analysis.injuries.away.map((player, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-loss" />
                    {player}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Eksik oyuncu bulunmamaktadır.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisSection;
