import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
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

/**
 * Bottom Navigation Bar (6 items)
 * 
 * Navigation Order: Ana Sayfa | Canlı | AI Asistan | Sıralama | Premium | Profil
 * 
 * Badge Logic:
 * - Admin: Hiç badge gösterme
 * - Premium: Premium sekmesinde 'active' badge, AI Asistan badge yok
 * - Free: AI Asistan'da premium badge, Premium sekmesinde premium badge
 * - Live: Her zaman live badge göster
 * - Sıralama: Badge yok
 */
const BottomNav = React.forwardRef<HTMLElement, { onSearchClick?: () => void }>(({ onSearchClick }, ref) => {
  const location = useLocation();
  const { isAdmin, isPremium } = useAccessLevel();

  // Dynamic nav items with badges based on user role
  const navItems = useMemo((): NavItem[] => {
    const items: NavItem[] = [
      { icon: Home, label: 'Ana Sayfa', path: '/' },
      { icon: Zap, label: 'Canlı', path: '/live', badge: 'live' as const },
      { icon: Bot, label: 'AI Asistan', path: '/chat' },
      { icon: Trophy, label: 'Sıralama', path: '/standings' },
      { icon: Crown, label: 'Premium', path: '/premium' },
      { icon: User, label: 'Profil', path: '/profile' },
    ];

    return items.map(item => {
      // Live badge - her zaman göster
      if (item.path === '/live') {
        return item;
      }
      
      // AI Asistan badge logic
      if (item.path === '/chat') {
        // Admin: badge yok
        if (isAdmin) return item;
        // Premium: badge yok (zaten erişimi var)
        if (isPremium) return item;
        // Free: premium badge göster
        return { ...item, badge: 'premium' as const };
      }

      // Premium tab badge logic
      if (item.path === '/premium') {
        // Admin: badge yok
        if (isAdmin) return item;
        // Premium: active badge göster
        if (isPremium) return { ...item, badge: 'active' as const };
        // Free: premium badge göster (satış odaklı)
        return { ...item, badge: 'premium' as const };
      }
      
      return item;
    });
  }, [isAdmin, isPremium]);

  const handleClick = (item: NavItem, e: React.MouseEvent) => {
    if (item.isAction && onSearchClick) {
      e.preventDefault();
      onSearchClick();
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" ref={ref}>
      {/* Gradient fade effect */}
      <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      
      {/* Navigation bar */}
      <div className="bg-card/98 backdrop-blur-xl border-t border-border/60 shadow-lg shadow-black/10">
        <div 
          className="flex items-center justify-evenly py-2"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.isAction ? '#' : item.path}
                onClick={(e) => handleClick(item, e)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-2",
                  "min-w-[56px] min-h-[48px]", // WCAG touch target for 6 items
                  "touch-manipulation rounded-lg transition-all duration-200",
                  isActive && "scale-105"
                )}
              >
                {/* Active background */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/12 rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                
                <div className="relative z-10">
                  <Icon 
                    className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} 
                  />
                  {item.badge === 'live' && (
                    <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
                  )}
                  {item.badge === 'premium' && (
                    <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-[7px] text-white font-bold">★</span>
                    </span>
                  )}
                  {item.badge === 'active' && (
                    <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-colors relative z-10",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
