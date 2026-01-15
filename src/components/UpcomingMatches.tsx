import React from 'react';
import { Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { Match } from '@/types/footballApi';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface UpcomingMatchesProps {
  matches: Match[];
  isLoading: boolean;
  onSelectMatch: (match: Match) => void;
}

const UpcomingMatches: React.FC<UpcomingMatchesProps> = ({ 
  matches, 
  isLoading, 
  onSelectMatch 
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Maçlar yükleniyor...</span>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Yaklaşan maç bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        Yaklaşan Maçlar ({matches.length})
      </h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {matches.map((match) => (
          <button
            key={match.id}
            onClick={() => onSelectMatch(match)}
            className="w-full p-4 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    {match.homeTeam.crest && (
                      <img 
                        src={match.homeTeam.crest} 
                        alt={match.homeTeam.name}
                        className="w-6 h-6 object-contain"
                      />
                    )}
                    <span className="font-medium text-foreground">
                      {match.homeTeam.shortName || match.homeTeam.name}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-sm">vs</span>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="font-medium text-foreground">
                      {match.awayTeam.shortName || match.awayTeam.name}
                    </span>
                    {match.awayTeam.crest && (
                      <img 
                        src={match.awayTeam.crest} 
                        alt={match.awayTeam.name}
                        className="w-6 h-6 object-contain"
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {format(new Date(match.utcDate), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                  </span>
                  {match.matchday && (
                    <span className="ml-2">• Hafta {match.matchday}</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default UpcomingMatches;
