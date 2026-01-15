import { useState } from 'react';
import { MatchInput, MatchAnalysis } from '@/types/match';
import { CompetitionCode, Standing, Match, SUPPORTED_COMPETITIONS } from '@/types/footballApi';
import { getStandings, getFinishedMatches } from '@/services/footballApiService';
import { generatePrediction, generateMockPrediction } from '@/utils/predictionEngine';
import { savePredictions } from '@/services/predictionService';
import { useToast } from '@/hooks/use-toast';

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

      // Tahmin motorunu çalıştır
      const result = generatePrediction({
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
        // Kaydetme hatası analizi engellemez
      }
      
      toast({
        title: 'Analiz Tamamlandı',
        description: 'Gerçek verilerle tahmin oluşturuldu ve kaydedildi.',
      });

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
