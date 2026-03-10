

# Doğrulama Başarı Sayfası Düzeltmesi

## Sorun
`AuthCallback.tsx`'deki koşul, başarı sayfasını sadece mobil user-agent veya native platform parametresi algılandığında gösteriyor. E-posta linkine tıklayan kullanıcı masaüstü tarayıcıda açarsa koşul tutmuyor ve direkt `/` veya `/auth`'a yönleniyor.

Bu uygulama sadece Android native olduğu için, callback sayfası **her zaman** doğrulama başarı ekranını göstermeli.

## Çözüm: `AuthCallback.tsx`

1. **Mobil/native koşulunu kaldır** — token'lar geçerli ve session set edildiyse, her zaman `verified` state'ine geç
2. **State'i genişlet** — `verified-mobile` yerine sadece `verified` olsun
3. **Başarı sayfası UI** — mevcut tasarımı koru (logo, yeşil onay ikonu, "E-postanız Doğrulandı!", "Uygulamayı Aç" butonu)
4. **Web yönlendirmesini kaldır** — `navigate('/', ...)` satırını sil, her durumda başarı sayfası göster

### Akış
```
Token var → session set → Başarı sayfası göster (her zaman)
Token yok → /auth'a yönlendir
Hata → Hata sayfası göster
```

| Dosya | Değişiklik |
|---|---|
| `src/pages/AuthCallback.tsx` | Platform koşulunu kaldır, her zaman başarı sayfası göster |

**1 dosya değişikliği**

