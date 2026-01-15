import React from 'react';
import { MapPin } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_COMPETITIONS, CompetitionCode } from '@/types/footballApi';

interface LeagueSelectorProps {
  value: CompetitionCode | '';
  onChange: (value: CompetitionCode) => void;
  disabled?: boolean;
}

const LeagueSelector: React.FC<LeagueSelectorProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-foreground">
        <MapPin className="w-4 h-4 text-primary" />
        Lig
      </Label>
      <Select value={value} onValueChange={(v) => onChange(v as CompetitionCode)} disabled={disabled}>
        <SelectTrigger className="bg-muted/50 border-border focus:border-primary">
          <SelectValue placeholder="Lig seçin..." />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {SUPPORTED_COMPETITIONS.map((comp) => (
            <SelectItem key={comp.code} value={comp.code}>
              <span className="flex items-center gap-2">
                <span>{comp.flag}</span>
                <span>{comp.name}</span>
                <span className="text-muted-foreground text-xs">({comp.country})</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LeagueSelector;
