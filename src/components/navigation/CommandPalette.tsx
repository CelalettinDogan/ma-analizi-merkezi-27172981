import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, BarChart3, Zap, User, Trophy, Clock, X, Loader2, Shield } from 'lucide-react';
import { Command as CommandPrimitive } from 'cmdk';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { SUPPORTED_COMPETITIONS, CompetitionCode } from '@/types/footballApi';
import { getTeams } from '@/services/footballApiService';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

const RECENT_SEARCHES_KEY = 'golmetrik_recent_searches';
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
    let isMounted = true;
    
    const fetchTeams = async () => {
      if (!open || teamsLoaded) return;
      
      setIsSearching(true);
      const teams: TeamResult[] = [];
      
      // Fetch teams from all leagues using cached standings (NO API CALL!)
      for (const league of SUPPORTED_COMPETITIONS) {
        if (!isMounted) break;
        
        try {
          const teamData = await getTeams(league.code);
          
          if (teamData && isMounted) {
            teamData.forEach((team) => {
              teams.push({
                id: team.id,
                name: team.name,
                shortName: team.shortName || team.name,
                crest: team.crest,
                leagueCode: league.code,
                leagueName: league.name,
              });
            });
          }
        } catch (e) {
          console.error(`Error fetching teams for ${league.code}:`, e);
        }
      }

      if (isMounted) {
        setAllTeams(teams);
        setTeamsLoaded(true);
        setIsSearching(false);
      }
    };
    
    fetchTeams();
    
    return () => {
      isMounted = false;
    };
  }, [open, teamsLoaded]);

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

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

  // Filter leagues based on search query
  const filteredLeagues = searchQuery.length >= 2 
    ? SUPPORTED_COMPETITIONS.filter(league => 
        league.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        league.country.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

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
    const team = allTeams.find(t => 
      t.name.toLowerCase() === search.toLowerCase() ||
      t.shortName.toLowerCase() === search.toLowerCase()
    );
    
    if (team) {
      handleTeamSelect(team);
    } else {
      runCommand(() => navigate('/'));
    }
  };

  const hasResults = teamResults.length > 0 || filteredLeagues.length > 0;
  const isActiveSearch = searchQuery.length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-lg">
        <CommandPrimitive 
          className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground"
          shouldFilter={false}
        >
          {/* Search Input */}
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Takım, lig veya sayfa ara..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Results */}
          <CommandPrimitive.List className="max-h-[350px] overflow-y-auto overflow-x-hidden p-2">
            {/* Loading State */}
            {isSearching && !teamsLoaded && (
              <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Takımlar yükleniyor...</span>
              </div>
            )}

            {/* Empty State for Active Search */}
            {isActiveSearch && !hasResults && teamsLoaded && (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">"{searchQuery}" için sonuç bulunamadı.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Başka bir takım veya lig deneyin
                </p>
              </div>
            )}

            {/* Team Results */}
            {teamResults.length > 0 && (
              <CommandPrimitive.Group heading="Takımlar" className="mb-2">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Takımlar</div>
                {teamResults.map((team) => (
                  <button
                    key={`${team.id}-${team.leagueCode}`}
                    onClick={() => handleTeamSelect(team)}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:bg-accent focus:text-accent-foreground"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden mr-3">
                      {team.crest ? (
                        <img src={team.crest} alt="" className="w-6 h-6 object-contain" />
                      ) : (
                        <Shield className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <span className="font-medium">{team.name}</span>
                    </div>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {team.leagueName}
                    </span>
                  </button>
                ))}
              </CommandPrimitive.Group>
            )}

            {/* League Results */}
            {filteredLeagues.length > 0 && (
              <CommandPrimitive.Group heading="Ligler" className="mb-2">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Ligler</div>
                {filteredLeagues.map((league) => (
                  <button
                    key={league.code}
                    onClick={() => {
                      addToRecentSearches(league.name);
                      runCommand(() => {
                        onLeagueSelect?.(league.code);
                        navigate('/');
                      });
                    }}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none",
                      "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    <span className="mr-2">{league.flag}</span>
                    <span>{league.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{league.country}</span>
                  </button>
                ))}
              </CommandPrimitive.Group>
            )}

            {/* Default View - No Active Search */}
            {!isActiveSearch && (
              <>
                {/* Navigation */}
                <div className="mb-2">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Sayfalar</div>
                  <button
                    onClick={() => runCommand(() => navigate('/'))}
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    <span>Ana Sayfa</span>
                  </button>
                  <button
                    onClick={() => runCommand(() => navigate('/live'))}
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                  >
                    <Zap className="mr-2 h-4 w-4 text-red-500" />
                    <span>Canlı Maçlar</span>
                    <span className="ml-auto text-xs text-muted-foreground">⚡ Canlı</span>
                  </button>
                  <button
                    onClick={() => runCommand(() => navigate('/dashboard'))}
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => runCommand(() => navigate('/profile'))}
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </button>
                </div>

                <div className="h-px bg-border my-2" />

                {/* Leagues */}
                <div className="mb-2">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Ligler</div>
                  {SUPPORTED_COMPETITIONS.map((league) => (
                    <button
                      key={league.code}
                      onClick={() => runCommand(() => {
                        onLeagueSelect?.(league.code);
                        navigate('/');
                      })}
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    >
                      <Trophy className="mr-2 h-4 w-4" />
                      <span className="mr-2">{league.flag}</span>
                      <span>{league.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{league.country}</span>
                    </button>
                  ))}
                </div>

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <>
                    <div className="h-px bg-border my-2" />
                    <div className="mb-2">
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Son Aramalar</span>
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
                      {recentSearches.map((search, idx) => (
                        <button
                          key={`${search}-${idx}`}
                          onClick={() => handleRecentSearchSelect(search)}
                          className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                        >
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{search}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
