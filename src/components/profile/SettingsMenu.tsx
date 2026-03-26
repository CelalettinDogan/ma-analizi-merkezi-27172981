import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, LogOut, ChevronRight, 
  Brain, Calendar, TrendingUp, Heart, Sparkles,
  Palette, HelpCircle, Trash2, AlertTriangle, Shield, FileText
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SettingsMenuProps {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  signOut: () => Promise<void>;
  userId: string;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ theme, setTheme, signOut, userId }) => {
  const navigate = useNavigate();
  const [showPrivacySheet, setShowPrivacySheet] = useState(false);
  const [showTermsSheet, setShowTermsSheet] = useState(false);
  const [showThemeSheet, setShowThemeSheet] = useState(false);
  const [showAIInfoSheet, setShowAIInfoSheet] = useState(false);
  const [showDeleteAccountSheet, setShowDeleteAccountSheet] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SİL') return;
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
      if (!response.ok) throw new Error(data.error || 'Hesap silinemedi');
      toast.success('Hesabınız başarıyla silindi');
      await signOut();
      navigate('/');
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast.error(error.message || 'Hesap silinirken bir hata oluştu');
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
            Ayarlar
          </h2>

          <Button variant="ghost" className="w-full justify-between h-11 text-sm rounded-xl active:scale-[0.98] transition-transform" onClick={() => setShowThemeSheet(true)}>
            <span className="flex items-center gap-2.5"><Palette className="h-4 w-4 text-muted-foreground" />Tema</span>
            <span className="text-xs text-muted-foreground capitalize">{theme === 'dark' ? 'Koyu' : theme === 'light' ? 'Açık' : 'Sistem'}</span>
          </Button>
          <Button variant="ghost" className="w-full justify-between h-11 text-sm rounded-xl active:scale-[0.98] transition-transform" onClick={() => setShowAIInfoSheet(true)}>
            <span className="flex items-center gap-2.5"><HelpCircle className="h-4 w-4 text-muted-foreground" />AI Nasıl Çalışır?</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>

          <div className="border-t border-border/50 my-2" />

          <div className="text-center pb-2">
            <p className="font-semibold text-sm font-display">GolMetrik AI</p>
            <p className="text-micro text-muted-foreground">v1.0.0 • İstatistik destekli futbol analiz platformu</p>
          </div>
          <Button variant="ghost" className="w-full justify-between h-11 text-sm rounded-xl active:scale-[0.98] transition-transform" onClick={() => setShowPrivacySheet(true)}>
            <span className="flex items-center gap-2.5"><Shield className="h-4 w-4 text-muted-foreground" />Gizlilik Politikası</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" className="w-full justify-between h-11 text-sm rounded-xl active:scale-[0.98] transition-transform" onClick={() => setShowTermsSheet(true)}>
            <span className="flex items-center gap-2.5"><FileText className="h-4 w-4 text-muted-foreground" />Kullanım Şartları</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>

          <div className="border-t border-border/50 my-2" />

          <Button variant="ghost" className="w-full justify-between h-11 text-sm rounded-xl text-destructive active:bg-destructive/10" onClick={() => setShowDeleteAccountSheet(true)}>
            <span className="flex items-center gap-2.5"><Trash2 className="h-4 w-4" />Hesabı Sil</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2.5 h-11 text-sm rounded-xl text-destructive active:bg-destructive/10" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /><span>Çıkış Yap</span>
          </Button>
        </CardContent>
      </Card>

      {/* Theme Sheet */}
      <Sheet open={showThemeSheet} onOpenChange={setShowThemeSheet}>
        <SheetContent side="bottom" className="h-auto max-h-[60vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2"><Palette className="w-5 h-5" />Tema Seçimi</SheetTitle>
            <SheetDescription>Uygulama görünümünü kişiselleştirin</SheetDescription>
          </SheetHeader>
          <RadioGroup value={theme} onValueChange={setTheme} className="space-y-3 pb-6">
            {[
              { value: 'light', icon: '☀️', label: 'Açık Tema', desc: 'Gündüz kullanımı için ideal' },
              { value: 'dark', icon: '🌙', label: 'Koyu Tema', desc: 'Göz yorgunluğunu azaltır' },
              { value: 'system', icon: '📱', label: 'Sistem', desc: 'Cihaz ayarlarını takip eder' },
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
            <SheetTitle className="flex items-center gap-2"><Brain className="w-5 h-5 text-primary" />Analiz Motoru Hakkında</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-full max-h-[60vh]">
            <div className="space-y-4 pb-6">
              <p className="text-sm text-muted-foreground">GolMetrik AI, maç analizleri için istatistiksel modeller kullanmaktadır:</p>
              <div className="space-y-2.5">
                {[
                  { icon: TrendingUp, title: 'Takım Performans Verileri', desc: 'Son maç formları ve istatistikleri' },
                  { icon: Heart, title: 'H2H İstatistikleri', desc: 'Kafa kafaya geçmiş karşılaşmalar' },
                  { icon: Calendar, title: 'Lig Sıralama Bilgileri', desc: 'Güncel puan durumu ve konumlar' },
                  { icon: Sparkles, title: 'Form Analizleri', desc: 'Ev/deplasman performans farkları' },
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
              <p className="text-xs text-muted-foreground">Analiz motoru, en güncel maç verileriyle düzenli olarak iyileştirilmektedir.</p>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  <strong>Önemli:</strong> Sunulan analizler bilgilendirme amaçlıdır ve kesin kazanç garantisi vermez.
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
            <SheetTitle className="flex items-center gap-2 text-destructive"><Trash2 className="w-5 h-5" />Hesabı Sil</SheetTitle>
            <SheetDescription>Bu işlem geri alınamaz</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 pb-6">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-destructive">Dikkat!</p>
                <p className="text-xs text-muted-foreground mt-1">Hesabınızı sildiğinizde aşağıdaki veriler kalıcı olarak silinecektir:</p>
                <ul className="text-xs text-muted-foreground mt-1.5 space-y-0.5 list-disc list-inside">
                  <li>Tüm analiz geçmişiniz</li>
                  <li>Favorileriniz</li>
                  <li>AI Asistan sohbet geçmişiniz</li>
                  <li>Premium abonelik bilgileriniz</li>
                </ul>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delete-confirm" className="text-sm">
                Onaylamak için <strong className="text-destructive">SİL</strong> yazın:
              </Label>
              <Input id="delete-confirm" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())} placeholder="SİL" className="uppercase" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setShowDeleteAccountSheet(false); setDeleteConfirmText(''); }}>Vazgeç</Button>
              <Button variant="destructive" className="flex-1" disabled={deleteConfirmText !== 'SİL' || isDeleting} onClick={handleDeleteAccount}>
                {isDeleting ? 'Siliniyor...' : 'Hesabı Sil'}
              </Button>
            </div>
            <p className="text-micro text-muted-foreground text-center">KVKK/GDPR kapsamında verileriniz kalıcı olarak silinecektir.</p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Privacy Sheet */}
      <Sheet open={showPrivacySheet} onOpenChange={setShowPrivacySheet}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <ScrollArea className="h-full px-6 py-6">
            <div className="space-y-6 pb-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Gizlilik Politikası</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowPrivacySheet(false)}>Kapat</Button>
              </div>
              <p className="text-xs text-muted-foreground">Son güncelleme: 25 Ocak 2026</p>
              <div className="space-y-4">
                {[
                  { t: '1. Veri Toplama', d: 'GolMetrik AI olarak, hizmetlerimizi sunabilmek için belirli kişisel verilerinizi topluyoruz. Bu veriler arasında e-posta adresiniz, kullanıcı tercihleri ve uygulama kullanım istatistikleri yer almaktadır.' },
                  { t: '2. Veri Kullanımı', d: 'Topladığımız veriler, size kişiselleştirilmiş futbol analizi sunmak, uygulama deneyimini iyileştirmek ve teknik destek sağlamak amacıyla kullanılmaktadır.' },
                  { t: '3. Veri Güvenliği', d: 'Verileriniz endüstri standardı güvenlik protokolleri ile korunmaktadır. SSL şifreleme ve güvenli sunucu altyapısı kullanıyoruz.' },
                  { t: '4. Üçüncü Taraf Paylaşımı', d: 'Kişisel verileriniz, yasal zorunluluklar dışında üçüncü taraflarla paylaşılmaz. Analiz hizmetleri için anonim ve toplu veriler kullanılabilir.' },
                  { t: '5. Çerezler', d: 'Uygulamamız, oturum yönetimi ve kullanıcı tercihlerini saklamak için gerekli çerezleri kullanmaktadır.' },
                  { t: '6. Kullanıcı Hakları', d: 'Verilerinize erişim, düzeltme veya silme talep etme hakkına sahipsiniz. Bu talepler için destek ekibimizle iletişime geçebilirsiniz.' },
                  { t: '7. İletişim', d: 'Gizlilik politikamız hakkında sorularınız için: destek@golmetrik.com' },
                ].map(s => (
                  <section key={s.t}>
                    <h3 className="font-semibold text-sm mb-1">{s.t}</h3>
                    <p className="text-xs text-muted-foreground">{s.d}</p>
                  </section>
                ))}
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Terms Sheet */}
      <Sheet open={showTermsSheet} onOpenChange={setShowTermsSheet}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <ScrollArea className="h-full px-6 py-6">
            <div className="space-y-6 pb-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Kullanım Şartları</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowTermsSheet(false)}>Kapat</Button>
              </div>
              <p className="text-xs text-muted-foreground">Son güncelleme: 25 Ocak 2026</p>
              <div className="space-y-4">
                {[
                  { t: '1. Hizmet Tanımı', d: 'GolMetrik AI, istatistik destekli futbol analiz platformudur. Sunulan tüm analizler istatistiksel değerlendirmeler olup, kesin sonuç garantisi vermez.' },
                  { t: '2. Kullanım Koşulları', d: 'Uygulamayı kullanarak bu şartları kabul etmiş olursunuz. Platform 18 yaş üstü kullanıcılar içindir. Yasal olmayan amaçlarla kullanım yasaktır.' },
                  { t: '3. Sorumluluk Reddi', d: 'Sunulan analizler bilgilendirme amaçlıdır. Bahis veya finansal kararlar için tavsiye niteliği taşımaz. Kullanıcılar kendi kararlarından sorumludur.' },
                  { t: '4. Fikri Mülkiyet', d: 'Uygulama içeriği, algoritmaları ve tasarımı GolMetrik AI\'a aittir. İzinsiz kopyalama veya dağıtım yasaktır.' },
                  { t: '5. Hesap Güvenliği', d: 'Kullanıcılar hesap bilgilerini güvende tutmakla yükümlüdür. Şüpheli aktivite durumunda derhal bildirim yapılmalıdır.' },
                  { t: '6. Premium Üyelik', d: 'Premium özellikler ücretli abonelik gerektirir. İptal ve iade koşulları uygulama mağazası politikalarına tabidir.' },
                  { t: '7. Değişiklikler', d: 'Bu şartlar önceden bildirimle güncellenebilir. Güncel versiyonu uygulama içinden takip edebilirsiniz.' },
                  { t: '8. İletişim', d: 'Sorularınız için: destek@golmetrik.com' },
                ].map(s => (
                  <section key={s.t}>
                    <h3 className="font-semibold text-sm mb-1">{s.t}</h3>
                    <p className="text-xs text-muted-foreground">{s.d}</p>
                  </section>
                ))}
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default SettingsMenu;
