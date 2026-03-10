import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import logoImg from '@/assets/logo.png';

type AuthTab = 'login' | 'register';

const Auth: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const { user, signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Focus tracking for icon color
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const from = (location.state as { from?: string })?.from || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location.state]);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPrivacySheet, setShowPrivacySheet] = useState(false);
  const [showTermsSheet, setShowTermsSheet] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    if (error) {
      let msg = error.message === 'Invalid login credentials'
        ? 'E-posta veya şifre hatalı'
        : error.message;
      if (error.message.toLowerCase().includes('rate limit') || error.message.includes('429')) {
        msg = 'Çok fazla giriş denemesi. Lütfen birkaç dakika bekleyin.';
      }
      toast({ title: 'Giriş Hatası', description: msg, variant: 'destructive' });
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast({ title: 'Onay Gerekli', description: 'Gizlilik Politikası ve Kullanım Şartları\'nı kabul etmelisiniz.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    if (registerPassword.length < 6) {
      toast({ title: 'Şifre Hatası', description: 'Şifre en az 6 karakter olmalıdır.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    const { error, data } = await signUp(registerEmail, registerPassword, registerName);
    if (error) {
      let msg = error.message;
      if (error.message.toLowerCase().includes('rate limit') || error.message.includes('429')) {
        msg = 'Çok fazla deneme yaptınız. Lütfen birkaç dakika bekleyin.';
      }
      toast({ title: 'Kayıt Hatası', description: msg, variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    if (data?.user?.identities?.length === 0) {
      toast({ title: 'Bu e-posta zaten kayıtlı', description: 'Giriş Yap sekmesinden giriş yapın.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    toast({ title: 'Doğrulama Linki Gönderildi', description: `${registerEmail} adresine doğrulama linki gönderildi. Lütfen e-postanızı kontrol edin.` });
    setIsLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return;
    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: otpCode,
        type: 'signup',
      });
      if (error) {
        toast({ title: 'Doğrulama Hatası', description: 'Kod hatalı veya süresi dolmuş. Tekrar deneyin.', variant: 'destructive' });
      } else {
        toast({ title: 'Hesap Doğrulandı', description: 'Hesabınız başarıyla oluşturuldu!' });
        setShowOtpScreen(false);
        setOtpCode('');
        setPendingEmail('');
      }
    } catch {
      toast({ title: 'Hata', description: 'Bir sorun oluştu. Tekrar deneyin.', variant: 'destructive' });
    }
    setIsVerifying(false);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
      });
      if (error) {
        toast({ title: 'Hata', description: error.message, variant: 'destructive' });
      } else {
        setResendCooldown(60);
        toast({ title: 'Kod Gönderildi', description: 'Yeni doğrulama kodu e-posta adresinize gönderildi.' });
      }
    } catch {
      toast({ title: 'Hata', description: 'Kod gönderilemedi.', variant: 'destructive' });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);
    const { error } = await resetPassword(resetEmail);
    if (error) {
      toast({ title: 'Hata', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'E-posta Gönderildi', description: 'Şifre sıfırlama bağlantısı gönderildi.' });
      setShowResetDialog(false);
      setResetEmail('');
    }
    setIsResetting(false);
  };

  const inputClassName = "pl-11 h-[52px] rounded-2xl bg-muted/20 border-0 text-[15px] transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:bg-muted/30";

  // OTP Verification Screen
  if (showOtpScreen) {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-b from-background via-background to-muted/30 flex flex-col pt-safe">
        <div className="flex-shrink-0 px-7 pt-4">
          <button
            onClick={() => {
              setShowOtpScreen(false);
              setOtpCode('');
            }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground active:text-foreground touch-manipulation"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-7 -mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm text-center space-y-6"
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-7 w-7 text-primary" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground">E-posta Doğrulama</h2>
              <p className="text-sm text-muted-foreground mt-2">
                <span className="font-medium text-foreground">{pendingEmail}</span> adresine gönderilen 6 haneli kodu girin.
              </p>
            </div>

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
                onComplete={handleVerifyOtp}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="h-12 w-12 rounded-xl border-border/50 text-lg" />
                  <InputOTPSlot index={1} className="h-12 w-12 rounded-xl border-border/50 text-lg" />
                  <InputOTPSlot index={2} className="h-12 w-12 rounded-xl border-border/50 text-lg" />
                  <InputOTPSlot index={3} className="h-12 w-12 rounded-xl border-border/50 text-lg" />
                  <InputOTPSlot index={4} className="h-12 w-12 rounded-xl border-border/50 text-lg" />
                  <InputOTPSlot index={5} className="h-12 w-12 rounded-xl border-border/50 text-lg" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                onClick={handleVerifyOtp}
                className="w-full h-[52px] rounded-2xl text-[15px] font-semibold shadow-[0_4px_16px_hsl(var(--primary)/0.3)]"
                disabled={isVerifying || otpCode.length !== 6}
              >
                {isVerifying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Doğrulanıyor...</> : 'Doğrula'}
              </Button>
            </motion.div>

            <button
              onClick={handleResendOtp}
              disabled={resendCooldown > 0}
              className="text-sm text-muted-foreground active:text-primary disabled:opacity-50 touch-manipulation"
            >
              {resendCooldown > 0 ? `Tekrar gönder (${resendCooldown}s)` : 'Kodu tekrar gönder'}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-background via-background to-muted/30 flex flex-col pt-safe">
      {/* Brand */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center py-4 sm:py-8 px-7">
        <img
          src={logoImg}
          alt="GolMetrik AI"
          className="w-16 h-16 sm:w-20 sm:h-20 aspect-square object-contain rounded-2xl shadow-[0_0_30px_hsl(var(--primary)/0.15)]"
        />
        <h1 className="font-display font-bold text-[28px] sm:text-3xl text-foreground tracking-tight mt-3">
          GolMetrik AI
        </h1>
        <p className="text-[13px] text-muted-foreground/70 tracking-widest uppercase mt-0.5">
          Akıllı Futbol Analizi
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden px-7 pb-2 max-w-md mx-auto w-full">
        {/* Segmented Control */}
        <div className="bg-muted/20 rounded-2xl p-1 flex relative mb-5">
          {(['login', 'register'] as AuthTab[]).map((tab) => (
            <motion.button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              whileTap={{ scale: 0.97 }}
              className="relative flex-1 py-2.5 text-sm font-medium z-10 rounded-xl transition-colors duration-200"
              style={{ color: activeTab === tab ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
            >
              {tab === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              {activeTab === tab && (
                <motion.div
                  layoutId="authSegment"
                  className="absolute inset-0 bg-card rounded-xl shadow-sm -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Forms */}
        <AnimatePresence mode="wait">
          {activeTab === 'login' ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="login-email" className={`text-sm transition-colors duration-200 ${focusedField === 'login-email' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  E-posta
                </Label>
                <div className="relative">
                  <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${focusedField === 'login-email' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    onFocus={() => setFocusedField('login-email')}
                    onBlur={() => setFocusedField(null)}
                    className={inputClassName}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className={`text-sm transition-colors duration-200 ${focusedField === 'login-password' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Şifre
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowResetDialog(true)}
                    className="text-[11px] text-muted-foreground/60 active:text-primary touch-manipulation transition-colors"
                  >
                    Şifremi Unuttum
                  </button>
                </div>
                <div className="relative">
                  <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${focusedField === 'login-password' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onFocus={() => setFocusedField('login-password')}
                    onBlur={() => setFocusedField(null)}
                    className={`${inputClassName} pr-11`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground active:text-foreground p-1 touch-manipulation"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  type="submit"
                  className="w-full h-[52px] rounded-2xl text-[15px] font-semibold shadow-[0_4px_16px_hsl(var(--primary)/0.3)]"
                  disabled={isLoading}
                >
                  {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Giriş yapılıyor...</> : 'Giriş Yap'}
                </Button>
              </motion.div>
            </motion.form>
          ) : (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleRegister}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <Label htmlFor="register-name" className={`text-sm transition-colors duration-200 ${focusedField === 'register-name' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  İsim
                </Label>
                <div className="relative">
                  <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${focusedField === 'register-name' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Adınız"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    onFocus={() => setFocusedField('register-name')}
                    onBlur={() => setFocusedField(null)}
                    className={`${inputClassName} h-11`}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="register-email" className={`text-sm transition-colors duration-200 ${focusedField === 'register-email' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  E-posta
                </Label>
                <div className="relative">
                  <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${focusedField === 'register-email' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    onFocus={() => setFocusedField('register-email')}
                    onBlur={() => setFocusedField(null)}
                    className={`${inputClassName} h-11`}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="register-password" className={`text-sm transition-colors duration-200 ${focusedField === 'register-password' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Şifre
                </Label>
                <div className="relative">
                  <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${focusedField === 'register-password' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="En az 6 karakter"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    onFocus={() => setFocusedField('register-password')}
                    onBlur={() => setFocusedField(null)}
                    className={`${inputClassName} h-11 pr-11`}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground active:text-foreground p-1 touch-manipulation"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight">
                  <button type="button" onClick={() => setShowPrivacySheet(true)} className="text-primary active:opacity-70">
                    Gizlilik Politikası
                  </button>
                  {' '}ve{' '}
                  <button type="button" onClick={() => setShowTermsSheet(true)} className="text-primary active:opacity-70">
                    Kullanım Şartları
                  </button>
                  'nı kabul ediyorum.
                </label>
              </div>

              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  type="submit"
                  className="w-full h-11 rounded-2xl text-[15px] font-semibold shadow-[0_4px_16px_hsl(var(--primary)/0.3)]"
                  disabled={isLoading || !termsAccepted}
                >
                  {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Kayıt yapılıyor...</> : 'Kayıt Ol'}
                </Button>
              </motion.div>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-[10px] text-muted-foreground/40 text-center mt-6 pb-0">
          İçerikler bilgilendirme amaçlıdır ve tavsiye niteliği taşımaz.
        </p>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Şifre Sıfırlama</DialogTitle>
            <DialogDescription>E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="reset-email"
                type="email"
                placeholder="ornek@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="pl-11 h-12 rounded-xl"
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setShowResetDialog(false)}>
                İptal
              </Button>
              <Button type="submit" className="flex-1 h-12 rounded-xl" disabled={isResetting}>
                {isResetting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gönderiliyor...</> : 'Bağlantı Gönder'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Sheet */}
      <Sheet open={showPrivacySheet} onOpenChange={setShowPrivacySheet}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <SheetHeader className="px-6 py-4 border-b border-border">
            <SheetTitle>Gizlilik Politikası</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(85vh-80px)] px-6 py-4">
            <div className="prose prose-sm dark:prose-invert max-w-none pb-8">
              <p className="text-muted-foreground text-sm mb-6">Son güncelleme: 25 Ocak 2026</p>
              <h2 className="text-lg font-semibold mt-6 mb-3">1. Veri Toplama</h2>
              <p className="text-muted-foreground">GolMetrik AI olarak, kullanıcı deneyimini iyileştirmek için aşağıdaki verileri topluyoruz:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li><strong>Hesap Bilgileri:</strong> E-posta adresi ve şifre (şifrelenmiş olarak saklanır)</li>
                <li><strong>Kullanım Verileri:</strong> Uygulama kullanım istatistikleri, analiz geçmişi</li>
                <li><strong>Cihaz Bilgileri:</strong> Cihaz türü, işletim sistemi versiyonu</li>
                <li><strong>Ödeme Bilgileri:</strong> Google Play üzerinden işlenir, biz saklamayız</li>
              </ul>
              <h2 className="text-lg font-semibold mt-6 mb-3">2. Veri Kullanımı</h2>
              <p className="text-muted-foreground">Topladığımız verileri aşağıdaki amaçlarla kullanıyoruz:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>Hesap yönetimi ve kimlik doğrulama</li>
                <li>Kişiselleştirilmiş analiz önerileri sunma</li>
                <li>Uygulama performansını iyileştirme</li>
                <li>Teknik sorunları tespit etme ve çözme</li>
              </ul>
              <h2 className="text-lg font-semibold mt-6 mb-3">3. Veri Güvenliği</h2>
              <p className="text-muted-foreground">Verilerinizi korumak için endüstri standardı güvenlik önlemleri kullanıyoruz.</p>
              <h2 className="text-lg font-semibold mt-6 mb-3">4. Veri Paylaşımı</h2>
              <p className="text-muted-foreground">Kişisel verilerinizi üçüncü taraflarla paylaşmıyoruz (yasal zorunluluklar hariç).</p>
              <h2 className="text-lg font-semibold mt-6 mb-3">5. Kullanıcı Hakları (KVKK)</h2>
              <p className="text-muted-foreground">6698 sayılı KVKK kapsamında verilerinize erişim, düzeltme ve silme haklarına sahipsiniz.</p>
              <h2 className="text-lg font-semibold mt-6 mb-3">6. İletişim</h2>
              <p className="text-muted-foreground">Sorularınız için info@golmetrik.com adresinden bize ulaşabilirsiniz.</p>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Terms Sheet */}
      <Sheet open={showTermsSheet} onOpenChange={setShowTermsSheet}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <SheetHeader className="px-6 py-4 border-b border-border">
            <SheetTitle>Kullanım Şartları</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(85vh-80px)] px-6 py-4">
            <div className="prose prose-sm dark:prose-invert max-w-none pb-8">
              <p className="text-muted-foreground text-sm mb-6">Son güncelleme: 25 Ocak 2026</p>
              <h2 className="text-lg font-semibold mt-6 mb-3">1. Hizmet Tanımı</h2>
              <p className="text-muted-foreground">GolMetrik AI, futbol maçları için istatistiksel analizler sunan bir bilgilendirme platformudur.</p>
              <h2 className="text-lg font-semibold mt-6 mb-3">2. Kullanım Koşulları</h2>
              <p className="text-muted-foreground">Sunulan analizler bilgilendirme amaçlıdır ve yatırım tavsiyesi değildir.</p>
              <h2 className="text-lg font-semibold mt-6 mb-3">3. Sorumluluk Reddi</h2>
              <p className="text-muted-foreground">GolMetrik AI, sunulan analizlerin doğruluğunu garanti etmez. Kullanıcılar kararlarından kendileri sorumludur.</p>
              <h2 className="text-lg font-semibold mt-6 mb-3">4. Premium Üyelik</h2>
              <p className="text-muted-foreground">Abonelikler otomatik yenilenir, iptal Google Play hesabınız üzerinden yapılır.</p>
              <h2 className="text-lg font-semibold mt-6 mb-3">5. İletişim</h2>
              <p className="text-muted-foreground">Sorularınız için info@golmetrik.com adresinden bize ulaşabilirsiniz.</p>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Auth;
