## Plan: Profil Sayfası Çevirisi (Faz 1 — Devam)

### Sorun
İlk i18n kurulumunda sadece **BottomNav + Header (dil seçici)** çevrildi. Profil sayfasındaki tüm metinler hâlâ kod içinde hardcoded Türkçe — bu yüzden dil değiştirildiğinde değişmiyor.

### Yapılacaklar

**1. `profile.json` namespace'ini genişlet (5 dil)**

Mevcut `profile.json` dosyalarına eksik anahtarları ekle — her 5 dil için (tr, en, de, es, ar):
- `guest.*` — giriş yapmamış kullanıcı kartı
- `header.*` — ProfileHeader: "Üye:", "Ücretsiz Kullanıcı", "Günlük Analiz", "AI Asistan", "Sınırsız", "Kapalı", "Analiz Motoru" + açıklama
- `settings.*` — Ayarlar başlık, "Tema", "AI Nasıl Çalışır?", "Gizlilik", "Şartlar", "Hesabı Sil", "Çıkış", versiyon satırı
- `themeSheet.*` — tema seçim drawer'ı (Açık/Koyu/Sistem + açıklamaları)
- `aiInfo.*` — "AI Nasıl Çalışır" drawer içeriği (4 madde + giriş/çıkış + uyarı)
- `deleteAccount.*` — silme drawer'ı (uyarı, 4 madde, "SİL" onay, butonlar, KVKK notu)
- `footer.disclaimer` — sayfa altı uyarı

**2. Üç bileşeni `useTranslation` ile bağla**

| Dosya | Değişiklik |
|-------|------------|
| `src/pages/Profile.tsx` | Hardcoded "Giriş Yapın", "Kullanıcı", "Üye:" stringlerini `t()` çağrılarına dönüştür. `date-fns` locale'i aktif dile göre dinamik yükle (tr/enUS/de/es/ar). |
| `src/components/profile/ProfileHeader.tsx` | "Üye:", "Ücretsiz Kullanıcı", "Admin", "Günlük Analiz", "AI Asistan", "Sınırsız", "Kapalı", "Analiz Motoru" + açıklama → `t()` |
| `src/components/profile/SettingsMenu.tsx` | "Ayarlar", tema etiketleri, "AI Nasıl Çalışır?", "Gizlilik Politikası", "Kullanım Şartları", "Hesabı Sil", "Çıkış Yap", versiyon satırı, tüm sheet içerikleri (tema, AI bilgi, hesap silme) → `t()` |

**3. Hesap Silme Onay Anahtarı**

Şu an `if (deleteConfirmText !== 'SİL')` kontrolü hardcoded. Bunu `t('profile:deleteAccount.confirmKeyword')` ile değiştir — böylece her dilde kendi anahtar kelimesi (DELETE / LÖSCHEN / ELIMINAR / حذف) kabul edilir.

**4. Gizlilik & Kullanım Şartları**

Bu iki sheet uzun yasal metinler içeriyor. Faz 1'de:
- **Sadece başlıklar** çevrilecek ("Gizlilik Politikası", "Kullanım Şartları", "Kapat", "Son güncelleme")
- **Madde içerikleri Türkçe kalacak** (yasal metinler, profesyonel çeviri gerektirir)
- Açıklayıcı not eklenecek: "Bu metinlerin diğer dillerdeki versiyonları yakında eklenecek"

> Faz 2'de yasal metinler ayrıca lokalize edilebilir.

### Kapsam Dışı (Bu Plan)
- Onboarding, Auth, HeroSection, Premium sayfası — sırayla sonraki adımda
- PredictionCard, MatchCard, AnalysisDrawer
- Edge function'ların çok dilli yanıtları
- Yasal metin (Privacy/Terms) tam çevirisi
