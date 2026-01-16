import React, { useState, useEffect } from 'react';
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
  const { toast } = useToast();
  
  // Form state
  const [selectedLeague, setSelectedLeague] = useState<CompetitionCode | ''>('');
  
  // Data state
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  // Load upcoming matches when league changes
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
          title: 'Hata',
          description: 'Maçlar yüklenemedi. Lütfen tekrar deneyin.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingMatches(false);
      }
    };

    loadMatches();
  }, [selectedLeague, toast]);

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
          Maç Bilgilerini Girin
        </h2>
        <p className="text-muted-foreground">
          Analiz için lig seçin ve yaklaşan maçlardan birini seçin
        </p>
      </div>

      {/* League Selector - Always visible */}
      <LeagueSelector 
        value={selectedLeague} 
        onChange={setSelectedLeague}
      />

      {selectedLeague && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Yaklaşan Maçlar</h3>
            {upcomingMatches.length > 0 && (
              <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                {upcomingMatches.length} maç
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
          <p>Başlamak için bir lig seçin</p>
        </div>
      )}
    </div>
  );
};

export default MatchInputForm;
