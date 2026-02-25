import React, { useState, useMemo } from 'react';
import { AlertCircle, Users, Brain, BarChart3, TrendingUp, Target, Sparkles, History, Activity, Crosshair } from 'lucide-react';
import { MatchAnalysis } from '@/types/match';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TeamRadarChart,
  GoalDistributionChart,
  TrendAnalysisChart,
  ConfidenceVisualizer,
} from '@/components/charts';
import ScorePredictionChart from '@/components/charts/ScorePredictionChart';
import MatchContextCard from '@/components/MatchContextCard';
import PowerComparisonCard from '@/components/PowerComparisonCard';
import SimilarMatchesSection from '@/components/SimilarMatchesSection';
import { Progress } from '@/components/ui/progress';
import { getHybridConfidence } from '@/lib/utils';

interface AnalysisSectionProps {
  analysis: MatchAnalysis;
}

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ analysis }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // AI destekli tahminlerin ortalama güvenini hesapla
  const aiPredictions = analysis.predictions.filter(p => p.isAIPowered);
  const avgAIConfidence = aiPredictions.length > 0
    ? aiPredictions.reduce((sum, p) => sum + (p.aiConfidence || 0), 0) / aiPredictions.length
    : 0;

  const hasAdvancedData = analysis.poissonData || analysis.context || analysis.homePower;

  // KG tahmininin hibrit güvenini hesapla
  const bttsHybridConfidence = useMemo(() => {
    const bttsPred = analysis.predictions.find(p => p.type === 'Karşılıklı Gol');
    if (!bttsPred) return undefined;
    return getHybridConfidence(bttsPred);
  }, [analysis.predictions]);

  return (
    <div className="space-y-6">
      {/* AI Enhanced Badge */}
      {analysis.isAIEnhanced && (
        <div className="glass-card p-4 animate-fade-in border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">AI Destekli Analiz</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                  Hibrit Model
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Bu analiz yapay zeka ile güçlendirilmiştir. Ortalama AI güveni: {Math.round(avgAIConfidence * 100)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Visualization Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6 h-auto">
          <TabsTrigger value="overview" className="gap-2 py-2">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">Genel</span>
          </TabsTrigger>
          {analysis.isAIEnhanced && (
            <TabsTrigger value="ai" className="gap-2 py-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI</span>
            </TabsTrigger>
          )}
          {hasAdvancedData && (
            <TabsTrigger value="poisson" className="gap-2 py-2">
              <Crosshair className="w-4 h-4" />
              <span className="hidden sm:inline">Gol</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="performance" className="gap-2 py-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Performans</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2 py-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Trendler</span>
          </TabsTrigger>
          <TabsTrigger value="confidence" className="gap-2 py-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Güven</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Context and Power Cards */}
          {(analysis.context || analysis.homePower) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analysis.context && (
                <MatchContextCard 
                  context={analysis.context}
                  homeTeam={analysis.input.homeTeam}
                  awayTeam={analysis.input.awayTeam}
                />
              )}
              {analysis.homePower && analysis.awayPower && (
                <PowerComparisonCard
                  homeTeam={analysis.input.homeTeam}
                  awayTeam={analysis.input.awayTeam}
                  homePower={analysis.homePower}
                  awayPower={analysis.awayPower}
                />
              )}
            </div>
          )}

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

        {/* AI Analysis Tab */}
        {analysis.isAIEnhanced && (
          <TabsContent value="ai" className="space-y-6">
            <div className="glass-card p-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-foreground">AI Tahmin Detayları</h3>
                  <p className="text-sm text-muted-foreground">Yapay zeka analizi ile güçlendirilmiş tahminler</p>
                </div>
              </div>

              <div className="space-y-6">
                {aiPredictions.map((prediction, index) => (
                  <div key={index} className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground">{prediction.type}</h4>
                      <span className="text-lg font-bold gradient-text">{prediction.prediction}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> AI Güveni
                          </span>
                          <span className="font-medium">{Math.round((prediction.aiConfidence || 0) * 100)}%</span>
                        </div>
                        <Progress value={(prediction.aiConfidence || 0) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">📊 Matematik</span>
                          <span className="font-medium">{Math.round((prediction.mathConfidence || 0) * 100)}%</span>
                        </div>
                        <Progress value={(prediction.mathConfidence || 0) * 100} className="h-2" />
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">{prediction.reasoning}</p>
                  </div>
                ))}
              </div>

              {/* Model Bilgisi */}
              <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold text-foreground mb-2">Hibrit Model Hakkında</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• <strong>%40 AI Analizi:</strong> Gemini AI ile derin maç analizi</li>
                  <li>• <strong>%40 Matematiksel:</strong> Form, gol ortalaması, H2H verileri</li>
                  <li>• <strong>%20 Temel:</strong> Genel futbol kalıpları</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        )}

        {/* Poisson / Goal Prediction Tab */}
        {hasAdvancedData && (
          <TabsContent value="poisson" className="space-y-6">
            {analysis.poissonData && (
              <div className="glass-card p-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Crosshair className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-foreground">Poisson Gol Analizi</h3>
                    <p className="text-sm text-muted-foreground">İstatistiksel gol dağılımı ve olasılıklar</p>
                  </div>
                </div>

                <ScorePredictionChart
                  scoreProbabilities={analysis.poissonData.scoreProbabilities}
                  goalLineProbabilities={analysis.poissonData.goalLineProbabilities}
                  bttsProbability={analysis.poissonData.bttsProbability}
                  expectedHomeGoals={analysis.poissonData.expectedHomeGoals}
                  expectedAwayGoals={analysis.poissonData.expectedAwayGoals}
                  bttsHybridConfidence={bttsHybridConfidence}
                />
              </div>
            )}

            {/* Similar Matches */}
            {analysis.similarMatches && analysis.similarMatches.length > 0 && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                    <History className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-foreground">Benzer Maçlar</h3>
                    <p className="text-sm text-muted-foreground">Geçmişteki benzer maçların analizi</p>
                  </div>
                </div>
                <SimilarMatchesSection 
                  matches={analysis.similarMatches}
                  stats={analysis.similarMatchStats}
                />
              </div>
            )}
          </TabsContent>
        )}

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
