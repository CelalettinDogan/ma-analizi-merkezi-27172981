import React from 'react';
import { Globe, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/i18n/languages';
import { changeLanguage } from '@/i18n/config';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface LanguageSwitcherProps {
  variant?: 'icon' | 'menu-item';
  align?: 'start' | 'center' | 'end';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'icon',
  align = 'end',
}) => {
  const { i18n, t } = useTranslation('common');
  const currentLang = i18n.language as LanguageCode;

  const handleSelect = async (code: LanguageCode) => {
    try { Haptics.impact({ style: ImpactStyle.Light }); } catch {}
    await changeLanguage(code);
  };

  const trigger =
    variant === 'icon' ? (
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('language.select')}
        className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
      >
        <Globe className="h-[18px] w-[18px]" />
      </Button>
    ) : (
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
        aria-label={t('language.select')}
      >
        <Globe className="h-4 w-4" />
        <span>{t('language.label')}</span>
      </button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t('language.select')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isActive = currentLang === lang.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="flex items-center justify-between gap-3 cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <span className="text-base leading-none" aria-hidden>
                  {lang.flag}
                </span>
                <span className={isActive ? 'font-semibold' : ''}>
                  {lang.nativeName}
                </span>
              </span>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
