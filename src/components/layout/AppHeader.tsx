import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
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
    { path: '/live', label: 'Canlı', icon: <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> },
    { path: '/standings', label: 'Sıralama', icon: <Trophy className="w-4 h-4" /> },
    { path: '/dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img 
            src={logoImage} 
            alt="FutbolTahmin Logo" 
            className="w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 object-contain drop-shadow-lg transition-all duration-200 group-hover:scale-110 dark:drop-shadow-[0_0_12px_rgba(234,179,8,0.5)] dark:brightness-110"
          />
          <span className="font-display font-bold text-base xs:text-lg sm:text-xl text-foreground hidden xs:block">FutbolTahmin</span>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Button 
              key={item.path}
              variant="ghost" 
              size="sm" 
              asChild
              className={cn(
                isActive(item.path) && "bg-primary/10 text-primary"
              )}
            >
              <Link to={item.path} className="gap-1">
                {item.icon}
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {rightContent}
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
