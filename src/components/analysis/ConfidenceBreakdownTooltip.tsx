import React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Prediction } from '@/types/match';

interface ConfidenceBreakdownTooltipProps {
  prediction: Prediction;
  hybridConfidence: number;
}

const weights = [
  { label: 'Poisson Modeli', key: 'poisson', weight: 30, color: 'bg-primary' },
  { label: 'Form Skoru', key: 'form', weight: 25, color: 'bg-emerald-500' },
  { label: 'xG Etkisi', key: 'xg', weight: 25, color: 'bg-blue-500' },
  { label: 'Güç Puanı', key: 'power', weight: 20, color: 'bg-amber-500' },
];

const ConfidenceBreakdownTooltip: React.FC<ConfidenceBreakdownTooltipProps> = ({
  prediction,
  hybridConfidence,
}) => {
  const aiConf = prediction.aiConfidence ?? 0;
  const mathConf = prediction.mathConfidence ?? 0;

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full text-muted-foreground active:text-foreground transition-colors touch-manipulation">
            <Info className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="w-56 p-3 space-y-2.5">
          <p className="text-xs font-semibold text-foreground">
            %{Math.round(hybridConfidence)} Güven Nasıl Hesaplandı?
          </p>

          {aiConf > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>AI Güven</span>
              <span className="font-medium text-foreground">%{Math.round(aiConf)}</span>
            </div>
          )}
          {mathConf > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Matematik Güven</span>
              <span className="font-medium text-foreground">%{Math.round(mathConf)}</span>
            </div>
          )}

          <div className="pt-1.5 border-t border-border/50 space-y-1.5">
            <p className="text-micro text-muted-foreground font-medium">Ağırlık Dağılımı</p>
            {weights.map((w) => (
              <div key={w.key} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${w.color} shrink-0`} />
                <span className="text-micro text-muted-foreground flex-1">{w.label}</span>
                <span className="text-micro font-medium text-foreground">%{w.weight}</span>
              </div>
            ))}
          </div>

          <div className="flex h-1.5 rounded-full overflow-hidden">
            {weights.map((w) => (
              <div key={w.key} className={`${w.color}`} style={{ width: `${w.weight}%` }} />
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConfidenceBreakdownTooltip;
