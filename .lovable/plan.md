

# Chatbot ve Onboarding Kapsamli Duzeltme Plani

## Tespit Edilen Sorunlar ve Cozumleri

### 1. MESAJ SIRALAMA HATASI (Kritik)

**Sorun:** Edge function'da (`ai-chatbot/index.ts` satir 1212-1215) kullanici ve asistan mesajlari TEK bir batch INSERT ile kaydediliyor. Her iki satir ayni `created_at` timestamp'ini aliyor. Tekrar girildiginde `loadHistory` (satir 1067-1072) `created_at DESC` ile siralayinca ayni timestamp'li mesajlar rastgele siralaniyor -- bu yuzden bazi mesajlar yer degistiriyor.

**Cozum:** Edge function'da iki ayri INSERT yapmak yerine, `created_at` degerlerini acikca belirlemek:
- User mesaji: `new Date().toISOString()`
- Assistant mesaji: `new Date(Date.now() + 1000).toISOString()` (1 saniye sonra)

Bu sekilde sira her zaman dogru olur.

### 2. CHAT INPUT POZISYONU

**Sorun:** Chat sayfasinda `main` elementinde `pb-24` var (BottomNav icin) ama `/chat` sayfasinda BottomNav gosterilmemeli. Ayrica ChatInput'un her zaman ekranin en altinda sabit durmasi gerekiyor.

**Cozum:**
- `Chat.tsx`: `pb-24 md:pb-0` kaldirilacak, yerine `pb-0` kullanilacak
- ChatInput'u `main` disina cikarip sabit altta konumlandirmak
- `/chat` route'unu `HIDE_BOTTOM_NAV_ROUTES`'a eklemek (`App.tsx`)
- ChatContainer icinde mesaj alani icin `pb-safe` eklemek

### 3. ONBOARDING SADECE YENI KULLANICILAR ICIN

**Sorun:** `useOnboarding` hook'u localStorage kullanarak `golmetrik_onboarding_completed` key'ini kontrol ediyor. Her yeni cihaz/tarayicida tekrar gosteriyor. Kullanici her giris yaptiginda (farkli cihaz, cache temizleme) onboarding tekrar cikiyor.

**Cozum:** localStorage + user kayit tarihi kontrolu:
- Kullanici giris yaptiginda, `user.created_at` kontrol edilecek
- Eger kullanici son 5 dakika icinde kayit olduysa VE localStorage'da onboarding gorulmediyse -> goster
- Eger kullanici daha onceden kayit olmussa (>5 dakika) -> gosterme ve localStorage'i "completed" olarak isaretle
- Bu sekilde sadece YENi kayit olan kullanicilar gorur, mevcut kullanicilar hic gormez

### 4. TITRME VE ANIMASYON SORUNLARI

**Sorun:** Chat header'daki `motion.header` her renderda `fadeInUp` animasyonu calisiyor. Bu sayfa giriside ve her state degisikliginde gereksiz animasyon olusturuyor.

**Cozum:**
- Header'dan `{...fadeInUp}` animasyonunu kaldirmak (sabit header olmali)
- "Yaziyor..." animasyonunu daha stabil hale getirmek
- ChatContainer'daki coklu setTimeout scroll mekanizmasini sadeleştirmek

---

## Dosya Degisiklikleri

### Dosya 1: `supabase/functions/ai-chatbot/index.ts`
- Satir 1212-1215: Batch INSERT yerine acik `created_at` timestamp'leri ile INSERT
- User mesaji: `now`, Assistant mesaji: `now + 1 saniye`

### Dosya 2: `src/pages/Chat.tsx`
- Header'dan `{...fadeInUp}` animasyonunu kaldirmak
- `main` elementinden `pb-24` kaldirmak
- ChatInput'u `main` disina cikarip sabit alt pozisyona almak
- UsageMeter'i da `main` disina cikarip ChatInput'un ustune koymak
- Layout: header (sticky top) + main (flex-1 overflow-auto) + footer (sticky bottom: usage + input)

### Dosya 3: `src/App.tsx`
- `HIDE_BOTTOM_NAV_ROUTES` dizisine `/chat` eklemek

### Dosya 4: `src/hooks/useOnboarding.ts`
- `useAuth` hook'unu import etmek
- `user.created_at` kontrol mantigi eklemek
- Kullanici 5 dakikadan once kayit olmussa -> onboarding gosterme
- Kullanici yeni kayit olmussa VE localStorage'da "completed" degilse -> goster

### Dosya 5: `src/components/chat/ChatContainer.tsx`
- Scroll mekanizmasini sadeleştirmek (5 farkli timeout yerine tek `requestAnimationFrame`)
- Mesaj listesinin altina yeterli padding eklemek

---

## Cloud Etkisi
- Edge function'da sadece INSERT ifadesi degisiyor, ek sorgu yok
- Yeni tablo veya migration gerekmiyor
- Edge function yeniden deploy edilecek

