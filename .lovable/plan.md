
# Hesap Silme Bağlantısı Ekleme Planı

## Google Play Store Gereksinimi
Google Play Store, uygulamaların kullanıcıların hesap ve veri silme taleplerini yapabilecekleri bir web bağlantısı sağlamasını zorunlu kılıyor. Bu bağlantı Play Console'a girilecek.

## Mevcut Durum
| Bileşen | Durum |
|---------|-------|
| Profil'de "Hesabı Sil" butonu | ✅ Mevcut |
| delete-account Edge Function | ✅ Mevcut |
| Privacy sayfasında silme bölümü | ⚠️ Eksik |
| Ayrı hesap silme sayfası | ❌ Eksik |

## Yapılacak Değişiklikler

### 1. Yeni Sayfa: `/delete-account`
Web erişilebilir bir hesap silme talebi sayfası oluşturulacak:

- **Giriş yapmış kullanıcılar:** Doğrudan hesap silme işlemi yapabilir
- **Giriş yapmamış kullanıcılar:** Giriş yapması için yönlendirme

Sayfa içeriği:
- Silme işleminin geri alınamayacağı uyarısı
- Silinecek veriler listesi (profil, analiz geçmişi, chat geçmişi, abonelikler)
- "SİL" yazarak onay mekanizması
- İptal talebi için alternatif (email ile)

### 2. Privacy Sayfası Güncellemesi
"Hesap ve Veri Silme" başlığı altında yeni bölüm:

```text
10. Hesap ve Veri Silme

Hesabınızı ve tüm ilişkili verilerinizi silmek istiyorsanız:

Yöntem 1 - Uygulama İçi:
Profil > Ayarlar > Hesabı Sil

Yöntem 2 - Web:
[Hesap Silme Talebi] sayfasından işlem yapabilirsiniz.

Silme işlemi şunları kapsar:
- Profil bilgileriniz
- Analiz geçmişiniz
- Chat geçmişiniz
- Premium abonelik kayıtlarınız
- Tüm kullanım verileri

Not: Premium aboneliğiniz varsa, önce Google Play Store'dan iptal etmeniz önerilir.
```

### 3. App.tsx Route Ekleme
```text
<Route path="/delete-account" element={<DeleteAccount />} />
```

### 4. Google Play Console URL
Play Console'a girilecek URL:
```text
https://[preview-url]/delete-account
```

---

## Yeni Dosya: `src/pages/DeleteAccount.tsx`

Sayfa özellikleri:
- Mobil uyumlu tasarım
- Auth kontrolü (giriş gerekli)
- Mevcut delete-account Edge Function kullanımı
- GDPR/KVKK uyumlu açıklamalar
- Onay mekanizması (SİL yazma)
- Başarı sonrası yönlendirme

---

## Değiştirilecek Dosyalar

| Dosya | İşlem |
|-------|-------|
| `src/pages/DeleteAccount.tsx` | Yeni oluştur |
| `src/pages/Privacy.tsx` | Hesap silme bölümü ekle |
| `src/App.tsx` | Route ekle |

---

## Güvenlik

- Hesap silme işlemi auth token ile korunuyor
- Edge function service role ile silme yapıyor
- Kullanıcı onayı zorunlu (SİL yazma)
- İşlem geri alınamaz

---

## Teknik Detaylar

### DeleteAccount Sayfası Yapısı
```text
DeleteAccount.tsx
├── Auth kontrolü (useAuth)
├── Giriş yapılmamışsa → Auth sayfasına yönlendir
├── Giriş yapılmışsa:
│   ├── Uyarı kartı (geri alınamaz)
│   ├── Silinecek veriler listesi
│   ├── SİL yazma input
│   ├── Silme butonu
│   └── İptal butonu
└── Silme sonrası → Ana sayfaya yönlendir
```

### Privacy Sayfası Güncellemesi
Mevcut bölümlere "10. Hesap ve Veri Silme" eklenir:
- Uygulama içi yöntem açıklaması
- Web linki
- Silinecek veriler
- Abonelik iptali uyarısı
