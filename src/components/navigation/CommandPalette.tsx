import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, BarChart3, Zap, User, Trophy, Clock, X, Loader2, Shield } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { SUPPORTED_COMPETITIONS, CompetitionCode } from '@/types/footballApi';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeagueSelect?: (leagueCode: string) => void;
  onTeamSelect?: (teamName: string, leagueCode: string) => void;
}

interface TeamResult {
  id: number;
  name: string;
  shortName: string;
  crest: string;
  leagueCode: string;
  leagueName: string;
}

const RECENT_SEARCHES_KEY = 'futboltahmin_recent_searches';
const MAX_RECENT_SEARCHES = 5;

const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  open, 
  onOpenChange,
  onLeagueSelect,
  onTeamSelect
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [teamResults, setTeamResults] = useState<TeamResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allTeams, setAllTeams] = useState<TeamResult[]>([]);
  const [teamsLoaded, setTeamsLoaded] = useState(false);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading recent searches:', e);
    }
  }, []);

  // Fetch all teams once when palette opens
  useEffect(() => {
    if (open && !teamsLoaded) {
      fetchAllTeams();
    }
  }, [open, teamsLoaded]);

  const fetchAllTeams = async () => {
    setIsSearching(true);
    const teams: TeamResult[] = [];
    
    // Fetch teams from each league in parallel
    const promises = SUPPORTED_COMPETITIONS.slice(0, 3).map(async (league) => {
      try {
        const { data, error } = await supabase.functions.invoke('football-api', {
          body: { action: 'teams', competitionCode: league.code },
        });
        
        if (!error && data?.teams) {
          return data.teams.map((team: any) => ({
            id: team.id,
            name: team.name,
            shortName: team.shortName || team.name,
            crest: team.crest,
            leagueCode: league.code,
            leagueName: league.name,
          }));
        }
      } catch (e) {
        console.error(`Error fetching teams for ${league.code}:`, e);
      }
      return [];
    });

    try {
      const results = await Promise.all(promises);
      results.forEach(leagueTeams => teams.push(...leagueTeams));
      setAllTeams(teams);
      setTeamsLoaded(true);
    } catch (e) {
      console.error('Error fetching teams:', e);
    } finally {
      setIsSearching(false);
    }
  };

  // Filter teams based on search query
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const query = searchQuery.toLowerCase();
      const filtered = allTeams.filter(team => 
        team.name.toLowerCase().includes(query) ||
        team.shortName.toLowerCase().includes(query)
      ).slice(0, 8);
      setTeamResults(filtered);
    } else {
      setTeamResults([]);
    }
  }, [searchQuery, allTeams]);

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const addToRecentSearches = useCallback((search: string) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== search.toLowerCase());
      const updated = [search, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving recent searches:', e);
      }
      
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.error('Error clearing recent searches:', e);
    }
  }, []);

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    setSearchQuery('');
    command();
  };

  const handleTeamSelect = (team: TeamResult) => {
    addToRecentSearches(team.name);
    runCommand(() => {
      if (onTeamSelect) {
        onTeamSelect(team.name, team.leagueCode);
      } else {
        onLeagueSelect?.(team.leagueCode);
        navigate('/');
      }
    });
  };

  const handleRecentSearchSelect = (search: string) => {
    // Find the team in allTeams
    const team = allTeams.find(t => 
      t.name.toLowerCase() === search.toLowerCase() ||
      t.shortName.toLowerCase() === search.toLowerCase()
    );
    
    if (team) {
      handleTeamSelect(team);
    } else {
      // Just navigate to home with the search
      runCommand(() => navigate('/'));
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Takım, lig veya sayfa ara..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isSearching ? (
            <div className="flex items-center justify-center py-6 gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Aranıyor...</span>
            </div>
          ) : searchQuery.length >= 2 ? (
            <div className="py-6 text-center">
              <p>"{searchQuery}" için sonuç bulunamadı.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Başka bir takım veya lig deneyin
              </p>
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              Aramaya başlamak için en az 2 karakter yazın
            </div>
          )}
        </CommandEmpty>

        {/* Team Search Results */}
        {teamResults.length > 0 && (
          <CommandGroup heading="Takımlar">
            {teamResults.map((team) => (
              <CommandItem 
                key={`${team.id}-${team.leagueCode}`}
                onSelect={() => handleTeamSelect(team)}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                  {team.crest ? (
                    <img src={team.crest} alt="" className="w-6 h-6 object-contain" />
                  ) : (
                    <Shield className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{team.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {team.leagueName}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Navigation - Show when not actively searching */}
        {searchQuery.length < 2 && (
          <>
            <CommandGroup heading="Sayfalar">
              <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
                <Home className="mr-2 h-4 w-4" />
                <span>Ana Sayfa</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/live'))}>
                <Zap className="mr-2 h-4 w-4 text-red-500" />
                <span>Canlı Maçlar</span>
                <span className="ml-auto text-xs text-muted-foreground">⚡ Canlı</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/dashboard'))}>
                <BarChart3 className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/profile'))}>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            {/* Leagues */}
            <CommandGroup heading="Ligler">
              {SUPPORTED_COMPETITIONS.map((league) => (
                <CommandItem 
                  key={league.code}
                  onSelect={() => runCommand(() => {
                    onLeagueSelect?.(league.code);
                    navigate('/');
                  })}
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  <span className="mr-2">{league.flag}</span>
                  <span>{league.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{league.country}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            {recentSearches.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={
                  <div className="flex items-center justify-between w-full pr-2">
                    <span>Son Aramalar</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearRecentSearches();
                      }}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Temizle
                    </Button>
                  </div>
                }>
                  {recentSearches.map((search, idx) => (
                    <CommandItem 
                      key={`${search}-${idx}`}
                      onSelect={() => handleRecentSearchSelect(search)}
                    >
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{search}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </>
        )}

        {/* Show leagues in search results too */}
        {searchQuery.length >= 2 && (
          <>
            {SUPPORTED_COMPETITIONS.filter(league => 
              league.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              league.country.toLowerCase().includes(searchQuery.toLowerCase())
            ).length > 0 && (
              <CommandGroup heading="Ligler">
                {SUPPORTED_COMPETITIONS.filter(league => 
                  league.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  league.country.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((league) => (
                  <CommandItem 
                    key={league.code}
                    onSelect={() => runCommand(() => {
                      addToRecentSearches(league.name);
                      onLeagueSelect?.(league.code);
                      navigate('/');
                    })}
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    <span className="mr-2">{league.flag}</span>
                    <span>{league.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{league.country}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
