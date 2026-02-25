import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

import UserMenu from '@/components/UserMenu';
import { cn } from '@/lib/utils';
import logoImage from '@/assets/logo.png';

interface AppHeaderProps {
  showSearch?: boolean;
  onSearchClick?: () => void;
  rightContent?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  showSearch = false, 
  onSearchClick,
  rightContent 
}) => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Anasayfa' },
    { path: '/live', label: 'Canlı', icon: <Zap className="w-4 h-4 text-amber-500" /> },
    { path: '/standings', label: 'Sıralama', icon: <Trophy className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/40 pt-safe">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo - compact native style */}
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white shadow-sm overflow-hidden flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
            <img 
              src={logoImage} 
              alt="GolMetrik AI" 
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-display font-bold text-base sm:text-lg tracking-tight text-foreground">
            GolMetrik AI
          </span>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-0.5 bg-muted/50 rounded-xl p-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                isActive(item.path)
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Side - tighter spacing */}
        <div className="flex items-center gap-1">
          {rightContent}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
