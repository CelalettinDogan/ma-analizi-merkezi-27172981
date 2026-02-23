
# Chat Scroll Fix + Onboarding Tekrar Gosterme Sorunu

## Sorun 1: Chat Ekrani Asagidan Baslamiyor

**Sebep:** `ChatContainer.tsx` satir 246-257'deki scroll mekanizmasi `scrollIntoView({ block: 'end' })` kullaniyor. Bu, son mesaji gorunur alana getiriyor ama konteynerin tam altina scroll etmiyor. Ayrica `hasScrolledRef` kontrolu bazi durumlarda ilk scroll'u engelleyebiliyor.

**Cozum (`src/components/chat/ChatContainer.tsx`):**
- `scrollToLastMessage` fonksiyonunu degistir: `scrollIntoView` yerine `containerRef.current.scrollTop = containerRef.current.scrollHeight` kullan (daha guvenilir)
- Mesajlar yüklendiginde ve her yeni mesajda container'in tam altina scroll et
- Initial scroll icin ek bir `useEffect` ekle: component mount oldugunda ve messages degistiginde her zaman alta scroll etsin
- `lastMessageRef` sonrasi bos bir `div` (spacer/anchor) ekle, ona scroll yap

**Detay:**
```text
// Mevcut (sorunlu):
lastMessageRef.current.scrollIntoView({ block: 'end', behavior })

// Yeni (guvenilir):
containerRef.current.scrollTop = containerRef.current.scrollHeight
```

## Sorun 2: Onboarding Her Giriste Gozukuyor

**Sebep:** `useOnboarding` hook'u `localStorage` kullaniyor. Bu, tarayici oturumu kapandiginda (veya preview ortaminda) sifirlanabiliyor. Kullanici giris yaptiginda bile localStorage bosalabilir.

**Cozum:** Onboarding durumunu veritabanina (profiles tablosuna) bagla. Kullanici hesap olusturdugunda `onboarding_completed = false`, onboarding tamamlandiginda `true` olarak guncelle. Boylece hangi cihazdan veya tarayicidan girerse girsin, onboarding sadece bir kez gosterilir.

**Degisiklikler:**

### Dosya 1: Veritabani Migration
- `profiles` tablosuna `onboarding_completed BOOLEAN DEFAULT false` kolonu ekle

### Dosya 2: `src/hooks/useOnboarding.ts`
- `useAuth` hook'unu import et
- Giris yapilmissa: `profiles` tablosundan `onboarding_completed` degerini oku
- `completeOnboarding`: hem `profiles` tablosunu guncelle hem localStorage'a yaz (offline fallback)
- Giris yapilmamissa: localStorage fallback'i kullan (mevcut davranis)
- Her iki kaynagi da kontrol et: eger biri `true` ise onboarding gosterme

### Dosya 3: `src/components/chat/ChatContainer.tsx`
- `scrollToLastMessage` fonksiyonunu `scrollTop = scrollHeight` ile degistir
- Son mesajin altina bos anchor div ekle
- Initial scroll effect'ini daha agresif hale getir

## Degisecek Dosyalar

| Dosya | Degisiklik |
|-------|-----------|
| Migration (yeni) | `profiles` tablosuna `onboarding_completed` kolonu |
| `src/hooks/useOnboarding.ts` | DB-backed onboarding durumu + localStorage fallback |
| `src/components/chat/ChatContainer.tsx` | Scroll mekanizmasi duzeltmesi |

## Cloud Etkisi
- Tek bir boolean kolon ekleniyor (minimal)
- Onboarding durumu profil sorgusuyla birlikte geliyor (ek sorgu yok)
- Chat scroll degisikligi tamamen client-side
