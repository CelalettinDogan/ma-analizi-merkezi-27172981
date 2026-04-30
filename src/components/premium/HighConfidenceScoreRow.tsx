import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Crown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePlatformPremium } from '@/hooks/usePlatformPremium';
import { useMatchAIPreview } from '@/hooks/useMatchAIPreview';
import { Match } from '@/types/footballApi';
import { cn } from '@/lib/utils';
import useHapticTap from '@/hooks/useHapticTap';

const TEAM_OVERRIDES: Record<string, string> = {
  'FC Internazionale Milano': 'Inter', 'Manchester United FC': 'Man Utd',
  'Manchester City FC': 'Man City', 'Tottenham Hotspur FC': 'Tottenham',
  'Arsenal FC': 'Arsenal', 'Chelsea FC': 'Chelsea', 'Liverpool FC': 'Liverpool',
  'FC Barcelona': 'Barcelona', 'Atletico de Madrid': 'Atlético',
  'FC Bayern München': 'Bayern', 'Borussia Dortmund': 'Dortmund',
  'Paris Saint-Germain FC': 'PSG', 'Juventus FC': 'Juventus',
  'AC Milan': 'Milan', 'SSC Napoli': 'Napoli', 'AS Roma': 'Roma',
};

const shortName = (team: Match['homeTeam']): string => {
  if (team.name && TEAM_OVERRIDES[team.name]) return TEAM_OVERRIDES[team.name];
  return team.shortName || team.name;
};

interface HighConfidenceScoreRowProps {
  matches: Match[];
}

/** Finds the match with highest AI confidence score prediction */
const HighConfidenceScoreRowInner: React.FC<{ match: Match }> = ({ match }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('home');
  const { isPremium } = usePlatformPremium();
  const tap = useHapticTap('light');
  const matchDate = match.utcDate.split('T')[0];
  const { topPredictions, hasData } = useMatchAIPreview(match.homeTeam.name, match.awayTeam.name, matchDate);

  if (!hasData || topPredictions.length === 0) return null;

  const topConfidence = topPredictions[0]?.confidence ?? 0;
  const home = shortName(match.homeTeam);
  const away = shortName(match.awayTeam);

  // Mock score display based on prediction type
  const scoreDisplay = `${topPredictions[0]?.type} %${topConfidence}`;

  const handleUnlock = () => {
    tap();
    navigate('/premium');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-xl border border-amber-500/15 bg-gradient-to-r from-amber-500/5 via-amber-500/3 to-transparent overflow-hidden"
    >
      {/* Content */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Crown className="w-4 h-4 text-amber-500 shrink-0" />

        <div className={cn("flex items-center gap-2 flex-1 min-w-0", !isPremium && "blur-[5px] select-none pointer-events-none")}>
          {match.homeTeam.crest && <img src={match.homeTeam.crest} alt="" className="w-4 h-4 object-contain shrink-0" />}
          <span className="text-xs font-semibold truncate">{home}</span>
          <span className="text-micro text-muted-foreground/50">vs</span>
          <span className="text-xs font-semibold truncate">{away}</span>
          {match.awayTeam.crest && <img src={match.awayTeam.crest} alt="" className="w-4 h-4 object-contain shrink-0" />}
          <span className="ml-auto text-xs font-bold text-primary tabular-nums shrink-0">{scoreDisplay}</span>
        </div>

        {!isPremium && (
          <button
            onClick={handleUnlock}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/20 shrink-0 z-10"
          >
            <Lock className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-semibold text-amber-400 whitespace-nowrap">{t('todays.unlockPremium')}</span>
            <ChevronRight className="w-3 h-3 text-amber-500/60" />
          </button>
        )}
      </div>

      {/* Top label */}
      <div className="absolute top-0 left-3 -translate-y-1/2">
        <span className="text-[9px] font-semibold text-amber-500/70 bg-background px-1.5 py-0.5 rounded-full border border-amber-500/10">
          {t('todays.highConfidence')}
        </span>
      </div>
    </motion.div>
  );
};

/** Wrapper that picks the best match from the list */
const HighConfidenceScoreRow: React.FC<HighConfidenceScoreRowProps> = ({ matches }) => {
  // Pick the first big-team match or just the first match
  const BIG = ['Arsenal', 'Liverpool', 'Manchester City', 'Manchester United', 'Chelsea', 'Barcelona', 'Real Madrid', 'Bayern', 'PSG', 'Juventus', 'Inter', 'Milan', 'Napoli', 'Dortmund'];
  const bigMatch = matches.find(m =>
    BIG.some(t => m.homeTeam.name.toLowerCase().includes(t.toLowerCase()) || m.awayTeam.name.toLowerCase().includes(t.toLowerCase()))
  );
  const target = bigMatch || matches[0];
  if (!target) return null;

  return <HighConfidenceScoreRowInner match={target} />;
};

export default HighConfidenceScoreRow;
