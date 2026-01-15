import React from 'react';
import { Swords, Calendar } from 'lucide-react';
import { HeadToHead } from '@/types/match';

interface HeadToHeadCardProps {
  h2h: HeadToHead;
  homeTeam: string;
  awayTeam: string;
}

const HeadToHeadCard: React.FC<HeadToHeadCardProps> = ({ h2h, homeTeam, awayTeam }) => {
  const total = h2h.homeWins + h2h.awayWins + h2h.draws;
  const homePercentage = total > 0 ? (h2h.homeWins / total) * 100 : 0;
  const drawPercentage = total > 0 ? (h2h.draws / total) * 100 : 0;
  const awayPercentage = total > 0 ? (h2h.awayWins / total) * 100 : 0;

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
          <Swords className="w-5 h-5 text-secondary" />
        </div>
        <h3 className="text-xl font-display font-bold text-foreground">Geçmiş Karşılaşmalar</h3>
      </div>

      {/* Kazanma Oranları */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-foreground font-medium">{homeTeam}</span>
          <span className="text-muted-foreground">Beraberlik</span>
          <span className="text-foreground font-medium">{awayTeam}</span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-muted">
          <div 
            className="bg-primary transition-all duration-500"
            style={{ width: `${homePercentage}%` }}
          />
          <div 
            className="bg-draw transition-all duration-500"
            style={{ width: `${drawPercentage}%` }}
          />
          <div 
            className="bg-secondary transition-all duration-500"
            style={{ width: `${awayPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-primary font-bold">{h2h.homeWins}</span>
          <span className="text-draw font-bold">{h2h.draws}</span>
          <span className="text-secondary font-bold">{h2h.awayWins}</span>
        </div>
      </div>

      {/* Son Maçlar */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground mb-3">Son Karşılaşmalar</p>
        {h2h.lastMatches.map((match, index) => (
          <div 
            key={index}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {match.date}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className={`font-medium ${match.homeTeam === homeTeam ? 'text-primary' : 'text-foreground'}`}>
                {match.homeTeam}
              </span>
              <span className="font-bold text-foreground bg-muted px-2 py-1 rounded">
                {match.score}
              </span>
              <span className={`font-medium ${match.awayTeam === awayTeam ? 'text-secondary' : 'text-foreground'}`}>
                {match.awayTeam}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeadToHeadCard;
