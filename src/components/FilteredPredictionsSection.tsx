import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('analysis');
  const [filters, setFilters] = useState<FilterOptions>(getDefaultFilters());

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
            {t('predictions.title')} <span className="gradient-text">{t('predictions.titleAccent')}</span>
          </h2>
          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground mt-1">
              {t('predictions.showing', { filtered: filteredPredictions.length, total: predictions.length })}
            </p>
          )}
        </div>
        {filteredPredictions.length !== predictions.length && (
          <Badge variant="outline" className="self-start sm:self-auto">
            {t('predictions.results', { count: filteredPredictions.length })}
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
          <h3 className="font-semibold mb-1">{t('predictions.noResults')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('predictions.noResultsHint')}
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
