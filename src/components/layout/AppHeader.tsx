import React from 'react';
import { Link } from 'react-router-dom';

import UserMenu from '@/components/UserMenu';
import logoImage from '@/assets/logo.png';

interface AppHeaderProps {
  showSearch?: boolean;
  onSearchClick?: () => void;
  rightContent?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  rightContent
}) => {

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/40 pt-safe">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo - compact native style */}
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="relative">
            <img
              src={logoImage}
              alt="GolMetrik AI"
              className="w-10 h-10 sm:w-11 sm:h-11 aspect-square object-contain rounded-xl shadow-sm transition-transform duration-200 group-hover:scale-105" />
            <div className="absolute -inset-1 rounded-xl bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
          </div>
          <span className="font-display font-bold text-base tracking-tight text-foreground">
            GolMetrik AI
          </span>
        </Link>

        {/* Right Side - tighter spacing */}
        <div className="flex items-center gap-1">
          {rightContent}
          <UserMenu />
        </div>
      </div>
    </header>);

};

export default AppHeader;