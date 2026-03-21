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
      if (item.path === '/chat' && !isAdmin && !isPremium) return { ...item, badge: 'premium' as const };
      return item;
    });
  }, [isAdmin, isPremium]);

  const handleClick = useCallback((item: NavItem, e: React.MouseEvent) => {
    e.preventDefault();
    if (item.isAction && onSearchClick) { onSearchClick(); return; }
    navigate(item.path);
  }, [onSearchClick, navigate]);

  if (!isResolved) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" ref={ref}>
        <div className="mx-3 mb-3 rounded-[22px] bg-card/70 backdrop-blur-2xl border border-border/10 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-center py-2 px-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex-1 flex flex-col items-center justify-center py-2 min-h-[52px] gap-1">
                <div className="w-[24px] h-[24px] rounded-lg bg-muted animate-pulse" />
                <div className="w-6 h-2.5 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" ref={ref}>
      <div
        className="mx-3 mb-3 rounded-[22px] bg-card/75 backdrop-blur-2xl border border-border/10 shadow-[0_4px_32px_-4px_rgba(0,0,0,0.12),0_-2px_12px_rgba(0,0,0,0.04)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center py-1.5 px-1">
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
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={cn(
                  "relative flex flex-col items-center justify-center py-1.5",
                  "flex-1 min-h-[52px]",
                  "touch-manipulation rounded-2xl select-none"
                )}
              >
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <div className="relative">
                    {/* Active pill bg */}
                    {isActive && !isAI && (
                      <motion.div
                        layoutId="navPill"
                        className="absolute -inset-x-3.5 -inset-y-1.5 rounded-2xl bg-primary/12"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}

                    {/* AI special bg */}
                    {isAI && (
                      <motion.div
                        className={cn(
                          "absolute -inset-x-4 -inset-y-2 rounded-2xl",
                          isActive
                            ? "bg-gradient-to-br from-primary/15 to-primary/6 shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                            : "bg-primary/5"
                        )}
                        layoutId={isActive ? "navPill" : undefined}
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}

                    <motion.div
                      className="relative"
                      animate={{ scale: isActive ? 1.12 : 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <Icon
                        className={cn(
                          "transition-colors duration-200",
                          isAI ? "w-[26px] h-[26px]" : "w-[24px] h-[24px]",
                          isActive
                            ? "text-primary"
                            : isAI
                              ? "text-primary/50"
                              : "text-muted-foreground/45"
                        )}
                        strokeWidth={isActive ? 2.3 : 1.7}
                        {...(isActive ? { fill: 'currentColor', fillOpacity: 0.12 } : {})}
                      />
                      {item.badge === 'live' && (
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-destructive rounded-full animate-pulse ring-2 ring-card/80" />
                      )}
                      {item.badge === 'premium' && isAI && (
                        <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-primary/50 rounded-full ring-2 ring-card/80" />
                      )}
                    </motion.div>
                  </div>

                  <span className={cn(
                    "text-[10px] leading-none whitespace-nowrap transition-all duration-200",
                    isActive
                      ? "text-primary font-bold"
                      : isAI
                        ? "text-primary/50 font-medium"
                        : "text-muted-foreground/45 font-medium"
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
