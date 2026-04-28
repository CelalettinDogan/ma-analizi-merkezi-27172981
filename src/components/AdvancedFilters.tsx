import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, Calendar, Target, SortAsc, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export interface FilterOptions {
  dateFrom: string;
  dateTo: string;
  minConfidence: number;
  betTypes: string[];
  sortBy: 'date' | 'confidence' | 'type';
  sortOrder: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableBetTypes?: string[];
  className?: string;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  availableBetTypes,
  className,
}) => {
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);

  const defaultBetTypes = [
    t('filters.betTypeNames.matchResult'),
    t('filters.betTypeNames.btts'),
    t('filters.betTypeNames.totalGoals'),
    t('filters.betTypeNames.firstHalf'),
    t('filters.betTypeNames.handicap'),
    t('filters.betTypeNames.doubleChance'),
  ];
  const types = availableBetTypes ?? defaultBetTypes;

  const updateFilter = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleBetType = (type: string) => {
    const newTypes = filters.betTypes.includes(type)
      ? filters.betTypes.filter((t) => t !== type)
      : [...filters.betTypes, type];
    updateFilter('betTypes', newTypes);
  };

  const clearFilters = () => {
    onFiltersChange({
      dateFrom: '',
      dateTo: '',
      minConfidence: 0,
      betTypes: [],
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  const activeFilterCount = [
    filters.dateFrom,
    filters.dateTo,
    filters.minConfidence > 0,
    filters.betTypes.length > 0,
  ].filter(Boolean).length;

  const getConfidenceLabel = (value: number) => {
    if (value === 0) return t('filters.confidence.all');
    if (value <= 33) return t('filters.confidence.low');
    if (value <= 66) return t('filters.confidence.medium');
    return t('filters.confidence.high');
  };

  return (
    <div className={cn('glass-card', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-4 h-auto"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              <span className="font-semibold">{t('filters.title')}</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {t('filters.active', { count: activeFilterCount })}
                </Badge>
              )}
            </div>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-6 pt-4 border-t border-border">
            {/* Date Range Filter */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="w-4 h-4 text-primary" />
                {t('filters.dateRange')}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    {t('filters.dateFrom')}
                  </Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => updateFilter('dateFrom', e.target.value)}
                    className="bg-muted/50"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    {t('filters.dateTo')}
                  </Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => updateFilter('dateTo', e.target.value)}
                    className="bg-muted/50"
                  />
                </div>
              </div>
            </div>

            {/* Confidence Score Filter */}
            <div className="space-y-3">
              <Label className="flex items-center justify-between text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  {t('filters.minConfidence')}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    filters.minConfidence === 0 && 'bg-muted',
                    filters.minConfidence > 0 && filters.minConfidence <= 33 && 'bg-loss/20 text-loss',
                    filters.minConfidence > 33 && filters.minConfidence <= 66 && 'bg-draw/20 text-draw',
                    filters.minConfidence > 66 && 'bg-win/20 text-win'
                  )}
                >
                  {getConfidenceLabel(filters.minConfidence)}
                </Badge>
              </Label>
              <Slider
                value={[filters.minConfidence]}
                onValueChange={([value]) => updateFilter('minConfidence', value)}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('filters.confidence.labelAll')}</span>
                <span>{t('filters.confidence.labelLow')}</span>
                <span>{t('filters.confidence.labelMedium')}</span>
                <span>{t('filters.confidence.labelHigh')}</span>
              </div>
            </div>

            {/* Bet Type Filter */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Target className="w-4 h-4 text-primary" />
                {t('filters.betTypes')}
              </Label>
              <div className="flex flex-wrap gap-2">
                {types.map((type) => (
                  <Badge
                    key={type}
                    variant={filters.betTypes.includes(type) ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer transition-all hover:scale-105',
                      filters.betTypes.includes(type)
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-primary/20'
                    )}
                    onClick={() => toggleBetType(type)}
                  >
                    {type}
                    {filters.betTypes.includes(type) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
              {filters.betTypes.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('filters.selectedCount', { count: filters.betTypes.length })}
                </p>
              )}
            </div>

            {/* Sort Options */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <SortAsc className="w-4 h-4 text-primary" />
                {t('filters.sort')}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={filters.sortBy}
                  onValueChange={(v) => updateFilter('sortBy', v as FilterOptions['sortBy'])}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder={t('filters.sortPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">{t('filters.sortByDate')}</SelectItem>
                    <SelectItem value="confidence">{t('filters.sortByConfidence')}</SelectItem>
                    <SelectItem value="type">{t('filters.sortByType')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.sortOrder}
                  onValueChange={(v) => updateFilter('sortOrder', v as FilterOptions['sortOrder'])}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder={t('filters.orderPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">{t('filters.asc')}</SelectItem>
                    <SelectItem value="desc">{t('filters.desc')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
              >
                <X className="w-4 h-4 mr-1" />
                {t('filters.clear')}
              </Button>
              <div className="text-xs text-muted-foreground">
                {activeFilterCount > 0
                  ? t('filters.appliedCount', { count: activeFilterCount })
                  : t('filters.noFilters')}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default AdvancedFilters;
