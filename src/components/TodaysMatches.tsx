import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronRight, Star, Loader2, Clock, Sparkles, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Match } from '@/types/footballApi';
import { format, isToday, isTomorrow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import H2HSummaryBadge from '@/components/match/H2HSummaryBadge';
import { useH2HPreview } from '@/hooks/useH2HPreview';
import { useMatchAIPreview, useMatchAIPreviewExists } from '@/hooks/useMatchAIPreview';

const TEAM_OVERRIDES: Record<string, string> = {
  // Serie A
  'FC Internazionale Milano': 'Inter',
  'Internazionale Milano': 'Inter',
  'Inter Milan': 'Inter',
  'Parma Calcio 1913': 'Parma',
  'Hellas Verona FC': 'Verona',
  'Como 1907': 'Como',
  'Venezia FC': 'Venezia',
  'Torino FC': 'Torino',
  'Juventus FC': 'Juventus',
  'Atalanta BC': 'Atalanta',
  'AC Milan': 'Milan',
  'ACF Fiorentina': 'Fiorentina',
  'US Lecce': 'Lecce',
  'SSC Napoli': 'Napoli',
  'SS Lazio': 'Lazio',
  'AS Roma': 'Roma',
  'US Sassuolo': 'Sassuolo',
  'Cagliari Calcio': 'Cagliari',
  'Empoli FC': 'Empoli',
  'Udinese Calcio': 'Udinese',
  'Genoa CFC': 'Genoa',
  'Bologna FC 1909': 'Bologna',
  'UC Sampdoria': 'Sampdoria',
  'AC Monza': 'Monza',
  // La Liga
  'Atletico de Madrid': 'Atlético',
  'Atlético de Madrid': 'Atlético',
  'Athletic Club': 'Athletic',
  'Real Sociedad de Fútbol': 'Real Sociedad',
  'RC Celta de Vigo': 'Celta Vigo',
  'Rayo Vallecano de Madrid': 'Rayo Vallecano',
  'RCD Espanyol de Barcelona': 'Espanyol',
  'Real Betis Balompié': 'Betis',
  'Villarreal CF': 'Villarreal',
  'Getafe CF': 'Getafe',
  'CA Osasuna': 'Osasuna',
  'Deportivo Alavés': 'Alavés',
  'Real Valladolid CF': 'Valladolid',
  'UD Las Palmas': 'Las Palmas',
  'Girona FC': 'Girona',
  'Real Mallorca': 'Mallorca',
  'Cádiz CF': 'Cádiz',
  'Sevilla FC': 'Sevilla',
  'Valencia CF': 'Valencia',
  'CD Leganés': 'Leganés',
  'FC Barcelona': 'Barcelona',
  // Bundesliga
  'Borussia Dortmund': 'Dortmund',
  'Borussia Mönchengladbach': 'Gladbach',
  'VfB Stuttgart': 'Stuttgart',
  'VfL Wolfsburg': 'Wolfsburg',
  'TSG 1899 Hoffenheim': 'Hoffenheim',
  'Bayer 04 Leverkusen': 'Leverkusen',
  'RB Leipzig': 'Leipzig',
  '1. FC Union Berlin': 'Union Berlin',
  '1. FC Heidenheim 1846': 'Heidenheim',
  '1. FC Köln': 'Köln',
  '1. FSV Mainz 05': 'Mainz',
  'SC Freiburg': 'Freiburg',
  'FC Augsburg': 'Augsburg',
  'SV Werder Bremen': 'Werder Bremen',
  'Eintracht Frankfurt': 'Frankfurt',
  'FC Bayern München': 'Bayern',
  'FC St. Pauli 1910': 'St. Pauli',
  'Holstein Kiel': 'Kiel',
  'SV Darmstadt 98': 'Darmstadt',
  // Ligue 1
  'Paris Saint-Germain FC': 'PSG',
  'Paris Saint-Germain': 'PSG',
  'AS Monaco FC': 'Monaco',
  'AS Monaco': 'Monaco',
  'Olympique de Marseille': 'Marseille',
  'Olympique Lyonnais': 'Lyon',
  'LOSC Lille': 'Lille',
  'Stade Rennais FC 1901': 'Rennes',
  'RC Strasbourg Alsace': 'Strasbourg',
  'Racing Club de Lens': 'Lens',
  'RC Lens': 'Lens',
  'Stade Brestois 29': 'Brest',
  'Stade de Reims': 'Reims',
  'OGC Nice': 'Nice',
  'AJ Auxerre': 'Auxerre',
  'Le Havre AC': 'Le Havre',
  'Angers SCO': 'Angers',
  'FC Nantes': 'Nantes',
  'Toulouse FC': 'Toulouse',
  'Montpellier HSC': 'Montpellier',
  'AS Saint-Étienne': 'Saint-Étienne',
  'FC Lorient': 'Lorient',
  'FC Metz': 'Metz',
  'Clermont Foot 63': 'Clermont',
  // Premier League
  'Manchester United FC': 'Man United',
  'Manchester City FC': 'Man City',
  'Tottenham Hotspur FC': 'Tottenham',
  'Arsenal FC': 'Arsenal',
  'Chelsea FC': 'Chelsea',
  'Liverpool FC': 'Liverpool',
  'Newcastle United FC': 'Newcastle',
  'West Ham United FC': 'West Ham',
  'Wolverhampton Wanderers FC': 'Wolves',
  'Brighton & Hove Albion FC': 'Brighton',
  'Crystal Palace FC': 'Crystal Palace',
  'Nottingham Forest FC': 'Nott. Forest',
  'AFC Bournemouth': 'Bournemouth',
  'Aston Villa FC': 'Aston Villa',
  'Leicester City FC': 'Leicester',
  'Everton FC': 'Everton',
  'Fulham FC': 'Fulham',
  'Brentford FC': 'Brentford',
  'Ipswich Town FC': 'Ipswich',
  'Southampton FC': 'Southampton',
  // Champions League / European clubs
  'SL Benfica': 'Benfica',
  'Sporting CP': 'Sporting',
  'FC Porto': 'Porto',
  'AFC Ajax': 'Ajax',
  'PSV Eindhoven': 'PSV',
  'Feyenoord Rotterdam': 'Feyenoord',
  'FC Salzburg': 'Salzburg',
  'SK Sturm Graz': 'Sturm Graz',
  'Celtic FC': 'Celtic',
  'Rangers FC': 'Rangers',
  'Club Brugge KV': 'Club Brugge',
  'BSC Young Boys': 'Young Boys',
  'FK Crvena Zvezda': 'Crvena Zvezda',
  'GNK Dinamo Zagreb': 'Dinamo Zagreb',
  'Shakhtar Donetsk': 'Shakhtar',
  'Galatasaray SK': 'Galatasaray',
  'Fenerbahçe SK': 'Fenerbahçe',
  'Beşiktaş JK': 'Beşiktaş',
  'Trabzonspor': 'Trabzonspor',
};

const TEAM_PREFIXES = /^(US |AC |FC |ACF |AS |SS |SSC |SSD |UC |RC |CA |CF |CD |RCD |SD |UD |SC |BSC |TSG |VfB |VfL |SV |1\. |Borussia |Sporting |Atlético |Athletic |LOSC |OGC |AJ |SL |FK |GNK |Racing Club de |Stade de |Stade )/i;
const TEAM_SUFFIXES = / (Calcio|FC|SC|CF|BC|SFC|AFC|CFC|HSC|SCO|AC|KV|CP|JK|SK|1913|1910|1909|1907|1899|1846|1901|98|63|29|05|04|de Fútbol|Balompié)$/i;

const cleanTeamName = (team: { shortName?: string; tla?: string; name: string }): string => {
  // Check overrides first (against all available names)
  for (const key of [team.name, team.shortName]) {
    if (key && TEAM_OVERRIDES[key]) return TEAM_OVERRIDES[key];
  }
  const raw = team.shortName || team.name;
  const cleaned = raw.replace(TEAM_PREFIXES, '').replace(TEAM_SUFFIXES, '').trim();
  return cleaned || raw;
};

interface TodaysMatchesProps {
  matches: Match[];
  isLoading?: boolean;
  loadingMatchId?: number | null;
  onMatchSelect: (match: Match) => void;
  lastUpdated?: Date | null;
}

const BIG_TEAMS = [
  'Arsenal', 'Liverpool', 'Manchester City', 'Manchester United', 'Chelsea', 'Tottenham',
  'Barcelona', 'Real Madrid', 'Atletico Madrid',
  'Bayern', 'Dortmund',
  'Juventus', 'Inter', 'Milan', 'Napoli',
  'PSG', 'Monaco'
];

const isBigMatch = (match: Match): boolean => {
  const home = match.homeTeam.name.toLowerCase();
  const away = match.awayTeam.name.toLowerCase();
  return BIG_TEAMS.some(team => 
    home.includes(team.toLowerCase()) || away.includes(team.toLowerCase())
  );
};

const getFeaturedReason = (match: Match, allMatches: Match[]): string => {
  if (isBigMatch(match)) return 'Büyük Maç';
  const now = new Date();
  const sortedByTime = [...allMatches].sort((a, b) => 
    new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
  );
  const soonest = sortedByTime.find(m => new Date(m.utcDate) > now);
  if (soonest?.id === match.id) return 'En Yakın';
  return 'Önerilen';
};

const getDateLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Bugün';
  if (isTomorrow(date)) return 'Yarın';
  return format(date, 'd MMMM EEEE', { locale: tr });
};

const FeaturedMatchH2H: React.FC<{ match: Match }> = ({ match }) => {
  const { data, isLoading } = useH2HPreview(
    match.id,
    match.homeTeam.name,
    match.awayTeam.name
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/30">
        <Swords className="w-3 h-3 text-muted-foreground animate-pulse" />
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.lastMatches.length === 0) return null;

  return (
    <H2HSummaryBadge
      homeTeam={match.homeTeam.name}
      awayTeam={match.awayTeam.name}
      lastMatches={data.lastMatches}
      homeWins={data.homeWins}
      awayWins={data.awayWins}
      draws={data.draws}
    />
  );
};

// AI Preview Badge for featured match card
const AIPreviewBadge: React.FC<{ match: Match }> = ({ match }) => {
  const matchDate = match.utcDate.split('T')[0];
  const { topPredictions, hasData } = useMatchAIPreview(
    match.homeTeam.name,
    match.awayTeam.name,
    matchDate
  );

  if (!hasData) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/8 mt-3">
      <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
      <span className="text-micro font-medium text-primary/80">AI Tahmin</span>
      <div className="flex items-center gap-2 ml-auto">
        {topPredictions.map((pred, i) => (
          <React.Fragment key={pred.type}>
            {i > 0 && <span className="text-muted-foreground/30 text-micro">•</span>}
            <span className="text-xs font-semibold text-foreground/80">
              {pred.type}: <span className="text-primary">{pred.confidence}%</span>
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Micro AI indicator for list items
const AIIndicatorDot: React.FC<{ match: Match }> = ({ match }) => {
  const matchDate = match.utcDate.split('T')[0];
  const hasAI = useMatchAIPreviewExists(
    match.homeTeam.name,
    match.awayTeam.name,
    matchDate
  );

  if (!hasAI) return null;

  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 shrink-0">
      <Sparkles className="w-2.5 h-2.5 text-primary" />
      <span className="text-micro font-medium text-primary">AI</span>
    </span>
  );
};

const TodaysMatches: React.FC<TodaysMatchesProps> = ({ 
  matches, 
  isLoading = false, 
  loadingMatchId, 
  onMatchSelect,
  lastUpdated
}) => {
  const [showAll, setShowAll] = useState(false);

  const { featuredMatch, otherMatches, featuredReason, hasMatchesToday, title } = useMemo(() => {
    if (matches.length === 0) return { featuredMatch: null, otherMatches: [], featuredReason: '', hasMatchesToday: false, title: 'Bugünün Maçları' };
    
    const todayMatches = matches.filter(m => isToday(new Date(m.utcDate)));
    const hasToday = todayMatches.length > 0;
    const bigMatch = matches.find(isBigMatch);
    const featured = bigMatch || matches[0];
    const others = matches.filter(m => m.id !== featured?.id);
    const reason = getFeaturedReason(featured, matches);
    
    return { 
      featuredMatch: featured, 
      otherMatches: others, 
      featuredReason: reason,
      hasMatchesToday: hasToday,
      title: hasToday ? 'Bugünün Maçları' : 'Yaklaşan Maçlar'
    };
  }, [matches]);

  const displayedMatches = showAll ? otherMatches : otherMatches.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-primary" />
          <h2 className="font-display font-semibold text-sm">Bugünün Maçları</h2>
        </div>
        <div className="h-40 rounded-2xl bg-muted/20 animate-pulse" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted/10 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-primary" />
          <h2 className="font-display font-semibold text-sm">Bugünün Maçları</h2>
        </div>
        <div className="text-center py-12">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">Planlanmış maç bulunamadı</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Lig seçerek maçları görüntüleyin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header — minimal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-primary" />
          <h2 className="font-display font-semibold text-sm">{title}</h2>
          <span className="text-xs text-muted-foreground">{matches.length}</span>
        </div>
      </div>

      {/* Featured Match — Clean, borderless surface */}
      {featuredMatch && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => !loadingMatchId && onMatchSelect(featuredMatch)}
          disabled={!!loadingMatchId}
          className={cn(
            "relative w-full text-left rounded-2xl p-4 transition-all",
            "bg-card/60 backdrop-blur-sm shadow-md",
            "border border-border/50",
            loadingMatchId === featuredMatch.id && "opacity-80",
            loadingMatchId && loadingMatchId !== featuredMatch.id && "opacity-40"
          )}
        >
          {/* Loading Overlay */}
          {loadingMatchId === featuredMatch.id && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10"
            >
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span className="text-xs font-medium">Analiz ediliyor...</span>
              </div>
            </motion.div>
          )}

          {/* Top row: reason tag + H2H */}
          <div className="flex items-center justify-between flex-wrap gap-1.5 mb-4">
            <div className="flex items-center gap-2">
             <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-micro font-medium bg-muted/40 text-foreground/70">
                {featuredReason === 'Büyük Maç' ? (
                  <Sparkles className="w-3 h-3 text-foreground/50" />
                ) : featuredReason === 'En Yakın' ? (
                  <Clock className="w-3 h-3 text-foreground/50" />
                ) : (
                  <Star className="w-3 h-3 text-foreground/50" />
                )}
                {featuredReason}
              </span>
              {!hasMatchesToday && (
               <span className="text-micro text-muted-foreground/60">
                  {getDateLabel(featuredMatch.utcDate)}
                </span>
              )}
            </div>
            <FeaturedMatchH2H match={featuredMatch} />
          </div>

          {/* Teams row — stacked on narrow, side-by-side on wider */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Home */}
            <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                {featuredMatch.homeTeam.crest ? (
                  <img src={featuredMatch.homeTeam.crest} alt="" className="w-7 h-7 object-contain" />
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">
                    {featuredMatch.homeTeam.shortName?.[0] || 'H'}
                  </span>
                )}
              </div>
              <span className="font-medium text-sm leading-tight line-clamp-2 min-w-0">
                {cleanTeamName(featuredMatch.homeTeam)}
              </span>
            </div>

            {/* Center: Time */}
            <div className="flex flex-col items-center flex-shrink-0 px-1 sm:px-2">
              <span className="text-lg font-semibold text-primary tabular-nums">
                {format(new Date(featuredMatch.utcDate), 'HH:mm')}
              </span>
              <span className="text-micro text-muted-foreground/60">
                {featuredMatch.competition.code}
              </span>
            </div>

            {/* Away */}
            <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0 justify-end">
              <span className="font-medium text-sm leading-tight line-clamp-2 min-w-0 text-right">
                {cleanTeamName(featuredMatch.awayTeam)}
              </span>
              <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                {featuredMatch.awayTeam.crest ? (
                  <img src={featuredMatch.awayTeam.crest} alt="" className="w-7 h-7 object-contain" />
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">
                    {featuredMatch.awayTeam.shortName?.[0] || 'A'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CTA row */}
          <div className="flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-border/20">
            <span className="inline-flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Analiz Et</span>
              <ChevronRight className="w-3.5 h-3.5 text-primary" />
            </span>
          </div>
        </motion.button>
      )}

      {/* Match List — minimal rows */}
      <div className="divide-y divide-border/10">
        {!hasMatchesToday && displayedMatches.length > 0 && (
          <div className="text-micro text-muted-foreground/60 font-medium px-3 py-1.5">
            {getDateLabel(displayedMatches[0].utcDate)}
          </div>
        )}
        
        {displayedMatches.map((match, index) => {
          const matchTime = format(new Date(match.utcDate), 'HH:mm');
          const isThisLoading = loadingMatchId === match.id;
          const isAnyLoading = !!loadingMatchId;
          const prevMatch = displayedMatches[index - 1];
          const showDateSeparator = !hasMatchesToday && prevMatch && 
            match.utcDate.split('T')[0] !== prevMatch.utcDate.split('T')[0];

          return (
            <React.Fragment key={match.id}>
              {showDateSeparator && (
                <div className="text-micro text-muted-foreground/60 font-medium px-3 py-2 mt-2">
                  {getDateLabel(match.utcDate)}
                </div>
              )}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                whileTap={!isAnyLoading ? { scale: 0.98 } : {}}
                onClick={() => !isAnyLoading && onMatchSelect(match)}
                disabled={isAnyLoading}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-3 rounded-xl transition-colors text-left",
                  "min-h-[52px]",
                  isAnyLoading && !isThisLoading && "opacity-40",
                  isThisLoading && "bg-primary/5",
                  !isAnyLoading && "active:bg-muted/30"
                )}
              >
                {/* Time */}
                <span className={cn(
                  "text-xs font-medium w-10 shrink-0 tabular-nums",
                  isThisLoading ? "text-primary" : "text-muted-foreground/70"
                )}>
                  {matchTime}
                </span>

                {/* Teams */}
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  {match.homeTeam.crest && (
                    <img src={match.homeTeam.crest} alt="" className="w-5 h-5 object-contain shrink-0" />
                  )}
                  <span className="text-sm truncate min-w-0">
                    {cleanTeamName(match.homeTeam)}
                  </span>
                  <span className="text-muted-foreground/50 text-xs shrink-0">–</span>
                  <span className="text-sm truncate min-w-0">
                    {cleanTeamName(match.awayTeam)}
                  </span>
                  {match.awayTeam.crest && (
                    <img src={match.awayTeam.crest} alt="" className="w-5 h-5 object-contain shrink-0" />
                  )}
                </div>

                {/* League code */}
                <span className="text-micro text-muted-foreground/60 shrink-0">
                  {match.competition.code}
                </span>

                {/* Loading or chevron */}
                {isThisLoading ? (
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/20 shrink-0" />
                )}
              </motion.button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Show More */}
      {otherMatches.length > 5 && !showAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(true)}
          className="w-full text-primary text-xs h-9"
        >
          Tümünü Gör (+{otherMatches.length - 5})
        </Button>
      )}
    </div>
  );
};

export default TodaysMatches;
