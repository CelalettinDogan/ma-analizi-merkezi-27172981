import React from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { MatchInput } from '@/types/match';

interface MatchHeaderProps {
  match: MatchInput;
}

const MatchHeader: React.FC<MatchHeaderProps> = ({ match }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="glass-card p-6 md:p-8 mb-8 animate-fade-in">
      {/* League and Date */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="font-medium">{match.league}</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-border hidden md:block" />
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4 text-secondary" />
          <span>{formatDate(match.matchDate)}</span>
        </div>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-center gap-4 md:gap-8">
        <div className="flex-1 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-2xl md:text-3xl font-bold text-primary">
              {match.homeTeam.charAt(0)}
            </span>
          </div>
          <h2 className="text-lg md:text-2xl font-display font-bold text-foreground">{match.homeTeam}</h2>
          <span className="text-sm text-muted-foreground">Ev Sahibi</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-3xl md:text-5xl font-display font-bold gradient-text-gold">VS</div>
        </div>

        <div className="flex-1 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 rounded-full bg-secondary/20 flex items-center justify-center">
            <span className="text-2xl md:text-3xl font-bold text-secondary">
              {match.awayTeam.charAt(0)}
            </span>
          </div>
          <h2 className="text-lg md:text-2xl font-display font-bold text-foreground">{match.awayTeam}</h2>
          <span className="text-sm text-muted-foreground">Deplasman</span>
        </div>
      </div>
    </div>
  );
};

export default MatchHeader;
