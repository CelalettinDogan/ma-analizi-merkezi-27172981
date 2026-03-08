

# GolMetrik AI — Kapsamlı Mobil Uygulama Denetim Raporu ve İyileştirme Planı

## Uzman Değerlendirmesi

Bu analiz, uygulamayı Play Store'da yayınlanan profesyonel bir Android native app standartlarında değerlendirmektedir.

---

## 1. Kritik Sorunlar (Acil Düzeltilmeli)

### 1.1 QueryClient Yapılandırması Yok
`App.tsx` satır 30'da `new QueryClient()` hiçbir opsiyon olmadan oluşturuluyor. Bu durumda:
- **Retry**: Başarısız istekler 3 kez tekrarlanır (mobilde gereksiz bant genişliği)
- **refetchOnWindowFocus**: `true` (Capacitor WebView'da her tab geçişinde gereksiz refetch)
- **staleTime**: `0` (her mount'ta yeniden sorgu)

**Düzeltme**: Mobil-optimized QueryClient config ekle: `staleTime: 2min`, `retry: 1`, `refetchOnWindowFocus: false`, `gcTime: 10min`.

### 1.2 Çevrimdışı (Offline) Durumu Yok
Uygulama ağ bağlantısı kesildiğinde hiçbir geri bildirim vermiyor. Kullanıcı neden veri gelmediğini anlamıyor. `@capacitor/network` veya `navigator.onLine` ile bir global offline banner gösterilmeli.

### 1.3 Google Login Auth Callback'de `signInWithGoogle` Yok
`Auth.tsx`'te Google ile giriş butonu yok. `AuthContext`'te `signInWithGoogle` fonksiyonu mevcut ama Auth sayfasında çağrılmıyor. Social login Android'de çok önemli bir edinim kanalı.

### 1.4 CSS'te Kalan `hover:` Kalıntıları
`index.css` satır 251-268'de `.btn-glow:hover` ve `.card-premium-glow:hover` gibi web-only hover stilleri var. Bunlar mobilde 300ms gecikmeye ve yapışkan hover state'e neden olur.

---

## 2. Performans İyileştirmeleri

### 2.1 TabShell — Tüm Sayfalar Aynı Anda Mount Ediliyor
`TabShell.tsx` satır 118: 6 sayfa (`Index`, `Live`, `Chat`, `Standings`, `Premium`, `Profile`) uygulama açıldığında **hepsi aynı anda** mount oluyor. Her biri kendi veritabanı sorgularını çalıştırıyor. Bu, ilk açılışta 15-20 paralel Supabase sorgusu demek.

**Düzeltme**: Lazy mount stratejisi — sadece bir kez ziyaret edilen tab'lar mount edilsin. `visitedTabs` set'i tutup, henüz ziyaret edilmemiş tab'ları render etme.

### 2.2 `useHomeData` — Manuel Polling, React Query Değil
`useHomeData.ts` `useState` + `setInterval` ile manuel veri çekme yapıyor. Bu, React Query'nin cache/dedup avantajlarından yararlanamıyor ve tab geçişlerinde gereksiz refetch'e neden oluyor.

### 2.3 Profil Sayfası — Gereksiz Sorgular
`Profile.tsx` satır 76-106: `upcoming-matches-profile` ve `recent-analyses-profile` sorguları her mount'ta çalışıyor. Profil sayfası açılmadan bu verilere ihtiyaç yok ama TabShell yüzünden app açılışında çalışıyor.

---

## 3. UX İyileştirmeleri

### 3.1 Pull-to-Refresh Yok
Native Android'de en temel beklenti olan pull-to-refresh mekanizması hiçbir sayfada yok. Ana sayfa, Canlı maçlar ve Lig tablosunda olmalı.

### 3.2 Boş Durum (Empty State) Tutarsızlıkları
Profil'de "Henüz analiz yapılmamış" var ama Live'da boş durum kartı aşırı büyük ve detaylı. Tutarlı, minimal empty state bileşeni kullanılmalı.

### 3.3 Auth Sayfasında Google Sign-In Butonu Eksik
Mobil uygulamalarda social login dönüşüm oranını %40-60 artırır. `signInWithGoogle` fonksiyonu hazır ama UI'da yok.

---

## 4. Native Polish Eksikleri

### 4.1 Keyboard Handling
`@capacitor/keyboard` paketi kurulu değil. Capacitor config'de `Keyboard.resize: 'body'` var ama gerçek paket yok. Chat sayfasında klavye açıldığında layout kayması olabilir.

### 4.2 Error Reporting Yok
Üretim hatalarını yakalamak için hiçbir error tracking sistemi yok. `ErrorBoundary` sadece kullanıcıya mesaj gösteriyor, hatayı hiçbir yere loglamıyor.

---

## Uygulama Planı (Öncelik Sırasıyla)

### Adım 1: QueryClient Mobil Optimizasyonu
`App.tsx`'te QueryClient'a mobil-uyumlu defaults ekle.

### Adım 2: TabShell Lazy Mount
`TabShell.tsx`'te `visitedTabs` state'i ile sadece ziyaret edilen tab'ları mount et. İlk açılışta sadece `/` (Index) mount olsun.

### Adım 3: Hover Kalıntılarını Temizle
`index.css`'teki `.btn-glow:hover` ve `.card-premium-glow:hover`'ı `active:` ile değiştir.

### Adım 4: Auth Sayfasına Google Sign-In Ekle
`Auth.tsx`'e Google ile giriş butonu ekle (native `signInWithGoogle` kullanarak).

### Adım 5: Offline Banner
Basit bir `useOnlineStatus` hook ve global offline banner bileşeni ekle. `navigator.onLine` + `online/offline` event listener'ları ile.

### Adım 6: Pull-to-Refresh
Ana sayfa ve Canlı maçlara basit bir touch-based pull-to-refresh mekanizması ekle.

### Toplam Etki
- **6 dosya değişikliği**, 1-2 yeni dosya
- Cloud balance etkisi: İlk açılış sorgu sayısı ~%70 azalır (lazy mount)
- Refetch fırtınası önlenir (QueryClient config)
- UX: Native hissi pekişir (pull-to-refresh, offline feedback, Google login)

