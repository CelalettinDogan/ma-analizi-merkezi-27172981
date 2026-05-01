# "İnternet bağlantısı yok" yanlış pozitifini düzelt

## Sorun
`src/hooks/useOnlineStatus.ts` sadece tarayıcının `navigator.onLine` değerine ve `online`/`offline` event'lerine güveniyor. Android WebView'de bu sinyal güvenilmez:
- Wi-Fi ↔ mobil veri geçişi anlık `offline` event üretir
- Uygulama arka plandan ön plana dönerken kısa süreli `false` dönebilir
- Captive portal / VPN durumlarında yanlış sonuç verir
- Bazen `navigator.onLine` `false` kalıp güncellenmez

Sonuç: gerçekte internet varken `OfflineBanner` gösteriliyor.

## Çözüm

`useOnlineStatus` hook'unu üç katmanlı doğrulamayla yeniden yaz:

1. **Capacitor `@capacitor/network` plugin'i** native platformda birincil kaynak olarak kullan (Android'de `navigator.onLine`'dan çok daha doğru). Web'de `navigator.onLine`'a düş.
2. **Aktif ping doğrulaması**: Bir `offline` sinyali geldiğinde hemen banner gösterme — Supabase URL'ine `HEAD` (no-cors) isteği at, başarısız olursa offline kabul et.
3. **Debounce (2.5 sn)**: Kısa flicker'ları yok say. Sadece 2.5 sn boyunca offline kalırsa banner göster. `online` sinyali anında uygulansın.
4. **Periyodik recheck**: Offline durumdayken 10 sn'de bir ping atarak otomatik geri dön.

## Yapılacaklar

### 1. `@capacitor/network` paketini ekle
```
bun add @capacitor/network
```

### 2. `src/hooks/useOnlineStatus.ts` yeniden yaz
- Mount'ta hem `Network.getStatus()` (native) hem `navigator.onLine` ile başlangıç durumunu al
- `Network.addListener('networkStatusChange', ...)` + `window` online/offline event'leri
- Yardımcı `verifyConnection()`: `fetch(SUPABASE_URL + '/auth/v1/health', { method: 'HEAD', cache: 'no-store' })` — 3 sn timeout, başarılıysa online
- Offline'a düşmeden önce `verifyConnection` çalıştır
- 2.5 sn debounce timer
- Offline'dayken 10 sn'de bir tekrar dene
- Capacitor olmayan ortamda dinamik import ile graceful fallback

### 3. `src/components/OfflineBanner.tsx` (küçük iyileştirme)
- Banner'a "Tekrar dene" butonu ekle → manuel `verifyConnection` çağırır
- Görünme threshold'u zaten hook tarafında halledildiği için ek değişiklik gerekmez

### 4. Capacitor sync
Değişiklik sonrası kullanıcıya `npx cap sync android` çalıştırması gerektiğini hatırlat (yeni native plugin eklendiği için).

## Teknik detaylar

**Ping endpoint seçimi**: Supabase'in `/auth/v1/health` endpoint'i her zaman 200 döner ve CORS açıktır, ekstra cost yok. Alternatif: `VITE_SUPABASE_URL` root'una HEAD.

**Timeout**: 3 sn — yavaş 3G'de bile yeterli, kullanıcıyı bekletmez.

**Cleanup**: `useEffect` cleanup'ta tüm listener'ları, timer'ları ve interval'ları temizle.

## Etkilenen dosyalar
- `src/hooks/useOnlineStatus.ts` (yeniden yazma)
- `src/components/OfflineBanner.tsx` (retry butonu)
- `package.json` (yeni dependency)
