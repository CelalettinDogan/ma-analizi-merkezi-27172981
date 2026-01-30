
# Gizlilik Politikası ve Kullanım Şartları Modal Planı

## Özet
Kayıt sayfasındaki Gizlilik Politikası ve Kullanım Şartları linklerini ayrı sayfalara yönlendirmek yerine, mobil uygulamaya uygun şekilde alttan açılan Sheet (drawer) olarak göstereceğiz. Bu sayede kullanıcı kayıt sayfasından ayrılmadan yasal metinleri okuyabilecek.

---

## Değişiklik Planı

### Auth.tsx Güncellemeleri

**Eklenecek State'ler:**
- `showPrivacySheet` - Gizlilik Politikası sheet kontrolü
- `showTermsSheet` - Kullanım Şartları sheet kontrolü

**Değiştirilecek Bileşenler:**
- Mevcut `<Link to="/privacy">` → `<button onClick={() => setShowPrivacySheet(true)}>`
- Mevcut `<Link to="/terms">` → `<button onClick={() => setShowTermsSheet(true)}>`

**Eklenecek Sheet Bileşenleri:**
1. **Gizlilik Politikası Sheet** - Privacy.tsx içeriğini ScrollArea içinde gösterir
2. **Kullanım Şartları Sheet** - Terms.tsx içeriğini ScrollArea içinde gösterir

---

## UI Tasarımı

```text
┌────────────────────────────────────┐
│ Kayıt Formu                        │
│ ...                                │
│ [✓] Gizlilik Politikası ve         │
│     Kullanım Şartları'nı okudum    │
│     ^tıklanınca sheet açılır       │
└────────────────────────────────────┘

      ↓ Gizlilik Politikası tıklandığında

┌────────────────────────────────────┐
│ ━━━━━━━━ (sheet handle)            │
│                                    │
│ Gizlilik Politikası                │
│ ─────────────────────              │
│ Son güncelleme: 25 Ocak 2026       │
│                                    │
│ 1. Veri Toplama                    │
│ Gol Metrik olarak...               │
│ ...                                │
│ (scroll edilebilir içerik)         │
│                                    │
│ [Kapat] butonu                     │
└────────────────────────────────────┘
```

---

## Dosya Değişiklikleri

| Dosya | Değişiklik |
|-------|------------|
| `src/pages/Auth.tsx` | Sheet import, state'ler, sheet bileşenleri, linklerin button'a dönüştürülmesi |

---

## Teknik Detaylar

### 1. Import Eklemeleri
```typescript
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
```

### 2. State Eklemeleri
```typescript
const [showPrivacySheet, setShowPrivacySheet] = useState(false);
const [showTermsSheet, setShowTermsSheet] = useState(false);
```

### 3. Checkbox Label Güncelleme
Mevcut Link bileşenleri, onClick handler'lı button'lara dönüştürülecek:
```tsx
<label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
  <button 
    type="button"
    onClick={() => setShowPrivacySheet(true)} 
    className="text-primary hover:underline"
  >
    Gizlilik Politikası
  </button>
  {' '}ve{' '}
  <button 
    type="button"
    onClick={() => setShowTermsSheet(true)} 
    className="text-primary hover:underline"
  >
    Kullanım Şartları
  </button>
  'nı okudum ve kabul ediyorum.
</label>
```

### 4. Sheet Bileşenleri
Privacy.tsx ve Terms.tsx içeriklerini inline olarak gösterecek iki Sheet:

**Gizlilik Politikası Sheet:**
- SheetContent side="bottom" (alttan açılır)
- 85vh yükseklik (ekranın %85'i)
- ScrollArea ile kaydırılabilir içerik
- Privacy.tsx'deki tüm bölümler

**Kullanım Şartları Sheet:**
- Aynı yapıda
- Terms.tsx'deki tüm bölümler

---

## Avantajları

1. **Mobil UX** - Kullanıcı kayıt sayfasından ayrılmaz
2. **Hızlı Erişim** - Sayfa yüklemesi yok, anında açılır
3. **Google Play Uyumlu** - Yasal metinler uygulama içinde gösteriliyor
4. **Native Hissi** - Sheet/drawer mobil uygulamalarda standart pattern

---

## Uygulama Sırası

1. Auth.tsx'e Sheet importları ekleme
2. State'leri ekleme
3. Link'leri button'lara dönüştürme
4. İki Sheet bileşenini ekleme (Privacy ve Terms içerikleriyle)

---

## Test Senaryoları

- Kayıt formunda "Gizlilik Politikası" tıklama → Sheet açılır, içerik kaydırılabilir
- Sheet'i kapatıp "Kullanım Şartları" tıklama → İkinci sheet açılır
- Sheet açıkken dışarı tıklama → Sheet kapanır
- Checkbox durumu sheet açılıp kapansa bile korunur
