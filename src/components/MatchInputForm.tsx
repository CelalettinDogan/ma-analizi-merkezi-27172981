import React, { useState, useEffect } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MatchInput } from '@/types/match';
import { Match, Team, CompetitionCode, SUPPORTED_COMPETITIONS } from '@/types/footballApi';
import { getTeams, getUpcomingMatches, getStandings } from '@/services/footballApiService';
import LeagueSelector from './LeagueSelector';
import TeamSelector from './TeamSelector';
import UpcomingMatches from './UpcomingMatches';
import { useToast } from '@/hooks/use-toast';

interface MatchInputFormProps {
  onSubmit: (data: MatchInput) => void;
}

const MatchInputForm: React.FC<MatchInputFormProps> = ({ onSubmit }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'select' | 'upcoming'>('select');
  
  // Form state
  const [selectedLeague, setSelectedLeague] = useState<CompetitionCode | ''>('');
  const [homeTeamId, setHomeTeamId] = useState('');
  const [homeTeamName, setHomeTeamName] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [awayTeamName, setAwayTeamName] = useState('');
  const [matchDate, setMatchDate] = useState('');
  
  // Data state
  const [teams, setTeams] = useState<Team[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load teams when league changes
  useEffect(() => {
    if (!selectedLeague) {
      setTeams([]);
      setHomeTeamId('');
      setHomeTeamName('');
      setAwayTeamId('');
      setAwayTeamName('');
      return;
    }

    const loadTeams = async () => {
      setIsLoadingTeams(true);
      try {
        const teamsData = await getTeams(selectedLeague);
        setTeams(teamsData);
      } catch (error) {
        console.error('Error loading teams:', error);
        toast({
          title: 'Hata',
          description: 'Takımlar yüklenemedi. Lütfen tekrar deneyin.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingTeams(false);
      }
    };

    loadTeams();
  }, [selectedLeague, toast]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLeague || !homeTeamName || !awayTeamName || !matchDate) {
      toast({
        title: 'Eksik Bilgi',
        description: 'Lütfen tüm alanları doldurun.',
        variant: 'destructive',
      });
      return;
    }

    const league = SUPPORTED_COMPETITIONS.find(c => c.code === selectedLeague);
    
    onSubmit({
      league: league?.name || selectedLeague,
      homeTeam: homeTeamName,
      awayTeam: awayTeamName,
      matchDate,
    });
  };

  const handleSelectMatch = (match: Match) => {
    const league = SUPPORTED_COMPETITIONS.find(c => c.code === selectedLeague);
    
    onSubmit({
      league: league?.name || selectedLeague,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      matchDate: match.utcDate.split('T')[0],
    });
  };

  const handleHomeTeamChange = (teamId: string, teamName: string) => {
    setHomeTeamId(teamId);
    setHomeTeamName(teamName);
  };

  const handleAwayTeamChange = (teamId: string, teamName: string) => {
    setAwayTeamId(teamId);
    setAwayTeamName(teamName);
  };

  return (
    <div className="glass-card p-6 md:p-8 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
          Maç Bilgilerini Girin
        </h2>
        <p className="text-muted-foreground">
          Analiz için lig ve takımları seçin veya yaklaşan maçlardan birini seçin
        </p>
      </div>

      {/* League Selector - Always visible */}
      <LeagueSelector 
        value={selectedLeague} 
        onChange={setSelectedLeague}
      />

      {selectedLeague && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'select' | 'upcoming')}>
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="select">Manuel Seçim</TabsTrigger>
            <TabsTrigger value="upcoming">
              Yaklaşan Maçlar
              {upcomingMatches.length > 0 && (
                <span className="ml-2 bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                  {upcomingMatches.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="mt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TeamSelector
                  label="Ev Sahibi Takım"
                  teams={teams}
                  value={homeTeamId}
                  onChange={handleHomeTeamChange}
                  isLoading={isLoadingTeams}
                  excludeTeamId={awayTeamId}
                  isHome={true}
                />

                <TeamSelector
                  label="Deplasman Takımı"
                  teams={teams}
                  value={awayTeamId}
                  onChange={handleAwayTeamChange}
                  isLoading={isLoadingTeams}
                  excludeTeamId={homeTeamId}
                  isHome={false}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="matchDate" className="flex items-center gap-2 text-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  Maç Tarihi
                </Label>
                <Input
                  id="matchDate"
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="bg-muted/50 border-border focus:border-primary"
                  required
                />
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                size="xl" 
                className="w-full mt-8"
                disabled={isSubmitting || !homeTeamName || !awayTeamName || !matchDate}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analiz Yapılıyor...
                  </>
                ) : (
                  'Analizi Başlat'
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="upcoming" className="mt-6">
            <UpcomingMatches
              matches={upcomingMatches}
              isLoading={isLoadingMatches}
              onSelectMatch={handleSelectMatch}
            />
          </TabsContent>
        </Tabs>
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
