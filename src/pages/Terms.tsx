import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Terms: React.FC = () => {
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
            <h1 className="text-xl font-bold">Kullanım Şartları</h1>
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

            <h2 className="text-lg font-semibold mt-6 mb-3">1. Hizmet Tanımı</h2>
            <p className="text-muted-foreground">
              Gol Metrik, futbol maçları için istatistiksel analizler ve tahminler sunan bir bilgilendirme platformudur. 
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
              Gol Metrik, sunulan analizlerin doğruluğunu garanti etmez. Tüm tahminler istatistiksel modellere 
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
              Uygulama içeriği, tasarımı ve tüm materyaller Gol Metrik'e aittir. İzinsiz kopyalama, 
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
