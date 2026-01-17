import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin } from 'lucide-react';
import { MatchInput, MatchInsights } from '@/types/match';
import MatchInsightBadges from '@/components/MatchInsightBadges';
import { SUPPORTED_COMPETITIONS } from '@/types/footballApi';

interface MatchHeroCardProps {
  match: MatchInput;
  insights?: MatchInsights;
  homeTeamCrest?: string;
  awayTeamCrest?: string;
}

const MatchHeroCard: React.FC<MatchHeroCardProps> = ({ match, insights, homeTeamCrest, awayTeamCrest }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const getLeagueName = (code: string) => {
    return SUPPORTED_COMPETITIONS.find(c => c.code === code)?.name || code;
  };

  const TeamLogo = ({ crest, teamName, gradient }: { crest?: string; teamName: string; gradient: string }) => {
    if (crest) {
      return (
        <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 rounded-xl bg-background/50 flex items-center justify-center border border-border/30 p-2">
          <img 
            src={crest} 
            alt={teamName}
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback to letter if image fails
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = `<span class="text-xl md:text-2xl font-bold ${gradient.includes('primary') ? 'text-primary' : 'text-secondary'}">${teamName.charAt(0)}</span>`;
            }}
          />
        </div>
      );
    }
    
    return (
      <div className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center border ${gradient.includes('primary') ? 'border-primary/20' : 'border-secondary/20'}`}>
        <span className={`text-xl md:text-2xl font-bold ${gradient.includes('primary') ? 'text-primary' : 'text-secondary'}`}>
          {teamName.charAt(0)}
        </span>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-muted/30 border border-border/50 p-4 md:p-6"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      {/* Content */}
      <div className="relative z-10">
        {/* League and Date - Compact */}
        <div className="flex items-center justify-center gap-3 mb-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium">{getLeagueName(match.league)}</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-border" />
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 text-secondary" />
            <span>{formatDate(match.matchDate)}</span>
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-center gap-3 md:gap-6">
          {/* Home Team */}
          <div className="flex-1 text-center">
            <TeamLogo 
              crest={homeTeamCrest} 
              teamName={match.homeTeam} 
              gradient="from-primary/20 to-primary/10"
            />
            <h2 className="text-sm md:text-base font-semibold text-foreground line-clamp-2">{match.homeTeam}</h2>
            <span className="text-xs text-muted-foreground">Ev Sahibi</span>
          </div>

          {/* VS Badge */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary/20 via-muted to-secondary/20 flex items-center justify-center border border-border/50">
              <span className="text-sm md:text-base font-bold text-muted-foreground">VS</span>
            </div>
          </div>

          {/* Away Team */}
          <div className="flex-1 text-center">
            <TeamLogo 
              crest={awayTeamCrest} 
              teamName={match.awayTeam} 
              gradient="from-secondary/20 to-secondary/10"
            />
            <h2 className="text-sm md:text-base font-semibold text-foreground line-clamp-2">{match.awayTeam}</h2>
            <span className="text-xs text-muted-foreground">Deplasman</span>
          </div>
        </div>

        {/* Insight Badges */}
        {insights && (
          <div className="flex justify-center mt-4">
            <MatchInsightBadges insights={insights} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MatchHeroCard;
