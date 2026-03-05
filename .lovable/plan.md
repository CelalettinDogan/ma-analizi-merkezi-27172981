

# 3 Sorunun Düzeltme Planı

## 1. Profil — Bildirim Ayarlarını Kaldır (`Profile.tsx`)
- `showNotificationSheet` state'i, `notificationSettings` state'i ve `updateNotificationSetting` fonksiyonunu sil
- Ayarlar bölümündeki "Bildirim Ayarları" butonunu (satır ~429-432) kaldır
- Notification Settings Sheet bileşenini (satır ~476-511) tamamen sil
- `Bell` import'unu ve `Switch` import'unu (başka yerde kullanılmıyorsa) kaldır
- localStorage'daki `golmetrik-notification-settings` referanslarını temizle

## 2. Lig Sayfası — "Puan Durumu" Tab Metninin İç İçe Girmesi (`Standings.tsx`)
Sorun satır 173'te: `<span className="hidden xs:inline">Puan</span> Durumu` — "Puan" kelimesi xs altında gizleniyor ama "Durumu" her zaman gösteriliyor, dar ekranlarda metin taşıyor.

Düzeltme:
- Tab text'lerini tek parça olarak yazıp responsive kısaltma kullan:
  - `standings`: xs altında "Puan" göster, xs ve üstünde "Puan Durumu"
  - `goals`: xs altında "Goller" göster, xs ve üstünde "Gol İstatistik"
  - `form`: xs altında "Form" göster, xs ve üstünde "Form Analiz"
- `TabsTrigger` içinde iki ayrı span kullanarak birini `hidden xs:inline`, diğerini `xs:hidden inline` yap

## 3. Chat Input — Karakter Sayacı Yazıyla Çakışıyor (`ChatInput.tsx`)
Sorun: `absolute bottom-2.5 right-14` konumundaki sayaç, kullanıcı yazı yazdığında textarea içeriğiyle örtüşüyor.

Düzeltme:
- Sayacı textarea'nın dışına, textarea ile send butonu arasına veya textarea'nın altına taşı
- Textarea'ya `pr-12` yerine normal padding ver, sayacı `absolute` yerine textarea container'ının altında ayrı bir satırda göster
- Alternatif: Sayacı textarea'nın üstüne (sağ üst köşe) taşı — `bottom-2.5` → `top-1 right-2` ve daha küçük font

## Değişecek Dosyalar (3)
1. `src/pages/Profile.tsx` — Bildirim ayarları kaldırma
2. `src/pages/Standings.tsx` — Tab text responsive fix
3. `src/components/chat/ChatInput.tsx` — Karakter sayacı pozisyon düzeltme

