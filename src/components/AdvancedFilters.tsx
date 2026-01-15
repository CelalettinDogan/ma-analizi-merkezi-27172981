import React, { useState } from 'react';
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
  minConfidence: number; // 0-100
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

const DEFAULT_BET_TYPES = [
  'Maç Sonucu',
  'Karşılıklı Gol',
  'Toplam Gol',
  'İlk Yarı Sonucu',
  'Handikap',
  'Çifte Şans',
];

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  availableBetTypes = DEFAULT_BET_TYPES,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

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
    if (value === 0) return 'Tümü';
    if (value <= 33) return 'Düşük+';
    if (value <= 66) return 'Orta+';
    return 'Yüksek';
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
              <span className="font-semibold">Gelişmiş Filtreler</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount} aktif
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
                Tarih Aralığı
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Başlangıç
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
                    Bitiş
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
                  Minimum Güven Skoru
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
                <span>Tümü</span>
                <span>Düşük</span>
                <span>Orta</span>
                <span>Yüksek</span>
              </div>
            </div>

            {/* Bet Type Filter */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Target className="w-4 h-4 text-primary" />
                Bahis Tipleri
              </Label>
              <div className="flex flex-wrap gap-2">
                {availableBetTypes.map((type) => (
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
                  {filters.betTypes.length} tip seçili
                </p>
              )}
            </div>

            {/* Sort Options */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <SortAsc className="w-4 h-4 text-primary" />
                Sıralama
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={filters.sortBy}
                  onValueChange={(v) => updateFilter('sortBy', v as FilterOptions['sortBy'])}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Sıralama kriteri" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Tarihe Göre</SelectItem>
                    <SelectItem value="confidence">Güven Skoruna Göre</SelectItem>
                    <SelectItem value="type">Bahis Tipine Göre</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.sortOrder}
                  onValueChange={(v) => updateFilter('sortOrder', v as FilterOptions['sortOrder'])}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Sıra" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Artan</SelectItem>
                    <SelectItem value="desc">Azalan</SelectItem>
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
                Filtreleri Temizle
              </Button>
              <div className="text-xs text-muted-foreground">
                {activeFilterCount > 0
                  ? `${activeFilterCount} filtre uygulandı`
                  : 'Filtre yok'}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default AdvancedFilters;
