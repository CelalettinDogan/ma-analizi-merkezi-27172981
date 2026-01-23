import React from 'react';
import { X, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnalysisSetItem as AnalysisSetItemType } from '@/types/analysisSet';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

interface AnalysisSetItemProps {
  item: AnalysisSetItemType;
  onRemove: (id: string) => void;
}

const confidenceLabels: Record<string, string> = {
  düşük: 'Düşük Güven',
  orta: 'Orta Güven',
  yüksek: 'Yüksek Güven',
};

const confidenceColors: Record<string, string> = {
  düşük: 'text-loss bg-loss/10 border-loss/30',
  orta: 'text-draw bg-draw/10 border-draw/30',
  yüksek: 'text-win bg-win/10 border-win/30',
};

const formatMatchDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'd MMM', { locale: tr });
  } catch {
    return dateString;
  }
};

const AnalysisSetItem: React.FC<AnalysisSetItemProps> = ({ item, onRemove }) => {
  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className="truncate">{item.league}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatMatchDate(item.matchDate)}
            </span>
          </div>
          <p className="font-medium text-sm text-foreground">
            {item.homeTeam} vs {item.awayTeam}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0"
          onClick={() => onRemove(item.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Analysis Info */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">{item.predictionType}:</span>
          <span className="font-medium text-foreground">{item.predictionValue}</span>
        </div>
        <Badge
          variant="outline"
          className={`text-xs ${confidenceColors[item.confidence] || 'text-muted-foreground'}`}
        >
          {confidenceLabels[item.confidence] || item.confidence}
        </Badge>
      </div>
    </div>
  );
};

export default AnalysisSetItem;
