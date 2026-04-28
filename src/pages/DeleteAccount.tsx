import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const DeleteAccount: React.FC = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmKeyword = t('deleteAccount.confirmKeyword');

  React.useEffect(() => {
    if (!user) {
      navigate('/auth', { state: { returnTo: '/delete-account' } });
    }
  }, [user, navigate]);

  const handleDelete = async () => {
    if (confirmText !== confirmKeyword) {
      toast({
        title: t('deleteAccount.toastNeedConfirmTitle'),
        description: t('deleteAccount.toastNeedConfirmDescription', { keyword: confirmKeyword }),
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session not found');

      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await signOut();
      toast({ title: t('deleteAccount.toastDoneTitle'), description: t('deleteAccount.toastDoneDescription') });
      navigate('/');
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast({ title: t('deleteAccount.toastErrorTitle'), description: error.message || t('deleteAccount.toastErrorDescription'), variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pt-safe">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="min-w-[44px] min-h-[44px]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">{t('deleteAccount.title')}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm text-destructive">{t('deleteAccount.warningTitle')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('deleteAccount.warningDescription')}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-semibold">{t('deleteAccount.dataHeading')}</h2>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
            <li>{t('deleteAccount.dataItems.profile')}</li>
            <li>{t('deleteAccount.dataItems.analyses')}</li>
            <li>{t('deleteAccount.dataItems.chat')}</li>
            <li>{t('deleteAccount.dataItems.favorites')}</li>
            <li>{t('deleteAccount.dataItems.premium')}</li>
            <li>{t('deleteAccount.dataItems.usage')}</li>
          </ul>
          <p className="text-sm text-amber-500 font-medium mt-4">
            ⚠️ {t('deleteAccount.premiumNotice')}
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-semibold">{t('deleteAccount.confirmHeading')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('deleteAccount.confirmInstructionPrefix')}
            <span className="font-bold text-foreground">{confirmKeyword}</span>
            {t('deleteAccount.confirmInstructionSuffix')}
          </p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            placeholder={t('deleteAccount.confirmPlaceholder')}
            className="flex w-full rounded-2xl border border-border/50 bg-muted/20 px-4 h-[52px] text-sm text-center font-bold ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all"
            disabled={isDeleting}
          />
          <div className="flex flex-col gap-3 pt-2">
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={confirmText !== confirmKeyword || isDeleting}
                className="w-full h-12 rounded-2xl text-sm font-semibold"
              >
                {isDeleting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('deleteAccount.deleting')}</>
                ) : (
                  <><Trash2 className="h-4 w-4 mr-2" />{t('deleteAccount.deleteButton')}</>
                )}
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isDeleting}
                className="w-full h-12 rounded-2xl"
              >
                {t('deleteAccount.cancel')}
              </Button>
            </motion.div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          {t('deleteAccount.contactPrefix')}
          <span className="text-primary">info@golmetrik.com</span>
        </p>
      </div>
    </div>
  );
};

export default DeleteAccount;
