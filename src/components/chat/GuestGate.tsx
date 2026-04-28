import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LogIn, UserPlus, ArrowLeft } from 'lucide-react';
import varioAvatar from '@/assets/vario-avatar.png';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface GuestGateProps {
  onClose?: () => void;
}

const GuestGate: React.FC<GuestGateProps> = ({ onClose }) => {
  const { t } = useTranslation('chat');
  const navigate = useNavigate();

  const handleLogin = () => navigate('/auth', { state: { from: '/chat', mode: 'login' } });
  const handleSignup = () => navigate('/auth', { state: { from: '/chat', mode: 'signup' } });

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50 pt-safe">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose || (() => navigate(-1))} className="rounded-full min-w-[44px] min-h-[44px] w-auto h-auto">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold">{t('header.fullTitle')}</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-8">
          <div className="text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5">
              <img src={varioAvatar} alt="VARio" className="w-full h-full rounded-3xl object-cover" />
            </motion.div>
          </div>

          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold">{t('guestGate.title')}</h2>
            <p className="text-muted-foreground">{t('guestGate.description')}</p>
          </div>

          <Card className="p-4 space-y-3 bg-muted/30">
            <p className="text-sm font-medium text-center text-muted-foreground">{t('guestGate.featuresTitle')}</p>
            <ul className="space-y-2 text-sm">
              {[1, 2, 3, 4].map((n) => (
                <li key={n} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {t(`guestGate.feature${n}`)}
                </li>
              ))}
            </ul>
          </Card>

          <div className="space-y-3">
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button onClick={handleLogin} className="w-full h-14 text-lg rounded-2xl" size="lg">
                <LogIn className="w-5 h-5 mr-2" />
                {t('guestGate.login')}
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button variant="outline" onClick={handleSignup} className="w-full h-12 rounded-2xl" size="lg">
                <UserPlus className="w-5 h-5 mr-2" />
                {t('guestGate.signup')}
              </Button>
            </motion.div>
          </div>

          <p className="text-center text-xs text-muted-foreground whitespace-pre-line">{t('guestGate.footer')}</p>
        </motion.div>
      </div>
    </div>
  );
};

export default GuestGate;
