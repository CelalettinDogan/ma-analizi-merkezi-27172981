import React, { useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Radio, Sparkles, Crown, BarChart3, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCachedAccessLevel } from '@/hooks/useCachedAccessLevel';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  isAction?: boolean;
  badge?: 'premium' | 'live' | 'active';
  isAI?: boolean;
}

const BottomNav = React.forwardRef<HTMLElement, { onSearchClick?: () => void }>(({ onSearchClick }, ref) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isPremium, isResolved } = useCachedAccessLevel();

  const computedItems = useMemo((): NavItem[] => {
    const items: NavItem[] = [
      { icon: Home, label: 'Ana', path: '/' },
      { icon: Radio, label: 'Canlı', path: '/live', badge: 'live' as const },
      { icon: Sparkles, label: 'AI', path: '/chat', isAI: true },
      { icon: BarChart3, label: 'Lig', path: '/standings' },
      { icon: User, label: 'Profil', path: '/profile' },
    ];

    const showProTab = !isPremium && !isAdmin;
    if (showProTab) {
      items.splice(4, 0, { icon: Crown, label: 'Pro', path: '/premium', badge: 'premium' as const });
    }

    return items.map(item => {
      if (item.path === '/chat' && !isAdmin && !isPremium) {
        return { ...item, badge: 'premium' as const };
      }
      return item;
    });
  }, [isAdmin, isPremium]);

  const handleClick = useCallback((item: NavItem, e: React.MouseEvent) => {
    e.preventDefault();
    if (item.isAction && onSearchClick) {
      onSearchClick();
      return;
    }
    navigate(item.path);
  }, [onSearchClick, navigate]);

  // Skeleton nav while role is unresolved
  if (!isResolved) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" ref={ref}>
        <div className="bg-card/98 backdrop-blur-3xl border-t border-border/20 shadow-[0_-1px_3px_rgba(0,0,0,0.04)]">
          <div 
            className="flex items-center py-1"
            style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
          >
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-[52px] gap-0.5">
                <div className="w-[22px] h-[22px] rounded-md bg-muted animate-pulse" />
                <div className="w-6 h-2 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" ref={ref}>
      <div className="bg-card/98 backdrop-blur-3xl border-t border-border/20 shadow-[0_-1px_3px_rgba(0,0,0,0.04)]">
        <div 
          className="flex items-center py-1"
          style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
        >
          {computedItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const isAI = item.isAI;

            return (
              <motion.button
                key={item.path}
                onClick={(e) => handleClick(item, e)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                whileTap={{ scale: 0.92 }}
                transition={{ duration: 0.1 }}
                className={cn(
                  "relative flex flex-col items-center justify-center py-2 px-1",
                  "flex-1 min-h-[52px]",
                  "touch-manipulation rounded-lg",
                  "select-none"
                )}
              >
                <div className="relative z-10 flex flex-col items-center gap-0.5">
                  {/* Icon with pill indicator for active state */}
                  <div className="relative">
                    {isActive && (
                      <motion.div
                        layoutId="navPill"
                        className={cn(
                          "absolute -inset-x-3 -inset-y-1 rounded-full",
                          isAI
                            ? "bg-gradient-to-r from-primary/15 to-primary/8"
                            : "bg-primary/12"
                        )}
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <div className="relative">
                      <Icon
                        className={cn(
                          "w-[22px] h-[22px] transition-colors duration-150",
                          isActive
                            ? "text-primary"
                            : isAI
                              ? "text-primary/70"
                              : "text-muted-foreground/60"
                        )}
                        strokeWidth={isActive ? 2.25 : 1.8}
                        {...(isActive ? { fill: "currentColor", fillOpacity: 0.2 } : {})}
                      />
                      {item.badge === 'live' && (
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
                      )}
                      {item.badge === 'premium' && isAI && (
                        <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-primary/60 rounded-full" />
                      )}
                    </div>
                  </div>
                  
                  <span className={cn(
                    "text-[10px] leading-none whitespace-nowrap transition-colors duration-150",
                    isActive
                      ? "text-primary font-semibold"
                      : isAI
                        ? "text-primary/70 font-medium"
                        : "text-muted-foreground/60 font-medium"
                  )}>
                    {item.label}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
