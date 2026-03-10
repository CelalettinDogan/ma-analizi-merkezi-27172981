

## Plan: Rate Limit Durumunda Otomatik Doğrulama

### Amaç
E-posta rate limit'e takılındığında, kullanıcıların e-posta doğrulaması olmadan direkt kayıt olabilmesini sağlamak.

### Yaklaşım
1. **Auth ayarlarında auto-confirm'i aç** — Lovable Cloud auth konfigürasyonunda e-posta doğrulamasını devre dışı bırak. Bu sayede kayıt olan kullanıcılar direkt giriş yapabilir.

2. **Auth.tsx'de kayıt akışını güncelle** — Kayıt sonrası "e-posta doğrulama linki gönderildi" mesajı yerine, kullanıcıyı direkt ana sayfaya yönlendir. Rate limit hatası (429) alındığında da aynı şekilde davran.

3. **AuthCallback.tsx** — Mevcut callback sayfası olduğu gibi kalabilir (geriye dönük uyumluluk için).

### Değişiklikler
- **Konfigürasyon**: `cloud--configure_auth` ile auto-confirm açılacak
- **src/pages/Auth.tsx**: `handleRegister` fonksiyonunda kayıt başarılı olduğunda direkt navigate('/') yapılacak, "doğrulama e-postası gönderildi" mesajı kaldırılacak

