
# Zorunlu Kimlik Doğrulama Sistemi

## Mevcut Durum

Şu anda uygulama şu şekilde çalışıyor:
- **Guest (Giriş yapmamış)**: Ana sayfayı, canlı maçları, puan durumunu görüntüleyebiliyor. Sadece analiz ve AI Chat için kısıtlama var.
- **Free**: Giriş yapmış, günde 2 analiz hakkı, AI Chat erişimi yok
- **Premium**: Sınırsız analiz, AI Chat erişimi var
- **Admin**: Tüm erişimler sınırsız

## İstenen Değişiklik

Tüm içerikler için giriş/kayıt zorunlu olacak:
- **Guest kullanıcılar hiçbir şey göremesin**
- Ana sayfa, canlı maçlar, puan durumu, profil gibi tüm sayfalar korunmalı
- Sadece `/auth`, `/terms`, `/privacy` ve `/delete-account` sayfaları açık kalmalı

---

## Teknik Yaklaşım

### 1. AuthGuard Bileşeni Oluştur

Yeni bir `AuthGuard` bileşeni oluşturacağız. Bu bileşen:
- Kimlik doğrulama durumunu kontrol eder
- Giriş yapılmamışsa Auth sayfasına yönlendirir
- Yükleme durumunda loading spinner gösterir

```typescript
// src/components/auth/AuthGuard.tsx
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};
```

### 2. App.tsx Route Yapısını Güncelle

Korumalı route'ları AuthGuard ile sarmalayacağız:

```typescript
// Korumalı sayfalar
<Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
<Route path="/live" element={<AuthGuard><Live /></AuthGuard>} />
<Route path="/standings" element={<AuthGuard><Standings /></AuthGuard>} />
<Route path="/premium" element={<AuthGuard><Premium /></AuthGuard>} />
<Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
<Route path="/chat" element={<AuthGuard><Chat /></AuthGuard>} />
<Route path="/analysis-history" element={<AuthGuard><AnalysisHistory /></AuthGuard>} />

// Açık sayfalar (kimlik doğrulama gerektirmeyen)
<Route path="/auth" element={<Auth />} />
<Route path="/reset-password" element={<ResetPassword />} />
<Route path="/terms" element={<Terms />} />
<Route path="/privacy" element={<Privacy />} />
<Route path="/delete-account" element={<DeleteAccount />} />
```

### 3. Auth.tsx Yönlendirme Mantığı

Kullanıcı zaten giriş yapmışsa Auth sayfasından ana sayfaya yönlendirme:

```typescript
// Auth.tsx içinde
const { user } = useAuth();
const location = useLocation();

useEffect(() => {
  if (user) {
    const from = location.state?.from || '/';
    navigate(from, { replace: true });
  }
}, [user, navigate, location.state]);
```

---

## Dosya Değişiklikleri

| Dosya | İşlem |
|-------|-------|
| `src/components/auth/AuthGuard.tsx` | Yeni - Route koruması |
| `src/App.tsx` | Güncelle - Korumalı route'lar |
| `src/pages/Auth.tsx` | Güncelle - Redirect mantığı |

---

## Kullanıcı Deneyimi Akışı

```text
Uygulama Açılış
      │
      ▼
┌─────────────────┐
│ AuthGuard Check │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 [Giriş    [Giriş
  Yok]     Var]
    │         │
    ▼         ▼
┌────────┐ ┌────────────┐
│ /auth  │ │ İçerik    │
│ Sayfası│ │ Gösterilir │
└────────┘ └────────────┘
```

---

## Önemli Notlar

1. **Döngüsel Yönlendirme Önleme**: Auth sayfası AuthGuard dışında kalacak
2. **State Koruma**: Yönlendirme öncesi konum `location.state.from` ile saklanacak
3. **Loading UX**: Kimlik doğrulama kontrolü sırasında kullanıcı dostu spinner gösterilecek
4. **Deep Link Desteği**: Kullanıcı giriş yaptıktan sonra orijinal hedef sayfaya yönlendirilecek

