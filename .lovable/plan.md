
# Mobil Uygulama 2026 Standardizasyon Planı

## Özet
Profil ekranı, kullanıcı rolleri ve Premium/Free ayrımını 2026 mobil uygulama standartlarına ve Google Play Store politikalarına uygun, net ve profesyonel hale getirme planı.

---

## Mevcut Durum Analizi

### Zaten Doğru Çalışan Öğeler
- **Rol Sistemi**: `useUserRole`, `useAccessLevel`, `usePremiumStatus` hook'ları doğru kurulmuş
- **Plan Limitleri**: `accessLevels.ts` dosyasında Free (2 analiz/gün), Premium Basic (3 chat), Plus (5 chat), Pro (10 chat) tanımlı
- **AI Asistan Erişimi**: Guest → GuestGate, Free → PremiumGate, Premium → Chat akışı mevcut
- **Yasal Metinler**: Auth.tsx ve Profile.tsx'de Sheet olarak gösteriliyor

### Düzeltilmesi Gereken Sorunlar
1. **AI Öğrenme Metni**: Yanıltıcı ifadeler içeriyor ("AI öğreniyor", yüzde gösterimleri)
2. **Profil Eksiklikleri**: Kullanıcı tipi, analiz/chat hakları net gösterilmiyor
3. **Ayarlar Eksik**: Bildirim ayarları, tema seçimi, hesap silme, AI bilgilendirme yok
4. **"Uygulamayı İndir" Kalıntıları**: Herhangi bir yerde olabilir, temizlenmeli
5. **Profile Premium Badge**: Paket detayı ve kalan chat hakkı gösterilmiyor

---

## Değişiklik Planı

### 1. Profile.tsx - Ana Değişiklikler

#### 1.1 AI Öğrenme Bölümü Güncelleme
Mevcut yanıltıcı metin:
```
"AI, istatistiksel analizleri daha doğru yapabilmek için maç verilerinden öğrenmeye devam ediyor."
```

Yeni güvenli metin:
```
"Analiz motoru, en güncel maç verileriyle düzenli olarak iyileştirilmektedir."
```

Progress bar ve "Veri yeterliliği" kaldırılacak, basit bir bilgilendirme metni olacak.

#### 1.2 Kullanıcı Durum Kartı (YENİ)
Profil header'ının altına eklenecek yeni kart:

**Free Kullanıcı için:**
```
┌─────────────────────────────────────┐
│ 👤 Ücretsiz Kullanıcı               │
│ ─────────────────────────────────── │
│ 📊 Günlük Analiz: 2                 │
│ 🤖 AI Asistan: Kapalı               │
│                                     │
│ [Premium'a Geç →]                   │
└─────────────────────────────────────┘
```

**Premium Kullanıcı için:**
```
┌─────────────────────────────────────┐
│ 👑 Premium Plus                     │
│ ─────────────────────────────────── │
│ 📊 Analiz: Sınırsız                 │
│ 🤖 AI Asistan: 3/5 kaldı            │
│                                     │
│ 15 gün kaldı • Yıllık plan          │
└─────────────────────────────────────┘
```

#### 1.3 Ayarlar Bölümü Genişletme
Mevcut ayarlar bölümüne eklenecekler:

```
┌─────────────────────────────────────┐
│ ⚙️ Ayarlar                          │
│ ─────────────────────────────────── │
│ 🔔 Bildirim Ayarları           →    │
│ 🎨 Tema                    [Sistem] │
│ 🤖 AI Nasıl Çalışır?            →   │
│ 💎 Premium Paketleri Gör        →   │
│ 🗑️ Hesabı Sil                   →   │
│ 🚪 Çıkış Yap                        │
└─────────────────────────────────────┘
```

#### 1.4 Yeni Sheet Bileşenleri
- **Bildirim Ayarları Sheet**: Maç hatırlatıcı, sonuç bildirimleri toggle'ları
- **Tema Seçimi Sheet**: Açık/Koyu/Sistem seçenekleri
- **AI Bilgilendirme Sheet**: AI'ın nasıl çalıştığını açıklayan güvenli metin
- **Hesap Silme Sheet**: GDPR uyumlu hesap silme onay akışı

---

### 2. Dosya Değişiklikleri Özeti

| Dosya | Değişiklik |
|-------|------------|
| `src/pages/Profile.tsx` | Ana güncelleme - Kullanıcı durum kartı, ayarlar genişletme, sheet'ler |
| `src/hooks/useAnalysisLimit.ts` | Kalan analiz için export ekleme (zaten mevcut) |
| `src/hooks/useChatbot.ts` | Kalan chat için usage export (zaten mevcut) |

---

## Teknik Detaylar

### Profile.tsx - Import Eklemeleri
```typescript
import { Bell, Palette, HelpCircle, Trash2, AlertTriangle } from 'lucide-react';
import { useAnalysisLimit } from '@/hooks/useAnalysisLimit';
import { useAccessLevel } from '@/hooks/useAccessLevel';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTheme } from 'next-themes';
```

### Yeni State'ler
```typescript
const [showNotificationSheet, setShowNotificationSheet] = useState(false);
const [showThemeSheet, setShowThemeSheet] = useState(false);
const [showAIInfoSheet, setShowAIInfoSheet] = useState(false);
const [showDeleteAccountSheet, setShowDeleteAccountSheet] = useState(false);
const [deleteConfirmText, setDeleteConfirmText] = useState('');
```

### Kullanıcı Durum Kartı Bileşeni
```typescript
const {
  isPremium,
  planDisplayName,
  dailyAnalysisLimit,
  dailyChatLimit,
  hasUnlimitedAnalyses,
  canUseAIChat,
  shouldShowPurchaseCTA,
  isGuest
} = useAccessLevel();

const { remaining: analysisRemaining, usageCount: analysisUsed } = useAnalysisLimit();
```

### AI Bilgilendirme Sheet İçeriği (Güvenli Metin)
```
📊 Analiz Motoru Hakkında

Gol Metrik, maç analizleri için istatistiksel modeller kullanmaktadır:

• Takım performans verileri
• H2H (kafa kafaya) istatistikleri
• Lig sıralama bilgileri
• Form analizleri

Analiz motoru, en güncel maç verileriyle düzenli olarak iyileştirilmektedir.

⚠️ Önemli: Sunulan analizler bilgilendirme amaçlıdır ve kesin kazanç garantisi vermez.
```

### Hesap Silme Akışı (GDPR Uyumlu)
```typescript
const handleDeleteAccount = async () => {
  if (deleteConfirmText !== 'SİL') return;
  
  // 1. Kullanıcı verilerini sil
  await supabase.from('predictions').delete().eq('user_id', user.id);
  await supabase.from('favorites').delete().eq('user_id', user.id);
  await supabase.from('chat_history').delete().eq('user_id', user.id);
  
  // 2. Hesabı sil
  const { error } = await supabase.auth.admin.deleteUser(user.id);
  
  // 3. Çıkış yap ve yönlendir
  await signOut();
  navigate('/');
};
```

### Tema Seçimi (next-themes entegrasyonu)
```typescript
const { theme, setTheme } = useTheme();

// Sheet içinde
<RadioGroup value={theme} onValueChange={setTheme}>
  <RadioGroupItem value="light" id="light">Açık</RadioGroupItem>
  <RadioGroupItem value="dark" id="dark">Koyu</RadioGroupItem>
  <RadioGroupItem value="system" id="system">Sistem</RadioGroupItem>
</RadioGroup>
```

---

## Kaldırılacaklar

### AI Öğrenme Status Kartı
- Progress bar kaldırılacak
- "Veri yeterliliği: Orta" gibi yanıltıcı metinler kaldırılacak
- Yerine basit bilgilendirme metni gelecek

### Kontrol Edilecek "Uygulamayı İndir" Kalıntıları
Arama yapılacak dosyalar:
- `src/components/premium/*`
- `src/pages/*`

---

## Tasarım Özellikleri

### Renk Kullanımı
- **Free Badge**: `bg-muted text-muted-foreground`
- **Premium Basic**: `bg-emerald-500/20 text-emerald-600`
- **Premium Plus**: `bg-primary/20 text-primary`
- **Premium Pro**: `bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-600`
- **Admin**: `bg-amber-500/20 text-amber-600`

### Touch Target Boyutları
- Tüm butonlar minimum `h-11` (44px)
- Sheet içindeki öğeler `p-4` padding

---

## Test Senaryoları

1. **Free Kullanıcı Profili**:
   - "Ücretsiz Kullanıcı" etiketi görünür
   - "Günlük Analiz: 2", "Chatbot: Kapalı" gösterilir
   - "Premium'a Geç" CTA görünür

2. **Premium Plus Kullanıcı Profili**:
   - "Premium Plus" badge görünür
   - "Analiz: Sınırsız" gösterilir
   - Kalan chat hakkı gösterilir (örn: "3/5 kaldı")
   - Kalan gün sayısı gösterilir

3. **Ayarlar İşlevselliği**:
   - Tema değişikliği çalışır ve kayıt edilir
   - AI Bilgilendirme sheet'i açılır
   - Hesap silme onay akışı çalışır

4. **AI Öğrenme Bölümü**:
   - Yeni güvenli metin gösterilir
   - Yanıltıcı progress bar yok
   - Yüzde gösterimi yok

---

## Uygulama Sırası

1. Profile.tsx'e yeni import'lar ve state'ler ekleme
2. AI Öğrenme bölümünü güvenli metinle güncelleme
3. Kullanıcı Durum Kartı ekleme
4. Ayarlar bölümünü genişletme
5. Yeni Sheet bileşenlerini ekleme (Bildirim, Tema, AI Info, Hesap Sil)
6. Premium CTA'yı koşullu gösterme
7. "Uygulamayı indir" kalıntılarını arama ve temizleme

---

## Notlar

- Database'de `user_roles` ve `premium_subscriptions` tabloları zaten mevcut
- `useAccessLevel` hook'u tüm erişim kontrollerini merkezi yönetiyor
- Hesap silme işlemi için Supabase Auth Admin API gerekebilir (edge function üzerinden)
- Bildirim ayarları şimdilik UI only olacak (push notification entegrasyonu ayrı bir iş)
