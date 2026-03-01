

# İki Sorun: Oturum Kalıcılığı + Native Google OAuth

## Sorun 1: Uygulama Kapatılıp Açılınca Oturum Kaybolması

**Kök Neden:** `AuthContext`'te yarış durumu (race condition) var. `onAuthStateChange` listener'ı, `getSession()` tamamlanmadan önce `session: null` ile ateşlenebiliyor. Bu durumda `isLoading = false` ve `user = null` olup TabShell'in auth guard'ı kullanıcıyı hemen `/auth`'a yönlendiriyor — oturum localStorage'da mevcut olsa bile.

**Çözüm:**
- `AuthContext`'e bir `initialized` ref ekle
- `isLoading`'i sadece `getSession()` tamamlandığında `false` yap
- `onAuthStateChange`'in `isLoading`'i `false` yapmasını ancak initialization sonrasına ertele
- Bu sayede session restore tamamlanmadan auth guard devreye girmeyecek

## Sorun 2: Google OAuth Native'de Lovable'a Giriş Yapıyor

**Kök Neden:** `signInWithGoogle` native dalında `redirect_uri` olarak `${LOVABLE_CLOUD_URL}/callback?platform=native` kullanılıyor. Ancak Lovable Cloud OAuth akışı bu redirect_uri'yi düzgün işlemeyebilir — kullanıcı harici tarayıcıda preview sitesinde kalıyor, `golmetrik://` yönlendirmesi gerçekleşmiyor.

**Çözüm:**
- `redirect_uri`'den `?platform=native` parametresini çıkar, bunun yerine OAuth `state` parametresine `native` bilgisini göm
- `AuthCallback.tsx`'te state parametresinden native tespiti yap
- Deep link yönlendirmesinden sonra harici tarayıcıyı kapatmak için fallback mekanizması ekle
- `DeepLinkHandler`'da session kurulduktan sonra `Browser.close()` çağrısını garantile

## Değişecek Dosyalar

1. **`src/contexts/AuthContext.tsx`** — `initialized` ref ile race condition düzeltmesi + `signInWithGoogle` native dalında state parametresi kullanımı
2. **`src/pages/AuthCallback.tsx`** — State parametresinden native platform tespiti + güvenli custom scheme yönlendirmesi
3. **`src/App.tsx`** — `DeepLinkHandler`'da Browser.close() güvenlik iyileştirmesi

## Teknik Detay

```text
MEVCUT AKIŞ (sorunlu):
App başlar → onAuthStateChange(null) → isLoading=false, user=null → Auth guard → /auth

DÜZELTİLMİŞ AKIŞ:
App başlar → onAuthStateChange(null) → initialized=false, isLoading devam eder
         → getSession() → session bulunur → user set → isLoading=false → Ana sayfa

MEVCUT OAUTH (sorunlu):
Native → Browser.open(LOVABLE/~oauth/initiate?redirect_uri=LOVABLE/callback?platform=native)
→ Google auth → LOVABLE/callback?platform=native (ama yönlendirme çalışmıyor)

DÜZELTİLMİŞ OAUTH:
Native → Browser.open(LOVABLE/~oauth/initiate?redirect_uri=LOVABLE/callback&state=native:xxx)
→ Google auth → LOVABLE/callback#access_token=...&state=native:xxx
→ AuthCallback: state içinde "native" → golmetrik://callback?tokens → DeepLinkHandler → session
```

