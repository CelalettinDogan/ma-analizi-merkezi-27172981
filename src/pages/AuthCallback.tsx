import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Loader2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import logoImg from '@/assets/logo.png';

const NATIVE_SCHEME = 'golmetrik://';

const isMobileUserAgent = () =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

type CallbackState = 'loading' | 'verified-mobile' | 'error';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>('loading');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);

        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        const type = hashParams.get('type') || searchParams.get('type');

        const state = hashParams.get('state') || searchParams.get('state') || '';
        const platformParam = searchParams.get('platform');
        const isNativePlatform = state.startsWith('native:') || platformParam === 'native';
        const isEmailVerification = type === 'signup' || type === 'magiclink' || type === 'email';
        const isMobile = isMobileUserAgent();

        if (accessToken && refreshToken) {
          // Always set the session so the email gets verified
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Session error:', error);
            navigate('/auth', { replace: true });
            return;
          }

          // Mobile email verification → show success page
          if ((isNativePlatform || (isEmailVerification && isMobile))) {
            setState('verified-mobile');
            return;
          }

          // Web: go to home
          navigate('/', { replace: true });
          return;
        }

        navigate('/auth', { replace: true });
      } catch (error) {
        console.error('Callback error:', error);
        setState('error');
      }
    };

    handleCallback();
  }, [navigate]);

  const handleOpenApp = () => {
    window.location.href = `${NATIVE_SCHEME}callback`;
  };

  // Mobile verification success page
  if (state === 'verified-mobile') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex flex-col items-center justify-center px-7">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-sm text-center space-y-8"
        >
          {/* Logo */}
          <img
            src={logoImg}
            alt="GolMetrik AI"
            className="w-16 h-16 mx-auto rounded-2xl shadow-[0_0_30px_hsl(var(--primary)/0.15)]"
          />

          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center"
          >
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </motion.div>

          {/* Text */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              E-postanız Doğrulandı!
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Hesabınız başarıyla oluşturuldu. Mobil uygulamadan giriş yaparak devam edebilirsiniz.
            </p>
          </div>

          {/* Open App Button */}
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handleOpenApp}
              className="w-full h-[52px] rounded-2xl text-[15px] font-semibold shadow-[0_4px_16px_hsl(var(--primary)/0.3)] gap-2"
            >
              <Smartphone className="h-4 w-4" />
              Uygulamayı Aç
            </Button>
          </motion.div>

          <p className="text-xs text-muted-foreground/60">
            Uygulama açılmazsa, GolMetrik uygulamasını açıp giriş yapabilirsiniz.
          </p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-7">
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">Bir hata oluştu. Lütfen tekrar deneyin.</p>
          <Button variant="outline" onClick={() => navigate('/auth', { replace: true })}>
            Giriş Sayfasına Dön
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Giriş yapılıyor...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
