import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Zap, BarChart3, User, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  isAction?: boolean;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Ana Sayfa', path: '/' },
  { icon: Zap, label: 'Canlı', path: '/live' },
  { icon: Search, label: 'Ara', path: '/search', isAction: true },
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
  { icon: User, label: 'Profil', path: '/profile' },
];

interface BottomNavProps {
  onSearchClick?: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ onSearchClick }) => {
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
      <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      
      {/* Navigation bar */}
      <div className="bg-card/95 backdrop-blur-xl border-t border-border/50 px-2 pb-safe">
        <div className="flex items-center justify-around py-2">
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
                className="relative flex flex-col items-center gap-0.5 px-4 py-3 min-w-[64px] min-h-[44px] touch-manipulation"
              >
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -inset-2 bg-primary/20 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon 
                    className={cn(
                      "w-5 h-5 relative z-10 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} 
                  />
                  {item.path === '/live' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-colors",
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
};

export default BottomNav;
