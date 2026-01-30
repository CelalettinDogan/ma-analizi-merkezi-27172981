
# Profil Sayfası Düzeltme Planı

## Tespit Edilen Sorunlar ve Çözümler

### 1. Tema Senkronizasyonu Sorunu (KRİTİK)

**Sorun:**
- `Profile.tsx` dosyası `next-themes`'den `useTheme` hook'unu kullanıyor
- Ancak `App.tsx` dosyasında `ThemeProvider` tanımlı değil
- `ThemeToggle.tsx` ise kendi özel `golmetrik-theme` localStorage key'ini kullanıyor
- Bu iki sistem birbiriyle senkronize değil

**Çözüm:**
- `App.tsx`'e `next-themes`'den `ThemeProvider` ekleme
- `ThemeToggle.tsx`'i `next-themes` kullanacak şekilde güncelleme
- Böylece hem header'daki tema butonu hem de Profile'daki tema sheet'i aynı sistemi kullanacak

---

### 2. "Premium'a Geç" Butonu Yanlış Yönlendirme (ORTA)

**Sorun:**
```typescript
// Satır 338 - Profile.tsx
onClick={() => navigate('/profile')}
```
Kullanıcı zaten Profile sayfasında, kendine yönlendiriyor.

**Çözüm:**
- Premium section'a scroll yapması gerekiyor
- `document.getElementById('premium-section')?.scrollIntoView({ behavior: 'smooth' })` kullanılacak

---

### 3. Premium Section ID Eksik (ORTA)

**Sorun:**
- Profile sayfasında PremiumUpgrade bileşeni gösterildiği karta `id="premium-section"` eklenmemiş

**Çözüm:**
- Premium kartına `id="premium-section"` ekleme

---

### 4. PremiumUpgrade Web Hatası (DÜŞÜK)

**Sorun:**
```typescript
// Satır 98-99 - PremiumUpgrade.tsx
} else {
  toast.error('Web üzerinden satın alma yapılamaz. Mobil uygulamayı kullanın.');
}
```
Bu mesaj mobil ortamda geliştirme sırasında bile tetikleniyor.

**Çözüm:**
- Bu kodu kaldırıp, sadece native platform için çalışacak şekilde düzenleme
- Development ortamında test için simülasyon ekleme veya sessizce geçme

---

### 5. Bildirim Ayarları Kalıcı Değil (DÜŞÜK - UI ONLY)

**Sorun:**
- Bildirim ayarları sadece state'te tutuluyor, sayfa yenilenince kaybolur

**Çözüm (Şimdilik):**
- localStorage'a kaydetme
- İleride database'e taşınabilir

---

## Değiştirilecek Dosyalar

| Dosya | Değişiklik |
|-------|------------|
| `src/App.tsx` | ThemeProvider ekleme |
| `src/components/ThemeToggle.tsx` | next-themes kullanacak şekilde güncelleme |
| `src/pages/Profile.tsx` | Premium buton yönlendirmesi + section ID + notification persist |
| `src/components/premium/PremiumUpgrade.tsx` | Web hatası kaldırma |

---

## Teknik Detaylar

### App.tsx Değişikliği
```typescript
import { ThemeProvider } from 'next-themes';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        {/* ... mevcut içerik */}
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
```

### ThemeToggle.tsx Değişikliği
```typescript
import { useTheme } from 'next-themes';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';
  
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };
  
  // ... rest of component
};
```

### Profile.tsx - Premium Buton Düzeltmesi
```typescript
// Mevcut:
onClick={() => navigate('/profile')}

// Yeni:
onClick={() => {
  document.getElementById('premium-section')?.scrollIntoView({ 
    behavior: 'smooth' 
  });
}}
```

### Profile.tsx - Notification Settings Persistence
```typescript
// useEffect ile localStorage'dan yükleme
useEffect(() => {
  const saved = localStorage.getItem('notification-settings');
  if (saved) {
    setNotificationSettings(JSON.parse(saved));
  }
}, []);

// onChange'de kaydetme
const updateNotificationSetting = (key: string, value: boolean) => {
  const newSettings = { ...notificationSettings, [key]: value };
  setNotificationSettings(newSettings);
  localStorage.setItem('notification-settings', JSON.stringify(newSettings));
};
```

### PremiumUpgrade.tsx - Web Hatası Kaldırma
```typescript
// Mevcut (satır 98-100):
} else {
  toast.error('Web üzerinden satın alma yapılamaz. Mobil uygulamayı kullanın.');
}

// Yeni:
} else {
  // Development/preview ortamında sessizce geç
  console.log('Purchase simulation - native platform required for real purchases');
}
```

---

## Uygulama Sırası

1. `App.tsx`'e ThemeProvider ekleme
2. `ThemeToggle.tsx`'i next-themes ile güncelleme
3. `Profile.tsx`'de Premium buton yönlendirmesini düzeltme
4. `Profile.tsx`'de Premium section'a ID ekleme
5. `Profile.tsx`'de bildirim ayarlarını localStorage'a kaydetme
6. `PremiumUpgrade.tsx`'deki web hatasını kaldırma

---

## Sonuç

Bu değişiklikler sonrasında:
- Tema değişikliği her yerden senkronize çalışacak
- "Premium'a Geç" butonu doğru yere scroll yapacak
- Bildirim ayarları sayfa yenilemelerinde korunacak
- Gereksiz hata mesajları gösterilmeyecek
