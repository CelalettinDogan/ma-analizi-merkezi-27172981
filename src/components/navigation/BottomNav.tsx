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
        <div className="mx-2 mb-1.5 rounded-2xl bg-card/80 backdrop-blur-2xl border border-border/15 shadow-[0_-2px_16px_rgba(0,0,0,0.06)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-center py-1 px-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex-1 flex flex-col items-center justify-center py-1.5 min-h-[48px] gap-0.5">
                <div className="w-[22px] h-[22px] rounded-md bg-muted animate-pulse" />
                <div className="w-5 h-2 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" ref={ref}>
      <div className="mx-2 mb-1.5 rounded-2xl bg-card/80 backdrop-blur-2xl border border-border/15 shadow-[0_-2px_16px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center py-1 px-0.5">
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
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.1 }}
                className={cn(
                  "relative flex flex-col items-center justify-center py-1.5",
                  "flex-1 min-h-[48px]",
                  "touch-manipulation rounded-xl select-none"
                )}
              >
                <div className="relative z-10 flex flex-col items-center gap-0.5">
                  <div className="relative">
                    {isActive && !isAI && (
                      <motion.div layoutId="navPill"
                        className="absolute -inset-x-3 -inset-y-1 rounded-xl bg-primary/10"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                    )}
                    {isAI && (
                      <motion.div
                        className={cn("absolute -inset-x-3.5 -inset-y-1.5 rounded-xl",
                          isActive ? "bg-gradient-to-br from-primary/18 to-primary/6" : "bg-primary/5"
                        )}
                        layoutId={isActive ? "navPill" : undefined}
                        transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                    )}
                    <div className="relative">
                      <Icon className={cn("transition-colors duration-150",
                        isAI ? "w-[24px] h-[24px]" : "w-[22px] h-[22px]",
                        isActive ? "text-primary" : isAI ? "text-primary/60" : "text-muted-foreground/50"
                      )} strokeWidth={isActive ? 2.25 : 1.75}
                        {...(isActive ? { fill: "currentColor", fillOpacity: 0.15 } : {})} />
                      {item.badge === 'live' && (
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-destructive rounded-full animate-pulse ring-2 ring-card/80" />
                      )}
                      {item.badge === 'premium' && isAI && (
                        <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-primary/50 rounded-full ring-2 ring-card/80" />
                      )}
                      {item.badge === 'premium' && !isAI && (
                        <span className="absolute -top-1.5 -right-3 bg-destructive text-destructive-foreground text-[8px] font-bold px-1 py-px rounded-full leading-none ring-2 ring-card/80">
                          NEW
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={cn("text-[10px] leading-none whitespace-nowrap transition-colors duration-150",
                    isActive ? "text-primary font-semibold" : isAI ? "text-primary/60 font-medium" : "text-muted-foreground/50 font-medium"
                  )}>{item.label}</span>
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
