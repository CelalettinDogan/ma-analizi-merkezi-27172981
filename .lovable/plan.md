

# E-posta Doğrulama Yönlendirme Düzeltmesi

## Sorun
`getRedirectUrl()` fonksiyonu web'de `window.location.origin` döndürüyor. Preview URL'si (`id-preview--...lovable.app`) backend'in izin verilen redirect URL listesinde olmadığı için, doğrulama linki lovable.dev'e yönlendiriyor — `/callback` sayfası hiç açılmıyor.

## Çözüm
Bu proje sadece Android native uygulaması olduğu için, `emailRedirectTo` **her zaman** `PUBLISHED_URL` kullanmalı. Preview'den test ederken bile doğrulama linki published URL'ye yönlenmeli — orası `/callback` sayfasını barındırıyor.

### Değişiklik: `src/contexts/AuthContext.tsx`
`getRedirectUrl()` fonksiyonunu kaldır, `signUp` ve `resetPassword`'da doğrudan `PUBLISHED_URL` kullan:

```typescript
// Eski:
const getRedirectUrl = () => {
  if (Capacitor.isNativePlatform()) return PUBLISHED_URL;
  return window.location.origin;
};

// Yeni: her zaman PUBLISHED_URL kullan
emailRedirectTo: `${PUBLISHED_URL}/callback`
redirectTo: `${PUBLISHED_URL}/reset-password`
```

Capacitor import'u da artık gerekmediği için kaldırılacak.

| Dosya | Değişiklik |
|---|---|
| `src/contexts/AuthContext.tsx` | `getRedirectUrl` kaldır, redirect URL'leri sabit `PUBLISHED_URL` yap |

**1 dosya değişikliği**

