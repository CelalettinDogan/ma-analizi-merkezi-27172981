import React from 'react';
import { Users, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Team } from '@/types/footballApi';

interface TeamSelectorProps {
  label: string;
  teams: Team[];
  value: string;
  onChange: (teamId: string, teamName: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  excludeTeamId?: string;
  isHome?: boolean;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({
  label,
  teams,
  value,
  onChange,
  isLoading,
  disabled,
  excludeTeamId,
  isHome = true,
}) => {
  const filteredTeams = excludeTeamId 
    ? teams.filter(t => t.id.toString() !== excludeTeamId)
    : teams;

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-foreground">
        <Users className={`w-4 h-4 ${isHome ? 'text-primary' : 'text-secondary'}`} />
        {label}
      </Label>
      <Select 
        value={value} 
        onValueChange={(v) => {
          const team = teams.find(t => t.id.toString() === v);
          if (team) {
            onChange(v, team.name);
          }
        }}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="bg-muted/50 border-border focus:border-primary">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Yükleniyor...</span>
            </span>
          ) : (
            <SelectValue placeholder="Takım seçin..." />
          )}
        </SelectTrigger>
        <SelectContent className="bg-popover border-border max-h-[300px]">
          {filteredTeams.map((team) => (
            <SelectItem key={team.id} value={team.id.toString()}>
              <span className="flex items-center gap-2">
                {team.crest && (
                  <img 
                    src={team.crest} 
                    alt={team.name} 
                    className="w-5 h-5 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <span>{team.name}</span>
                {team.tla && (
                  <span className="text-muted-foreground text-xs">({team.tla})</span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TeamSelector;
