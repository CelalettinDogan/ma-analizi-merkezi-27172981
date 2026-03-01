import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import logoImg from '@/assets/logo.png';

const Auth: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const { user, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

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
      toast({
        title: 'Giriş Hatası',
        description: msg,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast({
        title: 'Onay Gerekli',
        description: 'Gizlilik Politikası ve Kullanım Şartları\'nı kabul etmelisiniz.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    if (registerPassword.length < 6) {
      toast({
        title: 'Şifre Hatası',
        description: 'Şifre en az 6 karakter olmalıdır.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }
    const { error, data } = await signUp(registerEmail, registerPassword, registerName);
    if (error) {
      let msg = error.message;
      if (error.message.toLowerCase().includes('rate limit') || error.message.includes('429')) {
        msg = 'Çok fazla deneme yaptınız. Lütfen birkaç dakika bekleyin.';
      }
      toast({
        title: 'Kayıt Hatası',
        description: msg,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Var olan e-posta kontrolü
    if (data?.user?.identities?.length === 0) {
      toast({
        title: 'Bu e-posta zaten kayıtlı',
        description: 'Giriş Yap sekmesinden giriş yapın.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Başarılı kayıt
    toast({
      title: 'Kayıt Başarılı',
      description: 'E-posta adresinize doğrulama bağlantısı gönderildi.',
    });
    setRegisterEmail('');
    setRegisterPassword('');
    setRegisterName('');
    setTermsAccepted(false);
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: 'Google Giriş Hatası',
        description: error.message,
        variant: 'destructive',
      });
    }
    // Native'de tarayıcı açılınca loading'i hemen kapat (kullanıcı dışarıda)
    setIsLoading(false);
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

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-background via-background to-muted/30 flex flex-col pt-safe">
      {/* Logo & Brand Section */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center py-2 xs:py-3 sm:py-6 px-6">
        <img src={logoImg} alt="GolMetrik AI" className="w-12 h-12 xs:w-14 xs:h-14 sm:w-20 sm:h-20 aspect-square object-cover mb-1 rounded-2xl shadow-lg" />
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-foreground">GolMetrik AI</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0">Akıllı Futbol Analizi</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden px-6 pb-2 max-w-md mx-auto w-full">
        {/* Google Sign In - Prominent */}
        <Button
          variant="outline"
          className="w-full h-10 text-base font-medium gap-3 border-border/60 bg-card/80 hover:bg-card mb-3 rounded-xl shadow-sm touch-manipulation"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google ile Giriş Yap
        </Button>

        {/* Divider */}
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground">veya e-posta ile</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/40 rounded-xl h-10">
            <TabsTrigger value="login" className="rounded-lg text-sm">Giriş Yap</TabsTrigger>
            <TabsTrigger value="register" className="rounded-lg text-sm">Kayıt Ol</TabsTrigger>
          </TabsList>

          {/* Login */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-3 mt-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm">E-posta</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="pl-11 h-12 rounded-xl bg-muted/30 border-border/50"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-sm">Şifre</Label>
                  <button
                    type="button"
                    onClick={() => setShowResetDialog(true)}
                    className="text-xs text-primary hover:underline touch-manipulation"
                  >
                    Şifremi Unuttum
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pl-11 pr-11 h-12 rounded-xl bg-muted/30 border-border/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 touch-manipulation"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl text-base font-medium" disabled={isLoading}>
                {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Giriş yapılıyor...</> : 'Giriş Yap'}
              </Button>
            </form>
          </TabsContent>

          {/* Register */}
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-2 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="register-name" className="text-sm">İsim</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Adınız"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="pl-11 h-10 rounded-xl bg-muted/30 border-border/50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="register-email" className="text-sm">E-posta</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="pl-11 h-10 rounded-xl bg-muted/30 border-border/50"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="register-password" className="text-sm">Şifre</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="En az 6 karakter"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="pl-11 pr-11 h-10 rounded-xl bg-muted/30 border-border/50"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 touch-manipulation"
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
                  <button type="button" onClick={() => setShowPrivacySheet(true)} className="text-primary hover:underline">
                    Gizlilik Politikası
                  </button>
                  {' '}ve{' '}
                  <button type="button" onClick={() => setShowTermsSheet(true)} className="text-primary hover:underline">
                    Kullanım Şartları
                  </button>
                  'nı kabul ediyorum.
                </label>
              </div>

              <Button type="submit" className="w-full h-10 rounded-xl text-base font-medium" disabled={isLoading || !termsAccepted}>
                {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Kayıt yapılıyor...</> : 'Kayıt Ol'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="text-micro text-muted-foreground text-center mt-2 pb-0">
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
