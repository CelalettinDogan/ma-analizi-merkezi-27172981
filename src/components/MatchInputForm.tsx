import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MatchInput } from '@/types/match';
import { Match, CompetitionCode, SUPPORTED_COMPETITIONS } from '@/types/footballApi';
import { getUpcomingMatches } from '@/services/footballApiService';
import LeagueSelector from './LeagueSelector';
import UpcomingMatches from './UpcomingMatches';
import { useToast } from '@/hooks/use-toast';

interface MatchInputFormProps {
  onSubmit: (data: MatchInput) => void;
}

const MatchInputForm: React.FC<MatchInputFormProps> = ({ onSubmit }) => {
  const { t } = useTranslation('common');
  const { toast } = useToast();

  const [selectedLeague, setSelectedLeague] = useState<CompetitionCode | ''>('');
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  useEffect(() => {
    if (!selectedLeague) {
      setUpcomingMatches([]);
      return;
    }

    const loadMatches = async () => {
      setIsLoadingMatches(true);
      try {
        const matches = await getUpcomingMatches(selectedLeague, 14);
        setUpcomingMatches(matches);
      } catch (error) {
        console.error('Error loading matches:', error);
        toast({
          title: t('forms.errorTitle'),
          description: t('forms.matchLoadError'),
          variant: 'destructive',
        });
      } finally {
        setIsLoadingMatches(false);
      }
    };

    loadMatches();
  }, [selectedLeague, toast, t]);

  const handleSelectMatch = (match: Match) => {
    const league = SUPPORTED_COMPETITIONS.find(c => c.code === selectedLeague);
    onSubmit({
      league: league?.name || selectedLeague,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      matchDate: match.utcDate.split('T')[0],
    });
  };

  return (
    <div className="glass-card p-6 md:p-8 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
          {t('forms.matchInputTitle')}
        </h2>
        <p className="text-muted-foreground">{t('forms.matchInputDesc')}</p>
      </div>

      <LeagueSelector value={selectedLeague} onChange={setSelectedLeague} />

      {selectedLeague && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">{t('forms.upcomingMatches')}</h3>
            {upcomingMatches.length > 0 && (
              <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                {t('forms.matchesCount', { count: upcomingMatches.length })}
              </span>
            )}
          </div>
          <UpcomingMatches
            matches={upcomingMatches}
            isLoading={isLoadingMatches}
            onSelectMatch={handleSelectMatch}
          />
        </div>
      )}

      {!selectedLeague && (
        <div className="text-center py-8 text-muted-foreground">
          <p>{t('forms.selectLeagueFirst')}</p>
        </div>
      )}
    </div>
  );
};

export default MatchInputForm;
