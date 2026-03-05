

# Google ile Giriş Yap Kaldırma

## Yapılacaklar

### `src/pages/Auth.tsx`
1. `signInWithGoogle` import'unu `useAuth` destructuring'den kaldır (satır 22)
2. `handleGoogleSignIn` fonksiyonunu sil (satır 121-133)
3. Google Sign In butonu ve "veya e-posta ile" divider'ını sil (satır 160-184)
4. Tabs bölümü doğrudan `<div className="flex-1...">` altında başlayacak

### `src/contexts/AuthContext.tsx`
- `signInWithGoogle` fonksiyonu ve `AuthContextType`'dan kaldırılabilir ama native deep link altyapısı başka yerde kullanılıyorsa bozulmaması için **opsiyonel**. Auth.tsx'ten çağrıyı kaldırmak yeterli.

## Değişecek Dosya
- `src/pages/Auth.tsx` — Google butonu, divider ve handler silme

