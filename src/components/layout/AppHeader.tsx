import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

import UserMenu from '@/components/UserMenu';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import logoImage from '@/assets/logo.png';

interface AppHeaderProps {
  showSearch?: boolean;
  onSearchClick?: () => void;
  rightContent?: React.ReactNode;
  showBack?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  rightContent,
  showBack = false,
}) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/40 pt-safe">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 group flex-shrink-0 -ml-1"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            aria-label={t('back', 'Back')}
          >
            <div className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center transition-colors active:bg-muted/50">
              <ArrowLeft className="w-[18px] h-[18px] text-foreground/80" />
            </div>
            <span className="font-display font-bold text-base tracking-tight text-foreground">
              GolMetrik AI
            </span>
          </button>
        ) : (
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0" aria-label={t('footer.homePage')}>
            <div className="relative">
              <img
                src={logoImage}
                alt="GolMetrik AI"
                className="w-10 h-10 sm:w-11 sm:h-11 aspect-square object-contain rounded-xl shadow-sm"
              />
            </div>
            <span className="font-display font-bold text-base tracking-tight text-foreground">
              GolMetrik AI
            </span>
          </Link>
        )}

        <div className="flex items-center gap-1">
          {rightContent}
          <LanguageSwitcher />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
