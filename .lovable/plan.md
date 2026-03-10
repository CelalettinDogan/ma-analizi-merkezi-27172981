
Amaç: E-posta linkine tıklanınca kullanıcıyı oturum açmış hale getirmeden, herkese açık bir “Doğrulandı” sayfası göstermek. Şu an sorun `AuthCallback.tsx` içinde token’ları `setSession()` ile oturuma çevirmemiz; bu da kullanıcıyı giriş yapmış hale getirip ana akışa düşürüyor.

Uygulama planı

1. `AuthCallback.tsx` akışını “doğrulama landing page” olarak yeniden kuracağım
- `access_token` / `refresh_token` geldiğinde artık `supabase.auth.setSession()` çağrılmayacak.
- Token veya doğrulama success işareti varsa sayfa direkt `verified` durumuna geçecek.
- Böylece link yalnızca doğrulama ekranını açacak, login oluşturmayacak.

2. Sayfayı tamamen public ve bağımsız tutacağım
- `/callback` zaten public route; bunu koruyacağım.
- Sayfa, mevcut auth durumundan bağımsız çalışacak.
- Giriş yapılmış olsa bile `/callback` her zaman kendi sade başarı ekranını gösterecek; anasayfaya akmayacak.

3. Başarı ekranını sade ama profesyonel hale getireceğim
- Modern, responsive, native-2026 hissinde tek kartlı success layout
- Başlık: “E-posta doğrulandı”
- Kısa açıklama: hesabın doğrulandığını, uygulamadan giriş yapılabileceğini söyleyen metin
- İsteğe bağlı tek bir aksiyon: “Uygulamayı Aç” veya “Giriş Sayfasına Git”
- Görsel yapı sade tutulacak; kullanıcıyı otomatik yönlendiren davranış olmayacak

4. Hatalı / eksik link senaryosunu netleştireceğim
- Token yoksa veya doğrulama parametresi yoksa `error` ya da kontrollü fallback gösterilecek
- Geçersiz linkte kullanıcı yanlışlıkla giriş ekranına düşmek yerine anlaşılır bir durum mesajı görecek

5. Güvenlik ve UX temizliği
- Callback URL’deki hash/query token’larını başarı tespitinden sonra URL’den temizlemek iyi olur; tekrar kullanım ve görsel karmaşa azalır
- Password reset akışına dokunmayacağım; sadece email verification landing davranışı değişecek

Değişecek dosyalar
- `src/pages/AuthCallback.tsx`
  - `setSession()` kaldırılacak
  - state mantığı sadeleştirilecek
  - modern public doğrulama ekranı oluşturulacak
  - gerekirse URL temizleme eklenecek

Muhtemel ek kontrol
- `src/App.tsx` ve `src/components/navigation/TabShell.tsx`
  - Mevcut public route yapısı doğru görünüyor; büyük olasılıkla kod değişikliği gerekmeyecek
  - Ama `/callback` sırasında hiçbir otomatik ana sayfa davranışı kalmadığını doğrulayacağım

Beklenen sonuç
```text
Kullanıcı e-posta linkine tıklar
→ /callback açılır
→ oturum oluşturulmaz
→ “E-posta doğrulandı” başarı sayfası görünür
→ kullanıcı isterse uygulamaya veya giriş ekranına manuel devam eder
```

Teknik not
- Backend tarafında yeni tablo / migration gerekmiyor
- Sorun veritabanı değil; tamamen frontend callback mantığında
- Mevcut problem, doğrulama token’ını “session login” gibi kullanmamızdan kaynaklanıyor
