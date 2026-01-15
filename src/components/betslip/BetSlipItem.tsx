import React from 'react';
import { X } from 'lucide-react';
import { BetSlipItem as BetSlipItemType } from '@/types/betslip';
import { formatOdds } from '@/utils/oddsCalculator';
import { Button } from '@/components/ui/button';

interface BetSlipItemProps {
  item: BetSlipItemType;
  onRemove: (id: string) => void;
}

const confidenceLabels = {
  düşük: 'Düşük',
  orta: 'Orta',
  yüksek: 'Yüksek',
};

const confidenceColors = {
  düşük: 'text-loss',
  orta: 'text-draw',
  yüksek: 'text-win',
};

const BetSlipItemComponent: React.FC<BetSlipItemProps> = ({ item, onRemove }) => {
  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-2 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{item.league}</p>
          <p className="text-sm font-medium text-foreground truncate">
            {item.homeTeam} vs {item.awayTeam}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(item.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{item.predictionType}</p>
          <p className="text-sm font-semibold text-primary">{item.predictionValue}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Güven</p>
          <p className={`text-sm font-bold ${confidenceColors[item.confidence]}`}>
            {confidenceLabels[item.confidence]}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BetSlipItemComponent;
