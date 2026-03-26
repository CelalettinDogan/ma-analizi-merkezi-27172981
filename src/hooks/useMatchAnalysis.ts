import { useState } from 'react';
import { MatchInput, MatchAnalysis } from '@/types/match';
import { generateMockPrediction } from '@/utils/predictionEngine';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { runFullAnalysis } from './analysis/runFullAnalysis';

export function useMatchAnalysis() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeMatch = async (data: MatchInput) => {
    setAnalysis(null);
    setIsLoading(true);

    try {
      // === ANALYSIS CACHING: Check DB for recent cached result (last 24h) ===
      if (user?.id) {
        try {
          const oneDayAgo = new Date();
          oneDayAgo.setHours(oneDayAgo.getHours() - 24);
          
          const { data: cachedPredictions } = await supabase
            .from('predictions')
            .select('*')
            .eq('home_team', data.homeTeam)
            .eq('away_team', data.awayTeam)
            .eq('match_date', data.matchDate)
            .eq('user_id', user.id)
            .gte('created_at', oneDayAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(7);

          if (cachedPredictions && cachedPredictions.length >= 3) {
            console.log(`[useMatchAnalysis] Cache hit: ${cachedPredictions.length} predictions found for ${data.homeTeam} vs ${data.awayTeam}`);
            
            // Reconstruct MatchAnalysis from cached predictions
            const cachedResult: MatchAnalysis = {
              input: {
                homeTeam: data.homeTeam,
                awayTeam: data.awayTeam,
                league: data.league,
                matchDate: data.matchDate,
                homeTeamCrest: data.homeTeamCrest,
                awayTeamCrest: data.awayTeamCrest,
              },
              predictions: cachedPredictions.map(p => ({
                type: p.prediction_type,
                prediction: p.prediction_value,
                confidence: p.confidence as 'düşük' | 'orta' | 'yüksek',
                reasoning: p.reasoning || '',
                isAIPowered: true,
                aiConfidence: p.hybrid_confidence ? Number(p.hybrid_confidence) / 100 : undefined,
                mathConfidence: 0.5,
              })),
              homeTeamStats: { form: [], goalsScored: 0, goalsConceded: 0 },
              awayTeamStats: { form: [], goalsScored: 0, goalsConceded: 0 },
              headToHead: { lastMatches: [], homeWins: 0, awayWins: 0, draws: 0 },
              tacticalAnalysis: '',
              keyFactors: [],
              injuries: { home: [], away: [] },
              isAIEnhanced: true,
            };

            setAnalysis(cachedResult);
            return cachedResult;
          }
        } catch (cacheError) {
          console.warn('[useMatchAnalysis] Cache check failed, proceeding with fresh analysis:', cacheError);
        }
      }

      const result = await runFullAnalysis({
        data,
        userId: user?.id,
        toastFn: (opts) => toast({ title: opts.title, description: opts.description, variant: opts.variant as 'default' | 'destructive' | undefined }),
      });

      setAnalysis(result);
      return result;
    } catch (error) {
      console.error('Analysis error:', error);
      
      toast({
        title: 'API Hatası',
        description: 'Gerçek veriler alınamadı, mock veri kullanılıyor.',
        variant: 'destructive',
      });

      const mockAnalysis = generateMockPrediction(data.homeTeam, data.awayTeam, data.league, data.matchDate);
      setAnalysis(mockAnalysis);
      return mockAnalysis;
    } finally {
      setIsLoading(false);
    }
  };

  const clearAnalysis = () => {
    setAnalysis(null);
  };

  return {
    analysis,
    isLoading,
    analyzeMatch,
    clearAnalysis,
  };
}
