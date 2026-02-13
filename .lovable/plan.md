
# Toast Suresi, Cikis Sorunu ve Auth Sayfasi Iyilestirmesi

## Sorunlar

### 1. Toast'lar kapanmiyor
`use-toast.ts` dosyasinda `TOAST_REMOVE_DELAY = 1000000` (yaklasik 16 dakika). Bu yuzden toast bildirimleri ekranda kaliyor. 2 saniyeye dusurulecek.

### 2. Cikis yap calismiyordu (Native Android)
`handleSignOut` fonksiyonunda sira hatasi var: once `signOut()` cagriliyor, sonra hemen `navigate('/')` yapiliyor. Ama `/` rotasi `AuthGuard` ile korunuyor. `signOut` tamamlanmadan navigate olunca, AuthGuard hala eski session'i goruyor ve kullaniciyi iceri aliyor. Ardindan state guncellense bile sayfa yeniden render edilmiyor.

Cozum: `signOut()` icinde state'i hemen temizleyip, navigate'i `/auth` sayfasina yonlendirmek. Boylece AuthGuard'a takilma riski ortadan kalkar.

### 3. Auth sayfasi native gorunumlu olmali
Mevcut kart tabanli tasarim yerine, tam ekran, koyu arkaplanli, mobil-ilk bir tasarima gecilecek. Logo buyutulecek, Google butonu one cikarilacak, genel gorunum Android uygulamalarina uygun olacak.

## Yapilacak Degisiklikler

### Dosya 1: `src/hooks/use-toast.ts`
- `TOAST_REMOVE_DELAY` degeri `1000000` yerine `2000` (2 saniye) yapilacak

### Dosya 2: `src/contexts/AuthContext.tsx`
- `signOut` fonksiyonunda `supabase.auth.signOut()` oncesinde `setUser(null)` ve `setSession(null)` cagirilarak state aninda temizlenecek
- Boylece `onAuthStateChange` callback'i gelmeden once bile UI dogru sekilde guncellenir

### Dosya 3: `src/components/UserMenu.tsx`
- `handleSignOut` icinde `navigate('/')` yerine `navigate('/auth', { replace: true })` kullanilacak
- Toast bildirimi kaldirilacak (gereksiz dialog yok, cikis zaten auth sayfasina yonlendiriyor)

### Dosya 4: `src/pages/Profile.tsx`
- `handleSignOut` icinde `navigate('/')` yerine `navigate('/auth', { replace: true })` kullanilacak

### Dosya 5: `src/pages/Auth.tsx`
- Tam ekran, native Android gorunumlu yeniden tasarim:
  - Card yapisi kaldirilacak, icerigi dogrudan ekrana yayilacak
  - Logo alani buyutulecek (ikon + isim + slogan)
  - Google ile Giris butonu daha belirgin, renkli ve buyuk olacak (Material Design tarzi)
  - "veya e-posta ile" ayirici korunacak
  - Tab'lar (Giris/Kayit) daha kompakt, alt kisimda yer alacak
  - Input alanlari daha buyuk touch target'a sahip olacak (h-12)
  - Genel padding ve bosluklar mobil icin optimize edilecek
  - Arkaplan gradient veya subtle pattern eklenecek

## Teknik Detaylar

- `signOut` race condition cozumu: State'i senkron olarak temizleyip, async Supabase cagrisini arka planda yapmak. Bu, React'in hemen re-render yapmasini saglar ve AuthGuard kullaniciyi aninda `/auth`'a yonlendirir.
- Toast suresi: Radix Toast Provider'a `duration` prop'u da eklenecek, boylece hem remove delay hem de gorsel sure 2 saniye olacak.
- Auth sayfasi: Glass-card efekti kaldirilip, dogrudan koyu arkaplan uzerine beyaz/acik text ile native hissi verilecek.
