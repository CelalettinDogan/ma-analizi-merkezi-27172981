import React from 'react';
import { Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBetSlip } from '@/contexts/BetSlipContext';
import { useAuth } from '@/contexts/AuthContext';
import { Prediction, MatchInput } from '@/types/match';
import { Link } from 'react-router-dom';

interface AddToSlipButtonProps {
  prediction: Prediction;
  matchInput: MatchInput;
}

const AddToSlipButton: React.FC<AddToSlipButtonProps> = ({ prediction, matchInput }) => {
  const { addToSlip, isInSlip } = useBetSlip();
  const { user } = useAuth();

  const isAdded = isInSlip(matchInput.homeTeam, matchInput.awayTeam, prediction.type);

  const handleAdd = () => {
    if (isAdded) return;

    addToSlip({
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

  // Show login prompt if not authenticated
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
          <span>Kupona Ekle</span>
        </>
      )}
    </Button>
  );
};

export default AddToSlipButton;