
# Varsayilan Tema ve BottomNav Titreme Sorunu Cozumu

## Sorun 1: Varsayilan tema dark
`App.tsx` icindeki `ThemeProvider` bileseninde `defaultTheme="dark"` olarak ayarli. Bu `"light"` olarak degistirilecek.

## Sorun 2: BottomNav hala titriyor
Onceki fix (`useRef` ile stabil liste koruma) calismiyordu cunku BottomNav her sayfanin icinde ayri ayri render ediliyor. Sayfa gecislerinde BottomNav unmount olup tekrar mount oluyor, bu da `useRef`'i sifirliyor ve hook'lar `isLoading: true` ile baslayarak flash'a neden oluyor.

### Cozum
BottomNav'i her sayfadan cikarip, `AppContent` bileseninde (Routes disinda, BrowserRouter icinde) tek bir yerde render etmek. Boylece sayfa gecislerinde BottomNav hic unmount olmayacak, hook state'i korunacak ve titreme tamamen onlenecek.

## Yapilacak Degisiklikler

### Dosya 1: `src/App.tsx`
- `ThemeProvider` icinde `defaultTheme="dark"` yerine `defaultTheme="light"` yapilacak
- `AppContent` bilesenine BottomNav eklenmesi (Routes'un disinda, BrowserRouter icinde)
- Auth sayfasi ve bazi ozel sayfalarda BottomNav gizlenecek (konum kontrolu ile)

### Dosya 2-8: Her sayfadan BottomNav kaldirilacak
Asagidaki dosyalardan BottomNav import'u ve kullanimi silinecek:
- `src/pages/Index.tsx`
- `src/pages/Live.tsx`
- `src/pages/Standings.tsx`
- `src/pages/Premium.tsx`
- `src/pages/Profile.tsx`
- `src/pages/Chat.tsx`

### AppContent'teki Yeni Yapi

```text
BrowserRouter
  +-- DeepLinkHandler
  +-- ErrorBoundary
  |     +-- Routes (sayfa icerikleri)
  +-- BottomNav (Routes disinda, her zaman mount, konum bazli gizleme)
```

BottomNav icinde `useLocation` kontrolu ile `/auth`, `/reset-password`, `/terms`, `/privacy`, `/delete-account` sayfalarinda gizlenecek.

## Teknik Detaylar

- BottomNav artik hic unmount olmayacagi icin `useAccessLevel` hook'u sadece bir kez calisacak ve state korunacak
- `useRef` cozumu de artik dogru calismaya baslayacak cunku ref kaybolmayacak
- `onSearchClick` prop'u kaldirilacak (CommandPalette her sayfanin kendi icinde kalacak)
- Tema degisikligi aninda uygulanacak, mevcut kullanicilarin tercihi localStorage'dan gelecek
