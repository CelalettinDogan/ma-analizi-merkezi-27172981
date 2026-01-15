import { useState } from 'react';
import { MatchInput, MatchAnalysis, Prediction } from '@/types/match';
import { CompetitionCode, Standing, SUPPORTED_COMPETITIONS } from '@/types/footballApi';
import { getStandings, getFinishedMatches } from '@/services/footballApiService';
import { generatePrediction, generateMockPrediction } from '@/utils/predictionEngine';
import { savePredictions } from '@/services/predictionService';
import { useToast } from '@/hooks/use-toast';
import { extractTeamFeatures, extractH2HFeatures, createFeatureRecord, extractMatchFeatures } from '@/utils/featureExtractor';
import { 
  getMLPrediction, 
  aiConfidenceToString, 
  convertAIResultToDisplay, 
  convertGoalsPrediction, 
  convertBTTSPrediction 
} from '@/services/mlPredictionService';

// Hibrit güven hesaplama
function calculateHybridConfidence(aiConfidence: number, mathConfidence: number): 'düşük' | 'orta' | 'yüksek' {
  // 40% AI, 40% Math, 20% baseline
  const hybrid = aiConfidence * 0.4 + mathConfidence * 0.4 + 0.5 * 0.2;
  if (hybrid >= 0.7) return 'yüksek';
  if (hybrid >= 0.5) return 'orta';
  return 'düşük';
}

// Matematiksel güven değerini number'a çevir
function mathConfidenceToNumber(confidence: 'düşük' | 'orta' | 'yüksek'): number {
  switch (confidence) {
    case 'yüksek': return 0.8;
    case 'orta': return 0.6;
    case 'düşük': return 0.4;
  }
}

export function useMatchAnalysis() {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeMatch = async (data: MatchInput) => {
    setIsLoading(true);

    try {
      // Lig kodunu bul
      const competition = SUPPORTED_COMPETITIONS.find(
        c => c.name === data.league || c.code === data.league
      );

      if (!competition) {
        // API desteklemiyor, mock veri kullan
        const mockAnalysis = generateMockPrediction(
          data.homeTeam,
          data.awayTeam,
          data.league,
          data.matchDate
        );
        setAnalysis(mockAnalysis);
        return mockAnalysis;
      }

      const competitionCode = competition.code as CompetitionCode;

      // Paralel olarak verileri çek
      const [standings, finishedMatches] = await Promise.all([
        getStandings(competitionCode),
        getFinishedMatches(competitionCode, 60), // Son 60 günün maçları
      ]);

      // Takımları bul
      const homeStanding = standings.find(
        s => s.team.name.toLowerCase().includes(data.homeTeam.toLowerCase()) ||
             data.homeTeam.toLowerCase().includes(s.team.name.toLowerCase())
      );

      const awayStanding = standings.find(
        s => s.team.name.toLowerCase().includes(data.awayTeam.toLowerCase()) ||
             data.awayTeam.toLowerCase().includes(s.team.name.toLowerCase())
      );

      if (!homeStanding || !awayStanding) {
        toast({
          title: 'Takım Bulunamadı',
          description: 'Girilen takım isimleri puan durumunda bulunamadı. Mock veri kullanılıyor.',
          variant: 'destructive',
        });
        
        const mockAnalysis = generateMockPrediction(
          data.homeTeam,
          data.awayTeam,
          data.league,
          data.matchDate
        );
        setAnalysis(mockAnalysis);
        return mockAnalysis;
      }

      // H2H maçlarını filtrele
      const h2hMatches = finishedMatches.filter(match => {
        const teams = [match.homeTeam.id, match.awayTeam.id];
        return teams.includes(homeStanding.team.id) && teams.includes(awayStanding.team.id);
      });

      // Son maçları filtrele
      const homeRecentMatches = finishedMatches
        .filter(m => m.homeTeam.id === homeStanding.team.id || m.awayTeam.id === homeStanding.team.id)
        .slice(0, 5);

      const awayRecentMatches = finishedMatches
        .filter(m => m.homeTeam.id === awayStanding.team.id || m.awayTeam.id === awayStanding.team.id)
        .slice(0, 5);

      // Matematiksel tahmin motorunu çalıştır
      const mathResult = generatePrediction({
        homeTeam: {
          standing: homeStanding,
          recentMatches: homeRecentMatches,
        },
        awayTeam: {
          standing: awayStanding,
          recentMatches: awayRecentMatches,
        },
        h2hMatches,
        league: data.league,
        matchDate: data.matchDate,
      });

      // Feature'ları çıkar
      const features = extractMatchFeatures(homeStanding, awayStanding, mathResult.headToHead);

      // AI tahminlerini al
      let finalPredictions: Prediction[] = mathResult.predictions;
      let isAIEnhanced = false;

      try {
        const mlResult = await getMLPrediction(
          features.homeTeam,
          features.awayTeam,
          features.h2h,
          data.league
        );

        if (mlResult?.success && mlResult.predictions) {
          isAIEnhanced = true;
          const ai = mlResult.predictions;
          
          // Hibrit tahminler oluştur
          finalPredictions = [
            {
              type: 'Maç Sonucu',
              prediction: convertAIResultToDisplay(ai.matchResult.prediction, homeStanding.team.name, awayStanding.team.name),
              confidence: calculateHybridConfidence(
                ai.matchResult.confidence,
                mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'Maç Sonucu')?.confidence || 'orta')
              ),
              reasoning: ai.matchResult.reasoning,
              isAIPowered: true,
              aiConfidence: ai.matchResult.confidence,
              mathConfidence: mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'Maç Sonucu')?.confidence || 'orta'),
            },
            {
              type: 'Toplam Gol Alt/Üst',
              prediction: convertGoalsPrediction(ai.totalGoals.prediction),
              confidence: calculateHybridConfidence(
                ai.totalGoals.confidence,
                mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'Toplam Gol Alt/Üst')?.confidence || 'orta')
              ),
              reasoning: ai.totalGoals.reasoning,
              isAIPowered: true,
              aiConfidence: ai.totalGoals.confidence,
              mathConfidence: mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'Toplam Gol Alt/Üst')?.confidence || 'orta'),
            },
            {
              type: 'Karşılıklı Gol',
              prediction: convertBTTSPrediction(ai.bothTeamsScore.prediction),
              confidence: calculateHybridConfidence(
                ai.bothTeamsScore.confidence,
                mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'Karşılıklı Gol')?.confidence || 'orta')
              ),
              reasoning: ai.bothTeamsScore.reasoning,
              isAIPowered: true,
              aiConfidence: ai.bothTeamsScore.confidence,
              mathConfidence: mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'Karşılıklı Gol')?.confidence || 'orta'),
            },
            {
              type: 'Doğru Skor',
              prediction: ai.correctScore.prediction,
              confidence: aiConfidenceToString(ai.correctScore.confidence),
              reasoning: ai.correctScore.reasoning,
              isAIPowered: true,
              aiConfidence: ai.correctScore.confidence,
              mathConfidence: 0.3, // Doğru skor her zaman düşük güven
            },
            {
              type: 'İlk Yarı Sonucu',
              prediction: convertAIResultToDisplay(ai.firstHalf.prediction, homeStanding.team.name, awayStanding.team.name),
              confidence: calculateHybridConfidence(
                ai.firstHalf.confidence,
                mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'İlk Yarı Sonucu')?.confidence || 'orta')
              ),
              reasoning: ai.firstHalf.reasoning,
              isAIPowered: true,
              aiConfidence: ai.firstHalf.confidence,
              mathConfidence: mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'İlk Yarı Sonucu')?.confidence || 'orta'),
            },
          ];

          toast({
            title: '🤖 AI Analizi Tamamlandı',
            description: 'Yapay zeka destekli hibrit tahminler oluşturuldu.',
          });
        }
      } catch (aiError) {
        console.error('AI prediction error (falling back to math):', aiError);
        // AI hatası durumunda matematiksel tahminlerle devam et
      }

      const result: MatchAnalysis = {
        ...mathResult,
        predictions: finalPredictions,
        isAIEnhanced,
      };

      setAnalysis(result);
      
      // Tahminleri veritabanına kaydet
      try {
        await savePredictions(
          data.league,
          result.input.homeTeam,
          result.input.awayTeam,
          data.matchDate,
          result.predictions
        );
      } catch (saveError) {
        console.error('Error saving predictions:', saveError);
      }
      
      if (!isAIEnhanced) {
        toast({
          title: 'Analiz Tamamlandı',
          description: 'Matematiksel verilerle tahmin oluşturuldu.',
        });
      }

      return result;
    } catch (error) {
      console.error('Analysis error:', error);
      
      toast({
        title: 'API Hatası',
        description: 'Gerçek veriler alınamadı, mock veri kullanılıyor.',
        variant: 'destructive',
      });

      // Fallback to mock data
      const mockAnalysis = generateMockPrediction(
        data.homeTeam,
        data.awayTeam,
        data.league,
        data.matchDate
      );
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
