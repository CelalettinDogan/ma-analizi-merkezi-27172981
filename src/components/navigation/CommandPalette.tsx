import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, BarChart3, Zap, User, Trophy, Clock } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { SUPPORTED_COMPETITIONS } from '@/types/footballApi';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeagueSelect?: (leagueCode: string) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  open, 
  onOpenChange,
  onLeagueSelect 
}) => {
  const navigate = useNavigate();
  const [recentSearches] = useState<string[]>([
    'Manchester United',
    'Real Madrid',
    'Bayern Munich'
  ]);

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

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Takım, lig veya sayfa ara..." />
      <CommandList>
        <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
        
        {/* Navigation */}
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
            <CommandGroup heading="Son Aramalar">
              {recentSearches.map((search) => (
                <CommandItem key={search}>
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{search}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
