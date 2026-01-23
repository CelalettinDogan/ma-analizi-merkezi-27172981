import React from 'react';
import { Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnalysisSet } from '@/contexts/AnalysisSetContext';
import { useAuth } from '@/contexts/AuthContext';
import { Prediction, MatchInput } from '@/types/match';
import { Link } from 'react-router-dom';

interface AddToSetButtonProps {
  prediction: Prediction;
  matchInput: MatchInput;
}

const AddToSetButton: React.FC<AddToSetButtonProps> = ({ prediction, matchInput }) => {
  const { addToSet, isInSet } = useAnalysisSet();
  const { user } = useAuth();

  const isAdded = isInSet(matchInput.homeTeam, matchInput.awayTeam, prediction.type);

  const handleAdd = () => {
    if (isAdded) return;

    addToSet({
      league: matchInput.league,
      homeTeam: matchInput.homeTeam,
      awayTeam: matchInput.awayTeam,
      matchDate: matchInput.matchDate,
      predictionType: prediction.type,
      predictionValue: prediction.prediction,
      confidence: prediction.confidence,
      odds: null,
    });
  };

  if (!user) {
    return (
      <Link to="/auth">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-border hover:border-primary hover:bg-primary/10"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Giriş Yap</span>
        </Button>
      </Link>
    );
  }

  return (
    <Button
      variant={isAdded ? 'secondary' : 'outline'}
      size="sm"
      className={`gap-1.5 ${
        isAdded
          ? 'bg-primary/20 text-primary border-primary/30 cursor-default'
          : 'border-border hover:border-primary hover:bg-primary/10'
      }`}
      onClick={handleAdd}
      disabled={isAdded}
    >
      {isAdded ? (
        <>
          <Check className="h-3.5 w-3.5" />
          <span>Eklendi</span>
        </>
      ) : (
        <>
          <Plus className="h-3.5 w-3.5" />
          <span>Analize Ekle</span>
        </>
      )}
    </Button>
  );
};

export default AddToSetButton;
