

# Kapsamli Uygulama Guncelleme Plani

## Tespit Edilen Sorunlar

### 1. YANLIS BILGILER - PremiumManagement (Kritik)
`PremiumManagement.tsx` icinde **hardcoded yanlis fiyatlar ve plan key'leri** var:
- Satir 31-49: `basic: 29.99`, `plus: 49.99`, `pro: 79.99` -- Gercek fiyatlar 49, 79, 99 TL
- Plan key'leri `basic`, `plus`, `pro` ama veritabaninda `premium_basic`, `premium_plus`, `premium_pro` -- eslesmez, 0 abone gosterir
- Feature listeleri yanlis: "10 Gunluk Chat" yerine "3 Chat/Gun" olmali

### 2. YANLIS BILGILER - Chatbot Baslik
`Chat.tsx` satir 241: Chatbot header'da **"Gol Asistan"** yaziyor ama memory'ye gore isim **"GolMetrik AI Asistani"** olmali (ai-chatbot edge function'daki system prompt ile uyumlu)

### 3. Admin Paneline Erisim Yok (UserMenu)
Admin kullanicilari profil menusunden admin paneline erisemiyor. `UserMenu.tsx`'te admin linki yok. Plana gore admin, profil ikonuna tikladiginda admin paneline erisebilmeli.

### 4. Admin Paneli Responsive/Native Degil
- `AdminLayout.tsx` sidebar yapisi masaustu odakli, mobilde hamburger menu ile calisiyor ama native Android deneyimi sunmuyor
- Admin sayfasi BottomNav ile cakisiyor (`/admin` route'u `HIDE_BOTTOM_NAV_ROUTES`'a ekli degil)
- Maçlar ve Istatistikler sekmeleri "yakinda" placeholder gosteriyor -- bos sekmeler yerine gizlenmeli

### 5. Chatbot Ekrani Degerlendirmesi
- Chatbot UI genel olarak iyi durumda (native hissiyat, markdown, typing indicator)
- Chatbot cevaplari duzgun calisiyor (test edildi, 200 OK)
- Kucuk iyilestirme: Chat header'daki "Gol Asistan" ismi tutarsiz

### 6. Guvenlik
- RLS politikalari genel olarak saglam (incelendi)
- Admin rol kontrolu `has_role()` SECURITY DEFINER fonksiyonu ile yapiliyor (dogru)
- `profiles` tablosunda admin SELECT politikasi yok -- admin panelinde kullanici listesi gorunmuyor olabilir (RLS "Users can view their own profile" sadece kendi profilini gosteriyor)

---

## Uygulama Plani

### Dosya 1: `src/components/admin/PremiumManagement.tsx`
- `PLAN_PRICES` import edilecek (`accessLevels.ts`'den)
- `planDetails` objesi dogru key'ler (`premium_basic`, `premium_plus`, `premium_pro`) ve dogru fiyatlarla (49, 79, 99 TL) guncellenecek
- Feature listeleri gercek plan bilgileriyle eslestirilecek:
  - Basic: 3 Chat/Gun, Sinirsiz Analiz
  - Plus: 5 Chat/Gun, Sinirsiz Analiz, Oncelikli Destek
  - Pro: 10 Chat/Gun, Sinirsiz Analiz, Oncelikli Destek

### Dosya 2: `src/components/UserMenu.tsx`
- `useUserRole` hook'u import edilecek
- Admin kullanicilari icin "Admin Panel" menu ogesi eklenecek (Shield ikonu ile)
- Sadece `isAdmin === true` oldugunda gorunur olacak

### Dosya 3: `src/App.tsx`
- `/admin` route'unu `HIDE_BOTTOM_NAV_ROUTES` dizisine eklemek (BottomNav cakismasini onlemek)

### Dosya 4: `src/components/admin/AdminLayout.tsx`
- Mobil deneyimi iyilestirmek: sidebar yerine mobilde tab-bazli navigasyon (BottomNav benzeri) kullanmak
- Bos sekmeler (`matches`, `statistics`) kaldirmak veya gizlemek -- navItems dizisinden cikarilacak
- `pt-safe` ve `pb-safe` eklemek

### Dosya 5: `src/pages/Chat.tsx`
- "Gol Asistan" -> "AI Asistan" olarak guncellemek (tutarlilik)

### Dosya 6: `src/pages/Admin.tsx`
- `matches` ve `statistics` case'lerini kaldirmak (bos placeholder yerine temiz yapi)

---

## Degismeyecekler
- Chatbot edge function (`ai-chatbot/index.ts`) -- duzgun calisiyor, dokunulmayacak
- RLS politikalari -- guvenlik saglam, ek migration gerekmiyor (profiles tablosunda admin SELECT icin `has_role` fonksiyonu zaten kullanilabilir, `useAdminData` service_role degil client kullandigina dikkat; ancak profiles tablosu kendi verisini cekiyor `count` ile -- bu calisiyor)
- BottomNav, AuthGuard, AuthContext -- mevcut yapi dogru

## Guvenlik Notu
- Tum admin islemleri RLS + `has_role()` SECURITY DEFINER ile korunuyor
- Admin paneline erisim hem client-side (`useUserRole`) hem de server-side (RLS) kontrolleriyle saglanir
- Yeni tablo veya migration gerekmiyor

