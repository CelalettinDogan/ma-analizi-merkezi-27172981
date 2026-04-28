import React from 'react';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logoImage from '@/assets/logo.png';

const AppFooter: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <footer className="hidden md:block py-12 border-t border-border/50 bg-gradient-to-t from-background to-transparent">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img
                src={logoImage}
                alt="GolMetrik AI"
                className="w-10 h-10 rounded-xl object-contain shadow-lg shadow-primary/20"
              />
              <span className="font-display font-bold text-xl text-foreground">GolMetrik AI</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-3">
              <a
                href="mailto:info@golmetrik.com"
                className="w-9 h-9 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 flex items-center justify-center transition-colors"
                aria-label="Email"
              >
                <Mail className="w-4 h-4 text-muted-foreground" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.homePage')}</Link></li>
              <li><Link to="/live" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.liveMatches')}</Link></li>
              <li><Link to="/standings" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.leagueStandings')}</Link></li>
              <li><Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.profile')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.privacyPolicy')}</Link></li>
              <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.termsOfUse')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border/30 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('footer.disclaimer')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
