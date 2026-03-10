

# Native Auth Linkleri Düzeltme Planı

## Sorunlar

### Kök Neden
Capacitor uygulamasında `window.location.origin` değeri `https://golmetrik.app` döner (capacitor.config.ts'deki hostname). Bu gerçek bir domain değil — Supabase'in gönderdiği e-posta linkleri bu adrese yönlendirdiğinde hiçbir yerde açılmaz.

Etkilenen 3 akış:
1. **Kayıt ol → e-posta doğrulama linki**: `emailRedirectTo: window.location.origin` → `https://golmetrik.app` → açılmaz
2. **Şifremi unuttum → reset linki**: `redirectTo: ${window.location.origin}/reset-password` → `https://golmetrik.app/reset-password` → açılmaz
3. **Google ile giriş**: OAuth callback `LOVABLE_CLOUD_URL/callback?platform=native` → Bu sayfa token'ları `golmetrik://callback`'e yönlendiriyor, ama deep link'in çalışması Android manifest'te intent-filter'a bağlı (bu kısım Capacitor tarafında yapılmış olmalı)

## Çözüm

### Strateji
E-posta linklerini yayınlanmış web URL'sine yönlendir → Web sayfası token'ları algılayıp native uygulamaya deep link ile ilet.

### 1. `AuthContext.tsx` — Redirect URL'lerini düzelt

`window.location.origin` yerine published URL kullan:
```
const PUBLISHED_URL = 'https://golmetrikapp.lovable.app';
```

- `signUp` → `emailRedirectTo: PUBLISHED_URL`  
- `resetPassword` → `redirectTo: ${PUBLISHED_URL}/reset-password`

Native'de çalışırken `window.location.origin` yerine sabit published URL kullanılacak. Web dev ortamında ise `window.location.origin` korunacak.

### 2. `AuthCallback.tsx` — E-posta doğrulama linklerini de native'e yönlendir

Şu an sadece `platform=native` query param'ı ile gelen OAuth callback'leri native'e yönlendiriyor. E-posta doğrulama linkleri ise `type=signup` veya `type=magiclink` hash parametresi ile gelir.

Eklenmesi gereken mantık:
- Hash'te `type=signup` veya `type=magiclink` varsa ve user-agent mobil ise → `golmetrik://callback?access_token=...&refresh_token=...` şeklinde native redirect yap
- Bu sayede kayıt doğrulama linki tıklandığında native app açılır

### 3. `ResetPassword.tsx` — Native deep link desteği

Şifre sıfırlama e-postası kullanıcıyı `published-url/reset-password#access_token=...&type=recovery` adresine yönlendirir. Bu sayfa tarayıcıda açılır ama native app'te değil.

Eklenmesi gereken mantık:
- Sayfa yüklendiğinde `type=recovery` ve token'lar varsa, mobil user-agent kontrolü yap
- Mobil ise: `golmetrik://reset-password?access_token=...&refresh_token=...&type=recovery` şeklinde native'e yönlendir
- Native app'teki DeepLinkHandler bu yeni path'i de karşılayacak

### 4. `DeepLinkHandler` (App.tsx) — Reset password deep link desteği

Mevcut handler sadece `golmetrik://callback` dinliyor. Eklenmesi gereken:
- `golmetrik://reset-password` path'ini de dinle
- Token'ları URL'den çıkar, `supabase.auth.setSession()` yap
- Ardından `/reset-password` sayfasına navigate et (in-app)

### 5. `signInWithGoogle` — Native OAuth redirect URL düzeltmesi

Mevcut: `redirect_uri: ${LOVABLE_CLOUD_URL}/callback?platform=native`

Bu doğru çalışıyor olmalı — AuthCallback sayfası `platform=native` görünce `golmetrik://` scheme'e yönlendiriyor. Eğer Google giriş çalışmıyorsa sorun Android manifest'teki intent-filter eksikliği olabilir (Capacitor tarafı, repo dışı).

Ama redirect URL'yi de published URL'ye çekmek daha güvenilir:
`redirect_uri: ${PUBLISHED_URL}/callback?platform=native`

---

## Dosya Değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `src/contexts/AuthContext.tsx` | `PUBLISHED_URL` sabiti ekle, redirect URL'leri düzelt |
| `src/pages/AuthCallback.tsx` | Mobil user-agent tespiti + e-posta doğrulama için native redirect |
| `src/pages/ResetPassword.tsx` | Mobil user-agent tespiti + native deep link redirect |
| `src/App.tsx` (DeepLinkHandler) | `golmetrik://reset-password` path desteği ekle |

**Toplam: 4 dosya değişikliği, yeni dosya yok**

