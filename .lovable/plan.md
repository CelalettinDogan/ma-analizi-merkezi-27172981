
## Günün Skoru — Premium Merak ve Dönüşüm Optimizasyonu

### 1. Teaser Bilgi Gösterimi (Free Kullanıcılar)
- Maç ismini açık göster (ör. "Dortmund vs Bayern") — merak uyandırmak için maçın ne olduğunu bilmeleri lazım
- Skor tahminini **blur** ile göster (`blur-sm` overlay) — "görebiliyorsun ama okuyamıyorsun" etkisi
- Güven yüzdesini blur'lu göster — yüksek bir rakam seçildiğinde daha da merak uyandırır

### 2. Görsel Upgrade — Premium Hissiyat
- Amber gradient border yerine subtle **shimmer animation** (CSS keyframe, soldan sağa akan ışık efekti)
- Arka plan: `bg-gradient-to-r from-amber-500/8 via-amber-500/4 to-amber-500/8`
- Sol kenar: 2px kalın amber accent bar (diğer satırlardan farklılaştırma)
- Sparkles ikonu üzerinde hafif `animate-pulse` efekti

### 3. CTA Güçlendirme (Free Kullanıcılar)
- "Premium ile Gör" yerine daha çekici: **"Skoru Aç"** veya **"Tahmine Bak"**
- CTA'yı küçük bir amber filled badge/chip olarak göster (`bg-amber-500/20 text-amber-500 rounded-full px-2.5 py-0.5`)
- Lock ikonunu CTA chip'in içine taşı

### 4. Premium Kullanıcı Detay Paneli İyileştirme
- Genişleme panelinde takım logolarını (crest) göster
- Güven yüzdesini radial progress ile göster (mini ring)
- Tahmin tipini ve değerini daha vurgulu card'da sun

### 5. Dosya Değişiklikleri
- `src/components/TodaysMatches.tsx` — dailyPickRowEl bloğunu yeniden tasarla
- `src/index.css` — shimmer keyframe animasyonu ekle (varsa mevcut olanı kullan)
- Locale dosyaları — CTA metinlerini güncelle (tr/en/de/es/ar)
