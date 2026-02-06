
# Google OAuth Düzeltmesi

## Tespit Edilen Sorun

Google ile giriş yapıldığında şu hata alınıyor:
```json
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```

**Neden:** Mevcut kod `supabase.auth.signInWithOAuth()` kullanıyor, ancak Lovable Cloud projelerinde **managed Google OAuth** için `lovable.auth.signInWithOAuth()` fonksiyonu kullanılmalı.

---

## Çözüm

Lovable Cloud'un otomatik olarak yönetilen Google OAuth yapılandırmasını kullanacağız. Bu, herhangi bir API key veya ek yapılandırma gerektirmez.

### Teknik Değişiklikler

**1. Lovable Cloud Auth Modülü Oluştur**

`supabase--configure-social-auth` aracını kullanarak `src/integrations/lovable/` modülünü otomatik oluşturacağız.

**2. AuthContext.tsx Güncelle**

Mevcut kod:
```typescript
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  return { error };
};
```

Yeni kod:
```typescript
import { lovable } from "@/integrations/lovable/index";

const signInWithGoogle = async () => {
  const { error } = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
  return { error: error as Error | null };
};
```

---

## Dosya Değişiklikleri

| Dosya | İşlem |
|-------|-------|
| `src/integrations/lovable/index.ts` | Otomatik Oluştur - Lovable Cloud auth modülü |
| `src/contexts/AuthContext.tsx` | Güncelle - lovable.auth.signInWithOAuth kullan |

---

## Test Senaryoları

1. **Google butonu tıkla** → Google hesap seçim sayfası açılmalı
2. **Hesap seç** → Başarıyla giriş yapılmalı ve ana sayfaya yönlendirilmeli
3. **Çıkış yap** → Auth sayfasına dönmeli

---

## Önemli Notlar

- Lovable Cloud, Google OAuth'u otomatik olarak yönetir
- Ek API key veya yapılandırma gerekmez
- `@lovable.dev/cloud-auth-js` paketi otomatik yüklenecek
