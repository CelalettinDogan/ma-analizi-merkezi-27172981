import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Check, Share2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnalysisSet } from '@/contexts/AnalysisSetContext';
import { useAuth } from '@/contexts/AuthContext';
import { Prediction, MatchInput } from '@/types/match';
import { cn } from '@/lib/utils';
import { CONFIDENCE_THRESHOLDS } from '@/constants/predictions';
import { toast } from 'sonner';

interface StickyAnalysisCTAProps {
  prediction: Prediction;
  matchInput: MatchInput;
  onShare?: () => void;
}

// Helper to calculate hybrid confidence value
const getHybridConfidence = (prediction: Prediction): number => {
  const ai = prediction.aiConfidence || 0;
  const math = prediction.mathConfidence || 0;
  return ((ai + math) / 2) * 100;
};

// Helper to get confidence level
const getConfidenceLevel = (percentage: number): 'yüksek' | 'orta' | 'düşük' => {
  if (percentage >= CONFIDENCE_THRESHOLDS.HIGH) return 'yüksek';
  if (percentage >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'orta';
  return 'düşük';
};

const confidenceColors = {
  'yüksek': 'text-emerald-400',
  'orta': 'text-amber-400',
  'düşük': 'text-muted-foreground',
};

const StickyAnalysisCTA: React.FC<StickyAnalysisCTAProps> = ({
  prediction,
  matchInput,
  onShare,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToSet, items } = useAnalysisSet();
  
  const hybridConfidence = getHybridConfidence(prediction);
  const confidenceLevel = getConfidenceLevel(hybridConfidence);
  
  const isInSet = items.some(
    item => 
      item.homeTeam === matchInput.homeTeam &&
      item.awayTeam === matchInput.awayTeam &&
      item.predictionType === prediction.type
  );

  const handleAddToSet = () => {
    if (!user) {
      toast.info('Analiz kaydetmek için giriş yapmalısınız');
      navigate('/auth');
      return;
    }
    
    addToSet({
      homeTeam: matchInput.homeTeam,
      awayTeam: matchInput.awayTeam,
      league: matchInput.league,
      matchDate: matchInput.matchDate,
      predictionType: prediction.type,
      predictionValue: prediction.prediction,
      confidence: prediction.confidence,
      odds: null,
    });
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-[4.5rem] xs:bottom-20 md:bottom-4 left-0 right-0 z-40 px-3 xs:px-4"
    >
      <div className="max-w-lg mx-auto">
        <div className="bg-card/95 backdrop-blur-lg border border-border rounded-2xl shadow-xl p-2.5 xs:p-3">
          <div className="flex items-center gap-2 xs:gap-3">
            {/* Prediction Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 xs:gap-2">
                <Star className={cn("w-3.5 h-3.5 xs:w-4 xs:h-4 shrink-0", confidenceColors[confidenceLevel])} />
                <span className="text-xs xs:text-sm font-semibold text-foreground truncate max-w-[100px] xs:max-w-[140px]">
                  {prediction.prediction}
                </span>
              </div>
              <div className="flex items-center gap-1.5 xs:gap-2 text-[10px] xs:text-xs text-muted-foreground">
                <span className="truncate max-w-[60px] xs:max-w-[80px]">{prediction.type}</span>
                <span>•</span>
                <span className={confidenceColors[confidenceLevel]}>
                  %{Math.round(hybridConfidence)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 xs:gap-2 shrink-0">
              {onShare && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 xs:h-10 xs:w-10"
                  onClick={onShare}
                >
                  <Share2 className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                </Button>
              )}
              
              <Button
                onClick={handleAddToSet}
                disabled={isInSet}
                size="sm"
                className={cn(
                  "gap-1.5 xs:gap-2 min-w-[90px] xs:min-w-[110px] text-xs xs:text-sm h-8 xs:h-10 px-2.5 xs:px-4",
                  isInSet 
                    ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" 
                    : "bg-gradient-to-r from-primary to-emerald-500 hover:opacity-90"
                )}
              >
                {isInSet ? (
                  <>
                    <Check className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                    <span className="hidden xs:inline">Sette</span>
                    <span className="xs:hidden">✓</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                    <span className="hidden xs:inline">Analize Ekle</span>
                    <span className="xs:hidden">Ekle</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(StickyAnalysisCTA);
