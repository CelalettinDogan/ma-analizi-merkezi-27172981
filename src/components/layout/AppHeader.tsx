import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { cn } from '@/lib/utils';
import logoImage from '@/assets/logo.png';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', labelKey: 'nav.home' },
    { path: '/live', labelKey: 'nav.live', icon: <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> },
    { path: '/standings', labelKey: 'nav.standings', icon: <Trophy className="w-4 h-4" /> },
    { path: '/dashboard', labelKey: 'nav.dashboard', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
      <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
          <img 
            src={logoImage} 
            alt="Gol Metrik Logo" 
            className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain drop-shadow-lg transition-all duration-200 group-hover:scale-110 dark:drop-shadow-[0_0_12px_rgba(234,179,8,0.5)] dark:brightness-110"
          />
          <span className="font-display font-bold text-base xs:text-lg md:text-xl text-foreground hidden xs:block">Gol Metrik</span>
        </Link>
        
        {/* Desktop Nav - Show from lg breakpoint to avoid tablet overflow */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Button 
              key={item.path}
              variant="ghost" 
              size="sm" 
              asChild
              className={cn(
                "text-sm",
                isActive(item.path) && "bg-primary/10 text-primary"
              )}
            >
              <Link to={item.path} className="gap-1.5">
                {item.icon}
                {t(item.labelKey)}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-1 sm:gap-2">
          {rightContent}
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;