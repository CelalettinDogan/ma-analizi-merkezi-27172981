import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Privacy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
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
          <h1 className="text-lg font-bold">Gizlilik Politikası</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <p className="text-muted-foreground text-sm">
            Son güncelleme: 25 Ocak 2026
          </p>

          <Section title="1. Veri Toplama">
            <p>GolMetrik AI olarak, kullanıcı deneyimini iyileştirmek için aşağıdaki verileri topluyoruz:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li><strong>Hesap Bilgileri:</strong> E-posta adresi ve şifre (şifrelenmiş olarak saklanır)</li>
              <li><strong>Kullanım Verileri:</strong> Uygulama kullanım istatistikleri, analiz geçmişi</li>
              <li><strong>Cihaz Bilgileri:</strong> Cihaz türü, işletim sistemi versiyonu</li>
              <li><strong>Ödeme Bilgileri:</strong> Google Play üzerinden işlenir, biz saklamayız</li>
            </ul>
          </Section>

          <Section title="2. Veri Kullanımı">
            <p>Topladığımız verileri aşağıdaki amaçlarla kullanıyoruz:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Hesap yönetimi ve kimlik doğrulama</li>
              <li>Kişiselleştirilmiş analiz önerileri sunma</li>
              <li>Uygulama performansını iyileştirme</li>
              <li>Teknik sorunları tespit etme ve çözme</li>
            </ul>
          </Section>

          <Section title="3. Veri Güvenliği">
            <p>Verilerinizi korumak için endüstri standardı güvenlik önlemleri kullanıyoruz:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>SSL/TLS şifreleme ile güvenli veri iletimi</li>
              <li>Şifrelerin güvenli hash algoritmaları ile saklanması</li>
              <li>Düzenli güvenlik denetimleri</li>
              <li>Erişim kontrolü ve yetkilendirme</li>
            </ul>
          </Section>

          <Section title="4. Veri Paylaşımı">
            <p>Kişisel verilerinizi üçüncü taraflarla paylaşmıyoruz, ancak aşağıdaki durumlar hariç:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Yasal zorunluluklar (mahkeme kararı, resmi talep)</li>
              <li>Hizmet sağlayıcılar (altyapı, analitik - anonim veriler)</li>
              <li>Kullanıcının açık onayı</li>
            </ul>
          </Section>

          <Section title="5. Kullanıcı Hakları (KVKK)">
            <p>6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>Kişisel verilerinize erişim talep etme</li>
              <li>Yanlış verilerin düzeltilmesini isteme</li>
              <li>Verilerinizin silinmesini talep etme</li>
              <li>Verilerinizin üçüncü kişilere aktarımına itiraz etme</li>
            </ul>
          </Section>

          <Section title="6. Çerezler">
            <p>Uygulamamız oturum yönetimi için gerekli çerezleri kullanır. Bu çerezler, uygulamanın düzgün çalışması için zorunludur.</p>
          </Section>

          <Section title="7. Çocukların Gizliliği">
            <p>Uygulamamız 13 yaşın altındaki çocuklara yönelik değildir. Bilerek 13 yaşın altındaki kişilerden kişisel veri toplamıyoruz.</p>
          </Section>

          <Section title="8. Değişiklikler">
            <p>Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikleri uygulama içi bildirimlerle duyuracağız.</p>
          </Section>

          <Section title="9. İletişim">
            <p>
              Gizlilik ile ilgili sorularınız için{' '}
              <span className="text-primary active:opacity-70">info@golmetrik.com</span>{' '}
              adresinden bize ulaşabilirsiniz.
            </p>
          </Section>

          <Section title="10. Hesap ve Veri Silme">
            <p>Hesabınızı ve tüm ilişkili verilerinizi silmek istiyorsanız aşağıdaki yöntemlerden birini kullanabilirsiniz:</p>
            
            <p className="mt-3">
              <strong>Yöntem 1 - Uygulama İçi:</strong><br />
              Profil → Ayarlar → Hesabı Sil
            </p>
            
            <p className="mt-3">
              <strong>Yöntem 2 - Web:</strong><br />
              <button 
                onClick={() => navigate('/delete-account')}
                className="text-primary active:opacity-70"
              >
                Hesap Silme Talebi
              </button>{' '}
              sayfasından işlem yapabilirsiniz.
            </p>

            <p className="mt-3"><strong>Silme işlemi şunları kapsar:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Profil bilgileriniz</li>
              <li>Analiz geçmişiniz</li>
              <li>Chat geçmişiniz</li>
              <li>Premium abonelik kayıtlarınız</li>
              <li>Tüm kullanım verileri</li>
            </ul>

            <p className="text-amber-500 text-sm mt-3">
              Not: Premium aboneliğiniz varsa, önce Google Play Store'dan iptal etmenizi öneririz.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h2 className="text-base font-semibold mb-2">{title}</h2>
    <div className="text-sm text-muted-foreground">{children}</div>
  </section>
);

export default Privacy;
