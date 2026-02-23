
# Native Tab Navigation - Sayfalari Cache'de Tutma

## Mevcut Sorun

Simdi her sekme degistiginde React Router ilgili sayfayi tamamen unmount edip yenisini mount ediyor. Bu:
- Her geciste beyaz flash ve layout shift yapiyor
- Veri her seferinde yeniden fetch ediliyor
- Scroll pozisyonu kayboluyor
- WebView'da "web hissi" veriyor, native hissi vermiyor

## Cozum: Tab Shell Mimarisi

Ana fikir: 6 ana sekme sayfasini ayni anda mount et, sadece aktif olani goster. Route degistiginde unmount etme, CSS ile gizle.

```text
TabShell (hep mount)
  ├── [display: aktif] Index
  ├── [display: none]  Live
  ├── [display: none]  Chat
  ├── [display: none]  Standings
  ├── [display: none]  Premium
  └── [display: none]  Profile

Diger sayfalar (Auth, Admin, vb.) normal Route olarak kalir.
```

## Teknik Detaylar

### 1. Yeni Dosya: `src/components/navigation/TabShell.tsx`

Bu bilesen:
- 6 tab sayfasini ayni anda render eder (AuthGuard icinde)
- Aktif tab'i `useLocation().pathname` ile belirler
- Aktif olmayan tab'lari `display: none` ile gizler (DOM'da kalir, state korunur)
- Tab degistiginde 0.2s fade + translateY(4px) animasyonu oynatir
- Her tab icin scroll pozisyonunu ref ile saklar
- Tab'dan cikarken `scrollTop` kaydeder, tab'a girerken restore eder

Animasyon yaklasiimi: Her tab div'ine `opacity` ve `transform` transition uygula. Aktif olana `opacity: 1, translateY(0)`, gizliye `opacity: 0, translateY(4px)` ver. CSS transition ile 200ms'de gecis yap. Framer Motion KULLANILMAYACAK (DOM'dan cikarma riski var), saf CSS transition tercih edilecek.

### 2. Dosya Degisikligi: `src/App.tsx`

`AppContent` icindeki Routes yapisini degistir:
- Tab sayfalari (`/`, `/live`, `/chat`, `/standings`, `/premium`, `/profile`) icin `TabShell` kullan
- Diger sayfalar (`/auth`, `/admin`, `/callback`, vb.) normal `<Route>` olarak kalir
- `TabShell` sadece kullanici giris yapmissa render edilir (AuthGuard mantigi TabShell icinde)
- URL hala React Router ile senkronize kalir (browser geri/ileri calisir)

Yeni yapi:
```text
<BrowserRouter>
  <Routes>
    {/* Tab olmayan sayfalar - normal route */}
    <Route path="/auth" element={<Auth />} />
    <Route path="/admin" element={<AuthGuard><Admin /></AuthGuard>} />
    <Route path="/callback" element={<AuthCallback />} />
    ...
  </Routes>

  {/* Tab sayfalari - hep mount, CSS ile gizle/goster */}
  <TabShell />

  <GlobalBottomNav />
</BrowserRouter>
```

### 3. Dosya Degisikligi: `src/components/navigation/BottomNav.tsx`

`<Link>` yerine `useNavigate()` ile programatik navigasyon kullan. Bu sayede React Router sayfa remount tetiklemez, sadece URL degisir ve TabShell aktif tab'i gunceller.

### 4. Scroll Pozisyonu Koruma

TabShell icinde her tab icin bir `scrollPositionRef` Map'i tutulacak:
- Tab'dan cikarken: `scrollContainerRef.scrollTop` degerini kaydet
- Tab'a girerken: Kaydedilen degeri `scrollTop`'a ata
- Bu sekilde kullanici her tab'a dondugunde ayni yerde kalir

### 5. Veri Cache Stratejisi

React Query zaten veriyi cache'liyor ama sayfalar unmount olunca hook'lar da unmount oluyor. TabShell ile hook'lar mount kaldigi icin:
- `useHomeData` verileri bellekte kalir, tekrar fetch gerekmez
- Live sayfasinin interval'i arka planda calisir (performans icin tab aktif degilken interval'i durdur)
- Standings verileri lig degismediginde tekrar cekilmez

Optimizasyon: Aktif olmayan tab'lardaki interval/timer'lari durdurmak icin TabShell'den her sayfaya `isActive` prop'u gecilebilir. Ancak bu ilk asama icin opsiyonel - sayfalar zaten hafif sorgular yapiyor.

### 6. Beyaz Flash Onleme

- Tum tab'lar bastan mount oldugu icin ilk acilista kisa bir loading suresi olacak
- Ancak sonraki tum gecisler anlik olacak (0 ms mount suresi)
- `bg-background` her tab container'ina uygulanarak beyaz flash engellenir
- CSS transition ile opacity 0'dan 1'e gectigi icin icerik "pop-in" yapmaz

## Degisecek Dosyalar

| Dosya | Degisiklik |
|-------|-----------|
| `src/components/navigation/TabShell.tsx` | Yeni: Tab shell + scroll restore + fade animasyon |
| `src/App.tsx` | Routes yapisini TabShell ile degistir |
| `src/components/navigation/BottomNav.tsx` | Link yerine navigate kullan |

## Etkilenmeyen Seyler

- Admin, Auth, Terms, Privacy, vb. sayfalar aynen kalir
- React Query cache mantigi degismez
- AuthGuard mantigi TabShell icine tasinir (tek bir guard, 6 sayfa icin)
- DeepLinkHandler, BackButton handler aynen calisir
- BottomNav gizleme mantigi (HIDE_BOTTOM_NAV_ROUTES) aynen kalir

## Sonuc

- Sekme gecisleri 0ms (mount yok, sadece CSS toggle)
- 0.2s fade + slight translateY animasyonu
- Scroll pozisyonu korunur
- Veri tekrar fetch edilmez
- Beyaz flash ve layout shift tamamen kalkacak
- Native iOS/Android tab bar davranisi
