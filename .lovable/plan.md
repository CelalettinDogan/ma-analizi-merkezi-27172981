
# Google OAuth Callback 404 Hatasi Duzeltme

## Sorun

Google ile giris sonrasi Lovable Cloud OAuth, kullaniciyi `https://golmetrik.app/callback` adresine yonlendiriyor. Capacitor bu URL'yi web app icinde acmaya calisiyor. Ancak React Router'da `/callback` route'u tanimli degil, bu yuzden catch-all `*` route devreye giriyor ve 404 sayfasi gosteriliyor.

`DeepLinkHandler` yalnizca Capacitor'in `appUrlOpen` event'ini dinliyor. Ama OAuth redirect web view icinde gerceklesiyor, bu yuzden `appUrlOpen` tetiklenmiyor.

## Cozum

### Dosya 1: `src/pages/AuthCallback.tsx` (yeni dosya)

OAuth callback sayfasi olustur:
- URL hash ve search params'dan `access_token` ve `refresh_token` cikart
- `supabase.auth.setSession()` ile oturumu baslat
- Basarili ise ana sayfaya (`/`) yonlendir
- Hata durumunda `/auth` sayfasina yonlendir
- Yukleme sirasinda spinner goster

### Dosya 2: `src/App.tsx`

- `AuthCallback` bilesenini import et
- Routes icine `/callback` route'u ekle (acik sayfa olarak, AuthGuard olmadan)
- `HIDE_BOTTOM_NAV_ROUTES` listesine `/callback` ekle

## Teknik Detaylar

```text
OAuth akisi (duzeltilmis):
1. Kullanici "Google ile Giris" tiklar
2. lovable.auth.signInWithOAuth -> Google consent ekrani acilir
3. Basarili giris -> https://golmetrik.app/callback#access_token=...&refresh_token=...
4. Capacitor web view /callback route'unu render eder
5. AuthCallback bileseni token'lari parse eder
6. supabase.auth.setSession() cagirilir
7. Kullanici ana sayfaya yonlendirilir
```

| Dosya | Degisiklik |
|-------|-----------|
| `src/pages/AuthCallback.tsx` | Yeni: OAuth token'larini isleme ve session baslama |
| `src/App.tsx` | `/callback` route ekleme, BottomNav gizleme listesine ekleme |
