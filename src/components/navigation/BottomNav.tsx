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
}

const BottomNav = React.forwardRef<HTMLElement, { onSearchClick?: () => void }>(({ onSearchClick }, ref) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isPremium, isResolved } = useCachedAccessLevel();

  const computedItems = useMemo((): NavItem[] => {
    const items: NavItem[] = [
      { icon: Home, label: 'Ana', path: '/' },
      { icon: Radio, label: 'Canlı', path: '/live', badge: 'live' as const },
      { icon: Sparkles, label: 'AI', path: '/chat' },
      { icon: BarChart3, label: 'Lig', path: '/standings' },
      { icon: User, label: 'Profil', path: '/profile' },
    ];

    // Explicit positive check: only show Pro tab when role is explicitly free
    const showProTab = !isPremium && !isAdmin;
    if (showProTab) {
      items.splice(4, 0, { icon: Crown, label: 'Pro', path: '/premium', badge: 'premium' as const });
    }

    // AI chat badge: only mark as premium when role is explicitly free
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

  // Skeleton nav while role is unresolved — prevents flicker
  if (!isResolved) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" ref={ref}>
        <div className="bg-card/95 backdrop-blur-2xl border-t border-border/30">
          <div 
            className="flex items-center py-1.5"
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
          >
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-[48px] gap-1">
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
      <div className="bg-card/95 backdrop-blur-2xl border-t border-border/30">
        <div 
          className="flex items-center py-1.5"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          {computedItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
                <button
                key={item.path}
                onClick={(e) => handleClick(item, e)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center py-2 px-1",
                  "flex-1 min-h-[48px]",
                  "touch-manipulation rounded-lg"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/8 rounded-2xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                
                <motion.div
                  className="relative z-10 flex flex-col items-center gap-1"
                  animate={{ scale: isActive ? 1.05 : 1 }}
                  transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="relative">
                    <Icon 
                      className={cn(
                        "w-[22px] h-[22px] transition-colors duration-150",
                        isActive ? "text-primary" : "text-muted-foreground/70"
                      )}
                      strokeWidth={1.75}
                      {...(isActive ? { fill: "currentColor", fillOpacity: 0.15 } : {})}
                    />
                    {item.badge === 'live' && (
                      <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-destructive rounded-full animate-pulse" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium leading-none whitespace-nowrap transition-colors duration-150",
                    isActive ? "text-primary" : "text-muted-foreground/70"
                  )}>
                    {item.label}
                  </span>
                </motion.div>
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
