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
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/20 pt-safe">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo - compact native style */}
         <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0 active:scale-95 transition-transform">
          <img
            alt="GolMetrik AI"
            className="w-10 h-10 sm:w-11 sm:h-11 aspect-square object-cover rounded-xl shadow-subtle bg-white"
            src="/lovable-uploads/d341d88c-e544-4d38-81ab-b4d5ad1f21e9.png"
          />
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