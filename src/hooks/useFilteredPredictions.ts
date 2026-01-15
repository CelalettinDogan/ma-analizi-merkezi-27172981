import { useMemo } from 'react';
import { Prediction } from '@/types/match';
import { FilterOptions } from '@/components/AdvancedFilters';

interface FilterablePrediction extends Prediction {
  matchDate?: string;
}

export function useFilteredPredictions(
  predictions: FilterablePrediction[],
  filters: FilterOptions
): FilterablePrediction[] {
  return useMemo(() => {
    let filtered = [...predictions];

    // Filter by date range
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter((p) => {
        if (!p.matchDate) return true;
        const matchDate = new Date(p.matchDate);
        
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          if (matchDate < fromDate) return false;
        }
        
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          if (matchDate > toDate) return false;
        }
        
        return true;
      });
    }

    // Filter by minimum confidence
    if (filters.minConfidence > 0) {
      filtered = filtered.filter((p) => {
        const confidenceValue = getConfidenceValue(p.confidence);
        return confidenceValue >= filters.minConfidence;
      });
    }

    // Filter by bet types
    if (filters.betTypes.length > 0) {
      filtered = filtered.filter((p) =>
        filters.betTypes.some((type) =>
          p.type.toLowerCase().includes(type.toLowerCase())
        )
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'date':
          if (a.matchDate && b.matchDate) {
            comparison = new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
          }
          break;
        case 'confidence':
          comparison = getConfidenceValue(a.confidence) - getConfidenceValue(b.confidence);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [predictions, filters]);
}

function getConfidenceValue(confidence: string): number {
  switch (confidence.toLowerCase()) {
    case 'yüksek':
      return 100;
    case 'orta':
      return 66;
    case 'düşük':
      return 33;
    default:
      return 0;
  }
}

export function getDefaultFilters(): FilterOptions {
  return {
    dateFrom: '',
    dateTo: '',
    minConfidence: 0,
    betTypes: [],
    sortBy: 'confidence',
    sortOrder: 'desc',
  };
}
