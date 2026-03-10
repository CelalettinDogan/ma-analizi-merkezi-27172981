

# E-posta Doğrulama Sayfası Planı

## Mevcut Sorun
Kayıt sonrası OTP kodu ile doğrulama yapılıyor. Kullanıcı bunu istemek yerine, e-postadaki linke tıklayınca açılan güzel bir "Doğrulandı, uygulamadan devam edin" sayfası istiyor.

## Çözüm

### 1. OTP Akışını Kaldır (`Auth.tsx`)
- OTP ekranı, `showOtpScreen` state'i, `handleVerifyOtp`, `handleResendOtp` fonksiyonlarını kaldır
- Kayıt sonrası basit bir toast mesajı göster: "E-postanıza doğrulama linki gönderildi"

### 2. `AuthCallback.tsx` — Doğrulama Başarı Sayfası
Mobil kullanıcı e-postadaki linke tıkladığında:
- Token'ları alıp session'ı set et (doğrulama tamamlansın)
- `golmetrik://` redirect yerine güzel bir başarı sayfası göster:
  - Yeşil onay ikonu
  - "E-postanız doğrulandı!"
  - "Mobil uygulamadan devam edebilirsiniz"
  - Uygulamayı açma butonu (`golmetrik://` scheme'e link)
- Web kullanıcıları için mevcut davranış korunur (session set → ana sayfaya yönlendir)

### 3. `AuthContext.tsx` — Link tabanlı doğrulamaya geri dön
- `signUp`'ta `emailRedirectTo` zaten `PUBLISHED_URL/callback` — bu doğru, değişiklik gerekmez

## Dosya Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `src/pages/Auth.tsx` | OTP state/UI/fonksiyonları kaldır, kayıt sonrası toast göster |
| `src/pages/AuthCallback.tsx` | Mobilde doğrulama başarı sayfası göster (yeşil ikon, bilgilendirme, uygulama butonu) |

**2 dosya değişikliği, yeni dosya yok**

