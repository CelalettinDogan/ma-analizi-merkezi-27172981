import { useEffect, useRef } from 'react';
import type { AdminSection } from '@/components/admin/AdminSidebar';

interface Options {
  onOpenPalette: () => void;
  onSectionChange: (s: AdminSection) => void;
  onRefresh: () => void;
  onShowHelp?: () => void;
  enabled?: boolean;
}

const SECTION_KEYS: Record<string, AdminSection> = {
  d: 'dashboard',
  u: 'users',
  r: 'revenue',
  p: 'premium',
  a: 'ai',
  n: 'notifications',
  l: 'logs',
};

/**
 * Linear/Vercel-style hotkeys for the admin panel.
 * - ⌘K / Ctrl+K → command palette
 * - g + (d|u|r|p|a|n|l) → navigate
 * - shift+R → refresh active section
 * - ? → show shortcut help
 */
export const useAdminHotkeys = ({
  onOpenPalette,
  onSectionChange,
  onRefresh,
  onShowHelp,
  enabled = true,
}: Options) => {
  const gPressedAt = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const isTypingTarget = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        el.isContentEditable
      );
    };

    const handler = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K — always
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenPalette();
        return;
      }

      if (isTypingTarget(e.target)) return;

      // ? help
      if (e.key === '?' && onShowHelp) {
        e.preventDefault();
        onShowHelp();
        return;
      }

      // shift+R → refresh
      if (e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        onRefresh();
        return;
      }

      // g leader
      if (e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        gPressedAt.current = Date.now();
        return;
      }

      // g + section letter (within 1.2s)
      if (gPressedAt.current && Date.now() - gPressedAt.current < 1200) {
        const target = SECTION_KEYS[e.key.toLowerCase()];
        if (target) {
          e.preventDefault();
          gPressedAt.current = 0;
          onSectionChange(target);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, onOpenPalette, onSectionChange, onRefresh, onShowHelp]);
};
