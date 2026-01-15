import React, { useState } from 'react';
import { AlertCircle, Users, Brain, BarChart3, TrendingUp, Target } from 'lucide-react';
import { MatchAnalysis } from '@/types/match';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TeamRadarChart,
  GoalDistributionChart,
  TrendAnalysisChart,
  ConfidenceVisualizer,
} from '@/components/charts';

interface AnalysisSectionProps {
  analysis: MatchAnalysis;
}

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ analysis }) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Visualization Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview" className="gap-2">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">Genel Bakış</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Performans</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Trendler</span>
          </TabsTrigger>
          <TabsTrigger value="confidence" className="gap-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Güven</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
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
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeamRadarChart
              homeTeam={analysis.input.homeTeam}
              awayTeam={analysis.input.awayTeam}
              homeStats={analysis.homeTeamStats}
              awayStats={analysis.awayTeamStats}
            />
            <GoalDistributionChart
              homeTeam={analysis.input.homeTeam}
              awayTeam={analysis.input.awayTeam}
              homeStats={analysis.homeTeamStats}
              awayStats={analysis.awayTeamStats}
            />
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <TrendAnalysisChart
            homeTeam={analysis.input.homeTeam}
            awayTeam={analysis.input.awayTeam}
            homeStats={analysis.homeTeamStats}
            awayStats={analysis.awayTeamStats}
          />
        </TabsContent>

        {/* Confidence Tab */}
        <TabsContent value="confidence" className="space-y-6">
          <ConfidenceVisualizer predictions={analysis.predictions} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisSection;
