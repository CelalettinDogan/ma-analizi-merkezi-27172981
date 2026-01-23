import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Zap, Bot, BarChart3, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  isAction?: boolean;
  badge?: 'premium' | 'live';
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Ana Sayfa', path: '/' },
  { icon: Zap, label: 'Canlı', path: '/live', badge: 'live' },
  { icon: Bot, label: 'AI Chat', path: '/chat', badge: 'premium' },
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
  { icon: User, label: 'Profil', path: '/profile' },
];

interface BottomNavProps {
  onSearchClick?: () => void;
}

const BottomNav = React.forwardRef<HTMLElement, BottomNavProps>(({ onSearchClick }, ref) => {
  const location = useLocation();

  const handleClick = (item: NavItem, e: React.MouseEvent) => {
    if (item.isAction && onSearchClick) {
      e.preventDefault();
      onSearchClick();
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Gradient fade effect */}
      <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      
      {/* Navigation bar */}
      <div className="bg-card/98 backdrop-blur-xl border-t border-border/60 shadow-lg shadow-black/10">
        <div 
          className="flex items-center justify-evenly py-1.5"
          style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
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
                className="relative flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px] min-h-[48px] touch-manipulation rounded-xl transition-colors"
              >
                {/* Active background */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/15 rounded-xl"
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
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
                  )}
                  {item.badge === 'premium' && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-[6px] text-white font-bold">★</span>
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[11px] font-medium transition-colors relative z-10",
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
