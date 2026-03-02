

# Google ile Giriş — Native Android'de Çalıştırma

## Mevcut Durum
Kod tarafında bridge mekanizması son düzenlemeyle zaten uygulandı. Akış doğru tasarlanmış:

```text
App → Browser.open(LOVABLE/~oauth/initiate?state=native:xxx)
→ Google Auth → LOVABLE/callback#tokens&state=native:xxx
→ AuthCallback: golmetrik://callback?tokens
→ DeepLinkHandler: setSession + Browser.close()
```

## Eksik Parça: Android Deep Link Konfigürasyonu
`golmetrik://callback` özel URL şemasının Android tarafında tanımlı olması gerekiyor. Bu, `AndroidManifest.xml`'e intent filter eklenerek yapılır. Lovable'dan bu dosya düzenlenemez — Android Studio'da yapılması gereken bir adım.

## Yapılacaklar (Kod Tarafı)

Kod zaten doğru durumda. Ancak iki ek güvenlik iyileştirmesi yapabiliriz:

1. **`AuthContext.tsx`** — `signInWithGoogle` native dalında `isLoading` state'ini `false` yapma (çünkü kullanıcı harici tarayıcıya yönlendiriliyor, loading spinner gereksiz kalıyor)

2. **`Auth.tsx`** — Google buton loading state'ini native'de farklı yönet (tarayıcı açılınca loading'i kapat)

## Senin Yapman Gereken (Android Studio)

`android/app/src/main/AndroidManifest.xml` dosyasına, ana `<activity>` bloğu içine şu intent filter'ı ekle:

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="golmetrik" android:host="callback" />
</intent-filter>
```

Bu eklendikten sonra `golmetrik://callback` linki uygulamayı açacak ve `DeepLinkHandler` token'ları yakalayacak.

## Özet
- Kod tarafı: Küçük UX iyileştirmesi (loading state)
- Android tarafı: Intent filter eklenmesi (kritik, bu olmadan deep link çalışmaz)

