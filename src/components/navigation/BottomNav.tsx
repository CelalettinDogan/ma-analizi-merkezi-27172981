import React, { useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Zap, Bot, Crown, Trophy, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAccessLevel } from '@/hooks/useAccessLevel';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  isAction?: boolean;
  badge?: 'premium' | 'live' | 'active';
}

const BottomNav = React.forwardRef<HTMLElement, { onSearchClick?: () => void }>(({ onSearchClick }, ref) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isPremium, isLoading } = useAccessLevel();
  const stableItemsRef = useRef<NavItem[] | null>(null);

  const computedItems = useMemo((): NavItem[] => {
    const baseItems: NavItem[] = [
      { icon: Home, label: 'Ana', path: '/' },
      { icon: Zap, label: 'Canlı', path: '/live', badge: 'live' as const },
      { icon: Bot, label: 'AI', path: '/chat' },
      { icon: Trophy, label: 'Lig', path: '/standings' },
      { icon: Crown, label: 'Pro', path: '/premium' },
      { icon: User, label: 'Profil', path: '/profile' },
    ];

    const filteredItems = (isPremium || isAdmin) 
      ? baseItems.filter(item => item.path !== '/premium')
      : baseItems;

    return filteredItems.map(item => {
      if (item.path === '/live') return item;
      if (item.path === '/chat') {
        if (isAdmin || isPremium) return item;
        return { ...item, badge: 'premium' as const };
      }
      if (item.path === '/premium') {
        return { ...item, badge: 'premium' as const };
      }
      return item;
    });
  }, [isAdmin, isPremium]);

  const navItems = useMemo(() => {
    if (!isLoading) {
      stableItemsRef.current = computedItems;
      return computedItems;
    }
    return stableItemsRef.current ?? computedItems;
  }, [isLoading, computedItems]);

  const handleClick = useCallback((item: NavItem, e: React.MouseEvent) => {
    e.preventDefault();
    if (item.isAction && onSearchClick) {
      onSearchClick();
      return;
    }
    navigate(item.path);
  }, [onSearchClick, navigate]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" ref={ref}>
      {/* Navigation bar — no gradient fade */}
      <div className="bg-card/95 backdrop-blur-2xl border-t border-border/30">
        <div 
          className="flex items-center py-1.5"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
                <button
                key={item.path}
                onClick={(e) => handleClick(item, e)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 py-2 px-1",
                  "flex-1 min-h-[48px]",
                  "touch-manipulation rounded-lg transition-colors duration-200"
                )}
              >
                {/* Active background — subtle */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/6 rounded-2xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                
                <div className="relative z-10">
                  <Icon 
                    className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground/70"
                    )} 
                  />
                  {item.badge === 'live' && (
                    <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-destructive rounded-full animate-pulse" />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium leading-none whitespace-nowrap transition-colors relative z-10",
                  isActive ? "text-primary" : "text-muted-foreground/70"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
