import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Privacy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Gizlilik Politikası</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6 prose prose-sm dark:prose-invert max-w-none">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;
