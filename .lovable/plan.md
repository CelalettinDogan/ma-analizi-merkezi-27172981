

# Google Play Store Satın Alma Entegrasyonu

## Mevcut Durum

Backend tamam: `verify-purchase` ve `play-store-webhook` edge function'ları zaten hazır. Eksik olan tek sey istemci tarafinda gercek Google Play Billing API baglantisi. Su an `purchaseService.ts` icinde sadece placeholder kod var ve "Native satin alma eklentisi kurulu degil" hatasi donuyor.

## Cozum: @capgo/native-purchases

Bu eklenti Capacitor 8 ile tam uyumlu, ucretsiz ve Google Play Billing 7.x kullaniyor. RevenueCat gibi ucuncu parti servis gerektirmiyor - dogrudan Google Play ile konusuyor.

## Satin Alma Akisi

```text
Kullanici "Premium'a Gec" butonuna basar
        |
        v
purchaseService.purchaseSubscription(productId)
        |
        v
NativePurchases.purchaseProduct(productId)
  (Google Play satin alma ekrani acilir)
        |
        v
Basarili olursa purchaseToken alinir
        |
        v
verify-purchase Edge Function cagirilir
  (Google Play API ile dogrulama)
        |
        v
premium_subscriptions tablosuna kayit
        |
        v
Kullanici Premium olur
```

## Yapilacak Degisiklikler

### 1. Paket Kurulumu
`@capgo/native-purchases` paketi projeye eklenecek.

### 2. purchaseService.ts - Tam Yeniden Yazim
Mevcut placeholder kodlar gercek eklenti cagrilariyla degistirilecek:

- `initialize()`: Eklentiyi baslatir, urunleri yukler
- `getProducts()`: Google Play'den gercek fiyatlari ceker (kullanicinin bolgesine gore dinamik fiyat)
- `purchaseSubscription()`: Gercek satin alma akisini baslatir, basarili olursa `verify-purchase` edge function'a purchaseToken gonderir
- `restorePurchases()`: Onceki satin alimlari geri yukler ve backend'e dogrulama gonderir

### 3. Premium.tsx - Kucuk Guncelleme
`handlePurchase` fonksiyonu zaten `purchaseService.purchaseSubscription()` cagiriyor, bu yuzden buyuk degisiklik gerekmez. Sadece basarili satin alma sonrasi `refetch()` cagrisi eklenerek premium durumu anlik guncellenecek.

### 4. App Baslangicinda Initialization
`App.tsx` veya `main.tsx` icinde uygulama acildiginda `purchaseService.initialize()` cagirilacak.

## Yerel Kurulum (Sizin Yapmaniz Gerekenler)

Degisiklikler uygulandiktan sonra terminalde:

```text
git pull
npm install
npm run build
npx cap sync
npx cap run android
```

## Onemli: Google Play Console Gereksinimleri

Satin alma butonlarinin calismasi icin Google Play Console'da su adimlarin tamamlanmis olmasi gerekir:

1. Uygulamanin en az bir kez dahili test (internal testing) olarak yuklenmiş olmasi
2. Play Console'da "Abonelikler" bolumunde su urun ID'lerinin olusturulmus olmasi:
   - `premium_basic_monthly`
   - `premium_basic_yearly`
   - `premium_plus_monthly`
   - `premium_plus_yearly`
   - `premium_pro_monthly`
   - `premium_pro_yearly`
3. Bir "base plan" ve fiyatlandirma tanimlanmis olmasi
4. Lisanslı test kullanicilari eklenmis olmasi (test satin alimlari icin)

## Teknik Detaylar

Degisecek dosyalar:
- `package.json` - @capgo/native-purchases eklenmesi
- `src/services/purchaseService.ts` - Gercek billing entegrasyonu
- `src/pages/Premium.tsx` - Basarili satin alma sonrasi refetch
- `src/App.tsx` - Uygulama baslatma sirasinda initialize

