import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import i18n from '@/i18n/config';

interface AIPreviewPrediction {
  type: string;
  confidence: number;
}

interface AIPreviewData {
  topPredictions: AIPreviewPrediction[];
  hasData: boolean;
}

const TYPE_TO_KEY: Record<string, string> = {
  'Maç Sonucu': 'matchResult',
  'Toplam Gol Alt/Üst': 'overUnder',
  'Karşılıklı Gol': 'btts',
  'Doğru Skor': 'correctScore',
  'İlk Yarı Sonucu': 'firstHalf',
  'İlk Yarı / Maç Sonucu': 'halfTimeFullTime',
  'İki Yarıda da Gol': 'firstHalfOverUnder',
};

const shortLabel = (type: string): string => {
  const key = TYPE_TO_KEY[type];
  if (!key) return type;
  return i18n.t(`predictions:shortLabels.${key}`) as string;
};

export function useMatchAIPreview(
  homeTeam: string,
  awayTeam: string,
  matchDate: string
): AIPreviewData {
  const matchKey = `${homeTeam}_vs_${awayTeam}_${matchDate}`;

  const { data } = useQuery({
    queryKey: ['ai-preview', matchKey],
    queryFn: async (): Promise<AIPreviewPrediction[]> => {
      const { data, error } = await supabase
        .from('cached_ai_predictions')
        .select('predictions')
        .eq('match_key', matchKey)
        .maybeSingle();

      if (error || !data?.predictions) return [];

      const predictions = data.predictions as any[];
      if (!Array.isArray(predictions)) return [];

      // Get top 2 predictions sorted by confidence
      return predictions
        .filter((p: any) => p.confidence && p.prediction_type)
        .sort((a: any, b: any) => (b.confidence || 0) - (a.confidence || 0))
        .slice(0, 2)
        .map((p: any) => ({
          type: PREDICTION_TYPE_SHORT[p.prediction_type] || p.prediction_type,
          confidence: Math.round(p.confidence),
        }));
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!homeTeam && !!awayTeam && !!matchDate,
  });

  return {
    topPredictions: data || [],
    hasData: (data?.length || 0) > 0,
  };
}

// Lightweight version for list items — just checks existence
export function useMatchAIPreviewExists(
  homeTeam: string,
  awayTeam: string,
  matchDate: string
): boolean {
  const matchKey = `${homeTeam}_vs_${awayTeam}_${matchDate}`;

  const { data } = useQuery({
    queryKey: ['ai-preview-exists', matchKey],
    queryFn: async () => {
      const { count } = await supabase
        .from('cached_ai_predictions')
        .select('id', { count: 'exact', head: true })
        .eq('match_key', matchKey);
      return (count || 0) > 0;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!homeTeam && !!awayTeam && !!matchDate,
  });

  return data || false;
}
