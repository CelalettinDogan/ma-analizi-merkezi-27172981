import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const NATIVE_SCHEME = 'golmetrik://';

const isMobileUserAgent = () =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    document.title = 'Şifre Sıfırla | GolMetrik AI';

    const checkSession = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      
      // If recovery tokens present and on mobile browser → redirect to native app
      if (type === 'recovery' && accessToken && refreshToken && isMobileUserAgent()) {
        const nativeUrl = `${NATIVE_SCHEME}reset-password?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}&type=recovery`;
        window.location.href = nativeUrl;
        return;
      }

      if (type === 'recovery' && accessToken) {
        setIsValidSession(true);
        setIsCheckingSession(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
        setIsCheckingSession(false);
        return;
      }

      setIsCheckingSession(false);
      setIsValidSession(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
        setIsCheckingSession(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getPasswordStrength = (pass: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/\d/.test(pass)) strength++;
    if (/[^a-zA-Z0-9]/.test(pass)) strength++;

    const labels = ['Çok Zayıf', 'Zayıf', 'Orta', 'Güçlü', 'Çok Güçlü'];
    const colors = ['bg-destructive', 'bg-orange-500', 'bg-yellow-500', 'bg-primary', 'bg-green-500'];

    return {
      strength,
      label: labels[strength] || labels[0],
      color: colors[strength] || colors[0],
    };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: 'Hata', description: 'Şifre en az 6 karakter olmalıdır.', variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: 'Hata', description: 'Şifreler eşleşmiyor.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setIsSuccess(true);
      toast({ title: 'Başarılı', description: 'Şifreniz başarıyla güncellendi.' });
      setTimeout(() => navigate('/'), 2000);
    } catch (error: any) {
      toast({ title: 'Hata', description: error.message || 'Şifre güncellenirken bir hata oluştu.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-safe">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 pt-safe">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center"
          >
            <KeyRound className="h-7 w-7 text-destructive" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-lg font-bold">Geçersiz veya Süresi Dolmuş Link</h1>
            <p className="text-sm text-muted-foreground">
              Bu şifre sıfırlama linki geçersiz veya süresi dolmuş. Lütfen yeni bir şifre sıfırlama isteği gönderin.
            </p>
          </div>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button onClick={() => navigate('/auth')} className="w-full h-12 rounded-2xl text-sm font-semibold">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Giriş Sayfasına Dön
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 pt-safe">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm text-center space-y-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
          >
            <CheckCircle className="h-7 w-7 text-primary" />
          </motion.div>
          <h1 className="text-lg font-bold">Şifreniz Güncellendi!</h1>
          <p className="text-sm text-muted-foreground">
            Yeni şifrenizle giriş yapabilirsiniz. Anasayfaya yönlendiriliyorsunuz...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 pt-safe">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Yeni Şifre Belirle</h1>
            <p className="text-sm text-muted-foreground mt-1">Hesabınız için yeni bir şifre belirleyin.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">Yeni Şifre</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex w-full rounded-2xl border border-border/50 bg-muted/20 px-4 pr-12 h-[52px] text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground active:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < passwordStrength.strength ? passwordStrength.color : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Şifre gücü: {passwordStrength.label}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="confirmPassword">Şifre Tekrar</label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="flex w-full rounded-2xl border border-border/50 bg-muted/20 px-4 h-[52px] text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all"
              required
              minLength={6}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-destructive">Şifreler eşleşmiyor</p>
            )}
          </div>

          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              type="submit"
              className="w-full h-12 rounded-2xl text-sm font-semibold"
              disabled={isLoading || password !== confirmPassword}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Güncelleniyor...
                </>
              ) : (
                'Şifreyi Güncelle'
              )}
            </Button>
          </motion.div>
        </form>

        <div className="text-center">
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-muted-foreground active:text-foreground h-11 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anasayfaya Dön
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
