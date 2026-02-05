import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Loader2, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

  // Kullanıcı zaten giriş yapmışsa yönlendir
  useEffect(() => {
    if (user) {
      const from = (location.state as { from?: string })?.from || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location.state]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
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
      toast({
        title: 'Giriş Hatası',
        description: error.message === 'Invalid login credentials' 
          ? 'E-posta veya şifre hatalı' 
          : error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
    } else {
      toast({
        title: 'Hoş Geldiniz!',
        description: 'Başarıyla giriş yaptınız.',
      });
      // Yönlendirme useEffect tarafından yapılacak
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!termsAccepted) {
      toast({
        title: 'Onay Gerekli',
        description: 'Devam etmek için Gizlilik Politikası ve Kullanım Şartları\'nı kabul etmelisiniz.',
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

    const { error } = await signUp(registerEmail, registerPassword, registerName);

    if (error) {
      toast({
        title: 'Kayıt Hatası',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
    } else {
      toast({
        title: 'Hesap Oluşturuldu!',
        description: 'Başarıyla kayıt oldunuz.',
      });
      // Yönlendirme useEffect tarafından yapılacak
    }
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
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);

    const { error } = await resetPassword(resetEmail);

    if (error) {
      toast({
        title: 'Hata',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'E-posta Gönderildi',
        description: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.',
      });
      setShowResetDialog(false);
      setResetEmail('');
    }

    setIsResetting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-safe">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
            <span className="text-primary-foreground font-bold">GM</span>
          </div>
          <span className="font-display font-bold text-2xl text-foreground">GolMetrik</span>
        </div>

        <Card className="glass-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display">Hesap</CardTitle>
            <CardDescription>
              Tahminlerinizi kaydetmek için giriş yapın veya kayıt olun
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Google Sign In */}
            <Button
              variant="outline"
              className="w-full mb-4"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Chrome className="h-4 w-4 mr-2" />
              Google ile Giriş Yap
            </Button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">veya e-posta ile</span>
              </div>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger value="login">Giriş Yap</TabsTrigger>
                <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-posta</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="ornek@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10 bg-muted/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Şifre</Label>
                      <button
                        type="button"
                        onClick={() => setShowResetDialog(true)}
                        className="text-xs text-primary hover:underline"
                      >
                        Şifremi Unuttum
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 pr-10 bg-muted/50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Giriş yapılıyor...
                      </>
                    ) : (
                      'Giriş Yap'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">İsim</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Adınız"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="pl-10 bg-muted/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">E-posta</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="ornek@email.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="pl-10 bg-muted/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Şifre</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="En az 6 karakter"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="pl-10 pr-10 bg-muted/50"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="flex items-start gap-3 pt-2">
                    <Checkbox 
                      id="terms" 
                      checked={termsAccepted} 
                      onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                      <button 
                        type="button"
                        onClick={() => setShowPrivacySheet(true)} 
                        className="text-primary hover:underline"
                      >
                        Gizlilik Politikası
                      </button>
                      {' '}ve{' '}
                      <button 
                        type="button"
                        onClick={() => setShowTermsSheet(true)} 
                        className="text-primary hover:underline"
                      >
                        Kullanım Şartları
                      </button>
                      'nı okudum ve kabul ediyorum.
                    </label>
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading || !termsAccepted}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Kayıt yapılıyor...
                      </>
                    ) : (
                      'Kayıt Ol'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-4">
          İçerikler bilgilendirme amaçlıdır ve tavsiye niteliği taşımaz.
        </p>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Şifre Sıfırlama</DialogTitle>
            <DialogDescription>
              E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">E-posta</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="ornek@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowResetDialog(false)}
              >
                İptal
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  'Bağlantı Gönder'
                )}
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
              <p className="text-muted-foreground text-sm mb-6">
                Son güncelleme: 25 Ocak 2026
              </p>

              <h2 className="text-lg font-semibold mt-6 mb-3">1. Veri Toplama</h2>
              <p className="text-muted-foreground">
                GolMetrik olarak, kullanıcı deneyimini iyileştirmek için aşağıdaki verileri topluyoruz:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li><strong>Hesap Bilgileri:</strong> E-posta adresi ve şifre (şifrelenmiş olarak saklanır)</li>
                <li><strong>Kullanım Verileri:</strong> Uygulama kullanım istatistikleri, analiz geçmişi</li>
                <li><strong>Cihaz Bilgileri:</strong> Cihaz türü, işletim sistemi versiyonu</li>
                <li><strong>Ödeme Bilgileri:</strong> Google Play üzerinden işlenir, biz saklamayız</li>
              </ul>

              <h2 className="text-lg font-semibold mt-6 mb-3">2. Veri Kullanımı</h2>
              <p className="text-muted-foreground">
                Topladığımız verileri aşağıdaki amaçlarla kullanıyoruz:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>Hesap yönetimi ve kimlik doğrulama</li>
                <li>Kişiselleştirilmiş analiz önerileri sunma</li>
                <li>Uygulama performansını iyileştirme</li>
                <li>Teknik sorunları tespit etme ve çözme</li>
              </ul>

              <h2 className="text-lg font-semibold mt-6 mb-3">3. Veri Güvenliği</h2>
              <p className="text-muted-foreground">
                Verilerinizi korumak için endüstri standardı güvenlik önlemleri kullanıyoruz:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>SSL/TLS şifreleme ile güvenli veri iletimi</li>
                <li>Şifrelerin güvenli hash algoritmaları ile saklanması</li>
                <li>Düzenli güvenlik denetimleri</li>
                <li>Erişim kontrolü ve yetkilendirme</li>
              </ul>

              <h2 className="text-lg font-semibold mt-6 mb-3">4. Veri Paylaşımı</h2>
              <p className="text-muted-foreground">
                Kişisel verilerinizi üçüncü taraflarla paylaşmıyoruz, ancak aşağıdaki durumlar hariç:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>Yasal zorunluluklar (mahkeme kararı, resmi talep)</li>
                <li>Hizmet sağlayıcılar (altyapı, analitik - anonim veriler)</li>
                <li>Kullanıcının açık onayı</li>
              </ul>

              <h2 className="text-lg font-semibold mt-6 mb-3">5. Kullanıcı Hakları (KVKK)</h2>
              <p className="text-muted-foreground">
                6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aşağıdaki haklara sahipsiniz:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>Kişisel verilerinize erişim talep etme</li>
                <li>Yanlış verilerin düzeltilmesini isteme</li>
                <li>Verilerinizin silinmesini talep etme</li>
                <li>Verilerinizin üçüncü kişilere aktarımına itiraz etme</li>
              </ul>

              <h2 className="text-lg font-semibold mt-6 mb-3">6. Çerezler</h2>
              <p className="text-muted-foreground">
                Uygulamamız oturum yönetimi için gerekli çerezleri kullanır. Bu çerezler, 
                uygulamanın düzgün çalışması için zorunludur.
              </p>

              <h2 className="text-lg font-semibold mt-6 mb-3">7. Çocukların Gizliliği</h2>
              <p className="text-muted-foreground">
                Uygulamamız 13 yaşın altındaki çocuklara yönelik değildir. Bilerek 13 yaşın altındaki 
                kişilerden kişisel veri toplamıyoruz.
              </p>

              <h2 className="text-lg font-semibold mt-6 mb-3">8. Değişiklikler</h2>
              <p className="text-muted-foreground">
                Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikleri 
                uygulama içi bildirimlerle duyuracağız.
              </p>

              <h2 className="text-lg font-semibold mt-6 mb-3">9. İletişim</h2>
              <p className="text-muted-foreground">
                Gizlilik ile ilgili sorularınız için info@golmetrik.com adresinden bize ulaşabilirsiniz.
              </p>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Terms of Service Sheet */}
      <Sheet open={showTermsSheet} onOpenChange={setShowTermsSheet}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <SheetHeader className="px-6 py-4 border-b border-border">
            <SheetTitle>Kullanım Şartları</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(85vh-80px)] px-6 py-4">
            <div className="prose prose-sm dark:prose-invert max-w-none pb-8">
              <p className="text-muted-foreground text-sm mb-6">
                Son güncelleme: 25 Ocak 2026
              </p>

              <h2 className="text-lg font-semibold mt-6 mb-3">1. Hizmet Tanımı</h2>
              <p className="text-muted-foreground">
                GolMetrik, futbol maçları için istatistiksel analizler ve tahminler sunan bir bilgilendirme platformudur. 
                Uygulamamız, yapay zeka ve makine öğrenimi teknolojilerini kullanarak maç istatistiklerini analiz eder.
              </p>

              <h2 className="text-lg font-semibold mt-6 mb-3">2. Kullanım Koşulları</h2>
              <p className="text-muted-foreground">
                Bu uygulamayı kullanarak aşağıdaki koşulları kabul etmiş olursunuz:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>Uygulamayı yalnızca yasal amaçlarla kullanacaksınız.</li>
                <li>Sunulan analizler bilgilendirme amaçlıdır ve yatırım tavsiyesi değildir.</li>
                <li>Hesabınızın güvenliğinden siz sorumlusunuz.</li>
                <li>Uygulamayı kötüye kullanmayacak veya tersine mühendislik yapmayacaksınız.</li>
              </ul>

              <h2 className="text-lg font-semibold mt-6 mb-3">3. Sorumluluk Reddi</h2>
              <p className="text-muted-foreground">
                GolMetrik, sunulan analizlerin doğruluğunu garanti etmez. Tüm tahminler istatistiksel modellere 
                dayanmaktadır ve gerçek sonuçlar farklılık gösterebilir. Kullanıcılar, kendi kararlarından 
                tamamen kendileri sorumludur.
              </p>

              <h2 className="text-lg font-semibold mt-6 mb-3">4. Premium Üyelik</h2>
              <p className="text-muted-foreground">
                Premium üyelik satın alarak ek özelliklere erişim sağlarsınız. Abonelikler otomatik olarak 
                yenilenir ve iptal işlemleri Google Play hesabınız üzerinden yapılmalıdır.
              </p>

              <h2 className="text-lg font-semibold mt-6 mb-3">5. Fikri Mülkiyet</h2>
              <p className="text-muted-foreground">
                Uygulama içeriği, tasarımı ve tüm materyaller GolMetrik'e aittir. İzinsiz kopyalama, 
                dağıtım veya değiştirme yasaktır.
              </p>

              <h2 className="text-lg font-semibold mt-6 mb-3">6. Değişiklikler</h2>
              <p className="text-muted-foreground">
                Bu kullanım şartlarını herhangi bir zamanda değiştirme hakkımızı saklı tutarız. 
                Önemli değişiklikler uygulama içi bildirimlerle duyurulacaktır.
              </p>

              <h2 className="text-lg font-semibold mt-6 mb-3">7. İletişim</h2>
              <p className="text-muted-foreground">
                Sorularınız için info@golmetrik.com adresinden bize ulaşabilirsiniz.
              </p>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Auth;
