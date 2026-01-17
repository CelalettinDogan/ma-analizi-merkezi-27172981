import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, BarChart3, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import { cn } from '@/lib/utils';

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
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-primary-foreground font-bold text-sm">FT</span>
          </div>
          <span className="font-display font-bold text-lg text-foreground hidden sm:block">FutbolTahmin</span>
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
