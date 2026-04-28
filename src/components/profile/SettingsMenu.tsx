import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, LogOut, ChevronRight, 
  Brain, Calendar, TrendingUp, Heart, Sparkles,
  Palette, HelpCircle, Trash2, AlertTriangle, Shield, FileText, Globe, Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/i18n/languages';
import { changeLanguage } from '@/i18n/config';

interface SettingsMenuProps {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  signOut: () => Promise<void>;
  userId: string;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ theme, setTheme, signOut, userId }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('profile');
  const [showThemeSheet, setShowThemeSheet] = useState(false);
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const [showAIInfoSheet, setShowAIInfoSheet] = useState(false);
  const [showDeleteAccountSheet, setShowDeleteAccountSheet] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const currentLang = i18n.language as LanguageCode;
  const currentLangMeta = SUPPORTED_LANGUAGES.find(l => l.code === currentLang) ?? SUPPORTED_LANGUAGES[0];
  const confirmKeyword = t('deleteAccount.confirmKeyword');

  const themeLabel = theme === 'dark'
    ? t('settings.themeDark')
    : theme === 'light'
      ? t('settings.themeLight')
      : t('settings.themeSystem');

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const handleLanguageSelect = async (code: LanguageCode) => {
    await changeLanguage(code);
    setShowLanguageSheet(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== confirmKeyword) return;
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('deleteAccount.failed'));
      toast.success(t('deleteAccount.success'));
      await signOut();
      navigate('/');
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast.error(error.message || t('deleteAccount.failed'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="glass-card">
        <CardContent className="p-4 space-y-1">
          <h2 className="text-sm font-semibold font-display flex items-center gap-2 mb-2">
            <Settings className="h-4 w-4 text-primary" />
            {t('settings.title')}
          </h2>

          <Button variant="ghost" className="w-full justify-between h-11 text-sm rounded-xl active:scale-[0.98] transition-transform" onClick={() => setShowLanguageSheet(true)}>
            <span className="flex items-center gap-2.5"><Globe className="h-4 w-4 text-muted-foreground" />{t('settings.language')}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span aria-hidden>{currentLangMeta.flag}</span>
              {currentLangMeta.nativeName}
            </span>
          </Button>
          <Button variant="ghost" className="w-full justify-between h-11 text-sm rounded-xl active:scale-[0.98] transition-transform" onClick={() => setShowThemeSheet(true)}>
            <span className="flex items-center gap-2.5"><Palette className="h-4 w-4 text-muted-foreground" />{t('settings.theme')}</span>
            <span className="text-xs text-muted-foreground capitalize">{themeLabel}</span>
          </Button>
          <Button variant="ghost" className="w-full justify-between h-11 text-sm rounded-xl active:scale-[0.98] transition-transform" onClick={() => setShowAIInfoSheet(true)}>
            <span className="flex items-center gap-2.5"><HelpCircle className="h-4 w-4 text-muted-foreground" />{t('settings.aiHowItWorks')}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>

          <div className="border-t border-border/50 my-2" />

          <div className="text-center pb-2">
            <p className="font-semibold text-sm font-display">GolMetrik AI</p>
            <p className="text-micro text-muted-foreground">{t('settings.version', { version: '1.0.0' })}</p>
          </div>
          <Button variant="ghost" className="w-full justify-between h-11 text-sm rounded-xl active:scale-[0.98] transition-transform" onClick={() => navigate('/privacy')}>
            <span className="flex items-center gap-2.5"><Shield className="h-4 w-4 text-muted-foreground" />{t('settings.privacyPolicy')}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" className="w-full justify-between h-11 text-sm rounded-xl active:scale-[0.98] transition-transform" onClick={() => navigate('/terms')}>
            <span className="flex items-center gap-2.5"><FileText className="h-4 w-4 text-muted-foreground" />{t('settings.termsOfUse')}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>

          <div className="border-t border-border/50 my-2" />

          <Button variant="ghost" className="w-full justify-between h-11 text-sm rounded-xl text-destructive active:bg-destructive/10" onClick={() => setShowDeleteAccountSheet(true)}>
            <span className="flex items-center gap-2.5"><Trash2 className="h-4 w-4" />{t('settings.deleteAccount')}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2.5 h-11 text-sm rounded-xl text-destructive active:bg-destructive/10" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /><span>{t('settings.logout')}</span>
          </Button>
        </CardContent>
      </Card>

      {/* Language Sheet */}
      <Sheet open={showLanguageSheet} onOpenChange={setShowLanguageSheet}>
        <SheetContent side="bottom" className="h-auto max-h-[60vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2"><Globe className="w-5 h-5" />{t('settings.language')}</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 pb-6">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isActive = currentLang === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${isActive ? 'border-primary bg-primary/5' : 'border-border active:bg-muted/30'}`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl" aria-hidden>{lang.flag}</span>
                    <span className={`text-sm ${isActive ? 'font-semibold text-primary' : 'font-medium'}`}>{lang.nativeName}</span>
                  </span>
                  {isActive && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Theme Sheet */}
      <Sheet open={showThemeSheet} onOpenChange={setShowThemeSheet}>
        <SheetContent side="bottom" className="h-auto max-h-[60vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2"><Palette className="w-5 h-5" />{t('themeSheet.title')}</SheetTitle>
            <SheetDescription>{t('themeSheet.description')}</SheetDescription>
          </SheetHeader>
          <RadioGroup value={theme} onValueChange={setTheme} className="space-y-3 pb-6">
            {[
              { value: 'light', icon: '☀️', label: t('themeSheet.lightLabel'), desc: t('themeSheet.lightDesc') },
              { value: 'dark', icon: '🌙', label: t('themeSheet.darkLabel'), desc: t('themeSheet.darkDesc') },
              { value: 'system', icon: '📱', label: t('themeSheet.systemLabel'), desc: t('themeSheet.systemDesc') },
            ].map(opt => (
              <div key={opt.value} className="flex items-center space-x-3 p-3 rounded-lg border border-border active:bg-muted/30 transition-colors">
                <RadioGroupItem value={opt.value} id={opt.value} />
                <Label htmlFor={opt.value} className="flex-1">
                  <span className="font-medium text-sm">{opt.icon} {opt.label}</span>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </SheetContent>
      </Sheet>

      {/* AI Info Sheet */}
      <Sheet open={showAIInfoSheet} onOpenChange={setShowAIInfoSheet}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2"><Brain className="w-5 h-5 text-primary" />{t('aiInfo.title')}</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-full max-h-[60vh]">
            <div className="space-y-4 pb-6">
              <p className="text-sm text-muted-foreground">{t('aiInfo.intro')}</p>
              <div className="space-y-2.5">
                {[
                  { icon: TrendingUp, title: t('aiInfo.performanceTitle'), desc: t('aiInfo.performanceDesc') },
                  { icon: Heart, title: t('aiInfo.h2hTitle'), desc: t('aiInfo.h2hDesc') },
                  { icon: Calendar, title: t('aiInfo.standingsTitle'), desc: t('aiInfo.standingsDesc') },
                  { icon: Sparkles, title: t('aiInfo.formTitle'), desc: t('aiInfo.formDesc') },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30">
                    <item.icon className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{t('aiInfo.outro')}</p>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {t('aiInfo.disclaimer')}
                </p>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Delete Account Sheet */}
      <Sheet open={showDeleteAccountSheet} onOpenChange={setShowDeleteAccountSheet}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2 text-destructive"><Trash2 className="w-5 h-5" />{t('deleteAccount.title')}</SheetTitle>
            <SheetDescription>{t('deleteAccount.subtitle')}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 pb-6">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-destructive">{t('deleteAccount.warningTitle')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('deleteAccount.warningDesc')}</p>
                <ul className="text-xs text-muted-foreground mt-1.5 space-y-0.5 list-disc list-inside">
                  <li>{t('deleteAccount.item1')}</li>
                  <li>{t('deleteAccount.item2')}</li>
                  <li>{t('deleteAccount.item3')}</li>
                  <li>{t('deleteAccount.item4')}</li>
                </ul>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delete-confirm" className="text-sm">
                {t('deleteAccount.confirmLabelPrefix')} <strong className="text-destructive">{confirmKeyword}</strong> {t('deleteAccount.confirmLabelSuffix')}
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                placeholder={confirmKeyword}
                className="uppercase"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setShowDeleteAccountSheet(false); setDeleteConfirmText(''); }}>{t('deleteAccount.cancel')}</Button>
              <Button variant="destructive" className="flex-1" disabled={deleteConfirmText !== confirmKeyword || isDeleting} onClick={handleDeleteAccount}>
                {isDeleting ? t('deleteAccount.deleting') : t('deleteAccount.submit')}
              </Button>
            </div>
            <p className="text-micro text-muted-foreground text-center">{t('deleteAccount.footer')}</p>
          </div>
        </SheetContent>
      </Sheet>

    </>
  );
};

export default SettingsMenu;
