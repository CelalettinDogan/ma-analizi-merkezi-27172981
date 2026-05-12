import React, { useEffect, useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  RefreshCw,
  Crown,
  Bell,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import type { AdminSection } from '@/components/admin/AdminSidebar';
import { NAV_ITEMS } from '@/components/admin/AdminSidebar';

interface AdminCommandPaletteProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSectionChange: (s: AdminSection) => void;
  onRefresh: () => void;
  onTriggerAnalytics: () => void;
  onJumpToUserSearch: (q: string) => void;
}

const SECTION_HOTKEY: Partial<Record<AdminSection, string>> = {
  dashboard: 'g d',
  users: 'g u',
  revenue: 'g r',
  premium: 'g p',
  ai: 'g a',
  notifications: 'g n',
  logs: 'g l',
};

const AdminCommandPalette: React.FC<AdminCommandPaletteProps> = ({
  open,
  onOpenChange,
  onSectionChange,
  onRefresh,
  onTriggerAnalytics,
  onJumpToUserSearch,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const run = (fn: () => void) => {
    onOpenChange(false);
    setTimeout(fn, 50);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Komut ara, sayfaya atla, kullanıcı ara..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>

        <CommandGroup heading="Sayfaya Atla">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                value={`nav ${item.label}`}
                onSelect={() => run(() => onSectionChange(item.id))}
              >
                <Icon className="w-4 h-4 mr-2" />
                <span>{item.label}</span>
                {SECTION_HOTKEY[item.id] && (
                  <CommandShortcut>{SECTION_HOTKEY[item.id]}</CommandShortcut>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Hızlı Eylemler">
          <CommandItem onSelect={() => run(onRefresh)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            <span>Aktif sayfayı yenile</span>
            <CommandShortcut>⇧ R</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(onTriggerAnalytics)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            <span>Analytics&apos;i şimdi hesapla</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onSectionChange('notifications'))}>
            <Bell className="w-4 h-4 mr-2" />
            <span>Yeni bildirim oluştur</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onSectionChange('users'))}>
            <Crown className="w-4 h-4 mr-2" />
            <span>Premium ata (kullanıcı seç)</span>
          </CommandItem>
        </CommandGroup>

        {query.trim().length >= 2 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Kullanıcı Ara">
              <CommandItem
                value={`search-${query}`}
                onSelect={() =>
                  run(() => {
                    onJumpToUserSearch(query.trim());
                    onSectionChange('users');
                  })
                }
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                <span>
                  &quot;{query.trim()}&quot; ile kullanıcı listesinde ara
                </span>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        <CommandGroup heading="Yardım">
          <CommandItem onSelect={() => run(() => onOpenChange(false))}>
            <HelpCircle className="w-4 h-4 mr-2" />
            <span>Klavye kısayolları</span>
            <CommandShortcut>?</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default AdminCommandPalette;
