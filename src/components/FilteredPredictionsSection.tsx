import React, { useState } from 'react';
import { Prediction, MatchInput } from '@/types/match';
import PredictionCard from './PredictionCard';
import AdvancedFilters, { FilterOptions } from './AdvancedFilters';
import { useFilteredPredictions, getDefaultFilters } from '@/hooks/useFilteredPredictions';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

interface FilteredPredictionsSectionProps {
  predictions: Prediction[];
  matchInput: MatchInput;
}

const FilteredPredictionsSection: React.FC<FilteredPredictionsSectionProps> = ({
  predictions,
  matchInput,
}) => {
  const [filters, setFilters] = useState<FilterOptions>(getDefaultFilters());

  // Add matchDate to predictions for filtering
  const predictionsWithDate = predictions.map((p) => ({
    ...p,
    matchDate: matchInput.matchDate,
  }));

  const filteredPredictions = useFilteredPredictions(predictionsWithDate, filters);

  const hasActiveFilters =
    filters.dateFrom ||
    filters.dateTo ||
    filters.minConfidence > 0 ||
    filters.betTypes.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Bahis <span className="gradient-text">Tahminleri</span>
          </h2>
          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground mt-1">
              {filteredPredictions.length} / {predictions.length} tahmin gösteriliyor
            </p>
          )}
        </div>
        {filteredPredictions.length !== predictions.length && (
          <Badge variant="outline" className="self-start sm:self-auto">
            {filteredPredictions.length} sonuç
          </Badge>
        )}
      </div>

      <AdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableBetTypes={Array.from(new Set(predictions.map((p) => p.type)))}
      />

      {filteredPredictions.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed border-border">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-1">Sonuç bulunamadı</h3>
          <p className="text-sm text-muted-foreground">
            Seçili filtrelerle eşleşen tahmin yok. Filtreleri değiştirmeyi deneyin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPredictions.map((prediction, index) => (
            <PredictionCard
              key={index}
              prediction={prediction}
              index={index}
              matchInput={matchInput}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FilteredPredictionsSection;
