import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Smartphone, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import logoImg from '@/assets/logo.png';

const NATIVE_SCHEME = 'golmetrik://';

type CallbackState = 'loading' | 'verified' | 'error';

const AuthCallback = () => {
  const [state, setState] = useState<CallbackState>('loading');
  const [tokens, setTokens] = useState<{ access_token?: string; refresh_token?: string }>({});

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const searchParams = new URLSearchParams(window.location.search);

    const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
    const hasType =
      hashParams.get('type') === 'signup' ||
      searchParams.get('type') === 'signup' ||
      hashParams.get('type') === 'email' ||
      searchParams.get('type') === 'email';

    if (accessToken || hasType) {
      setState('verified');
      if (accessToken) {
        setTokens({ access_token: accessToken, refresh_token: refreshToken || undefined });
      }
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } else {
      setState('error');
    }
  }, []);

  const handleOpenApp = () => {
    if (tokens.access_token && tokens.refresh_token) {
      window.location.href = `${NATIVE_SCHEME}callback#access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`;
    } else {
      window.location.href = `${NATIVE_SCHEME}callback`;
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center space-y-6"
        >
          <img src={logoImg} alt="GolMetrik" className="w-14 h-14 mx-auto rounded-2xl" />
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-foreground">Geçersiz Bağlantı</h1>
            <p className="text-sm text-muted-foreground">
              Bu doğrulama bağlantısı geçersiz veya süresi dolmuş. Lütfen tekrar kayıt olun.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Verified state
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex flex-col items-center justify-center px-7">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-sm text-center space-y-8"
      >
        <img
          src={logoImg}
          alt="GolMetrik AI"
          className="w-16 h-16 mx-auto rounded-2xl shadow-[0_0_30px_hsl(var(--primary)/0.15)]"
        />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 15 }}
          className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">E-postanız Doğrulandı!</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Hesabınız başarıyla doğrulandı. Mobil uygulamadan giriş yaparak devam edebilirsiniz.
          </p>
        </div>

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
};

export default AuthCallback;
