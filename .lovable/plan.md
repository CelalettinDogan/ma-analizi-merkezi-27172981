
# Kayıt Sözleşme Onayı ve Hakkında Bölümü Planı

## Özet
Kullanıcı kayıt formuna zorunlu Gizlilik Politikası ve Kullanım Şartları onay checkbox'ı eklenecek, Profil sayfasındaki Ayarlar bölümüne "Hakkında" alt bölümü eklenerek bu yasal sayfalara erişim sağlanacak.

---

## Yapılacak Değişiklikler

### 1. Auth.tsx - Kayıt Formuna Zorunlu Onay Checkbox'ı

**Eklenecekler:**
- `termsAccepted` state'i (boolean, default: false)
- Checkbox bileşeni - tıklanabilir Gizlilik Politikası ve Kullanım Şartları linkleriyle
- Checkbox işaretlenmeden "Kayıt Ol" butonu disabled olacak
- Hata mesajı gösterimi (checkbox işaretlenmeden form gönderilmeye çalışılırsa)

**UI Tasarımı:**
```text
[ ] Gizlilik Politikası ve Kullanım Şartları'nı okudum ve kabul ediyorum.
     ^tıklanabilir linkler
```

**Validasyon:**
- `handleRegister` fonksiyonunda checkbox kontrolü
- Checkbox false ise toast ile uyarı ve form gönderimi engelleme

---

### 2. Profile.tsx - Hakkında Bölümü Ekleme

**Eklenecekler:**
- Ayarlar kartının altına yeni "Hakkında" kartı
- İçerik:
  - Uygulama versiyonu (1.0.0)
  - Gizlilik Politikası linki (→ /privacy)
  - Kullanım Şartları linki (→ /terms)
  - Bilgilendirme disclaimer'ı

**UI Yapısı:**
```text
┌─────────────────────────────────┐
│ ℹ️ Hakkında                      │
├─────────────────────────────────┤
│ Gol Metrik v1.0.0               │
│ AI destekli futbol analizi      │
│                                 │
│ 📄 Gizlilik Politikası     →    │
│ 📋 Kullanım Şartları       →    │
│                                 │
│ ⚠️ Sunulan analizler            │
│ bilgilendirme amaçlıdır,        │
│ kesin kazanç garantisi vermez.  │
└─────────────────────────────────┘
```

---

## Dosya Değişiklikleri

| Dosya | Değişiklik |
|-------|------------|
| `src/pages/Auth.tsx` | termsAccepted state, Checkbox import, kayıt formuna checkbox ekleme, validasyon |
| `src/pages/Profile.tsx` | Info ve FileText icon import, Hakkında kartı ekleme |

---

## Teknik Detaylar

### Auth.tsx Değişiklikleri

1. **Import eklemeleri:**
   - `Checkbox` from `@/components/ui/checkbox`
   - `Link` zaten mevcut

2. **State ekleme:**
```typescript
const [termsAccepted, setTermsAccepted] = useState(false);
```

3. **Validasyon güncelleme:**
```typescript
const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!termsAccepted) {
    toast({
      title: 'Onay Gerekli',
      description: 'Devam etmek için Gizlilik Politikası ve Kullanım Şartları\'nı kabul etmelisiniz.',
      variant: 'destructive',
    });
    return;
  }
  // ... mevcut kod
};
```

4. **Checkbox UI (şifre alanından sonra):**
```tsx
<div className="flex items-start gap-3 pt-2">
  <Checkbox 
    id="terms" 
    checked={termsAccepted} 
    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
    className="mt-0.5"
  />
  <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
    <Link to="/privacy" className="text-primary hover:underline">Gizlilik Politikası</Link>
    {' '}ve{' '}
    <Link to="/terms" className="text-primary hover:underline">Kullanım Şartları</Link>
    'nı okudum ve kabul ediyorum.
  </label>
</div>
```

5. **Buton disabled durumu:**
```tsx
<Button 
  type="submit" 
  disabled={isLoading || !termsAccepted}
>
```

### Profile.tsx Değişiklikleri

1. **Import eklemeleri:**
   - `Info, FileText` from `lucide-react`

2. **Hakkında kartı (Ayarlar kartından sonra):**
```tsx
<motion.div variants={itemVariants}>
  <Card className="glass-card">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Info className="h-5 w-5 text-primary" />
        Hakkında
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="text-center pb-2">
        <p className="font-semibold">Gol Metrik</p>
        <p className="text-xs text-muted-foreground">Versiyon 1.0.0</p>
        <p className="text-xs text-muted-foreground mt-1">
          AI destekli futbol analiz platformu
        </p>
      </div>
      
      <div className="space-y-2">
        <Button 
          variant="ghost" 
          className="w-full justify-between h-11" 
          onClick={() => navigate('/privacy')}
        >
          <span className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Gizlilik Politikası
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-between h-11" 
          onClick={() => navigate('/terms')}
        >
          <span className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Kullanım Şartları
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
      
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          ⚠️ Sunulan analizler bilgilendirme amaçlıdır ve kesin kazanç garantisi vermez.
        </p>
      </div>
    </CardContent>
  </Card>
</motion.div>
```

---

## Uygulama Sırası

1. `src/pages/Auth.tsx` - Checkbox ve validasyon ekleme
2. `src/pages/Profile.tsx` - Hakkında bölümü ekleme

---

## Test Senaryoları

- Kayıt formunda checkbox işaretlemeden kayıt denemesi → hata mesajı
- Checkbox işaretleyip kayıt → başarılı
- Profil > Hakkında > Gizlilik Politikası tıklama → /privacy sayfası açılır
- Profil > Hakkında > Kullanım Şartları tıklama → /terms sayfası açılır
