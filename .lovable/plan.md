

## Plan: Live Ekranı — 2026 Native Premium İyileştirmeler

### Mevcut Durum
Live sayfası fonksiyonel olarak sağlam: DB cache'den okuma, 60sn auto-refresh, lig filtresi, boş durum, hata durumu. Ancak UI/UX olarak Home ve Standings sayfalarının gerisinde kaldı.

### İyileştirmeler

---

### 1. LIVE HEADER — Daha Güçlü Görsel Hiyerarşi
**Dosya:** `src/pages/Live.tsx`

- Sayfanın üstüne "Canlı Skorlar" başlığı + son güncelleme zamanı ekle (şu an header'da gizli)
- Canlı maç sayısını badge olarak göster: `3 Maç Devam Ediyor`
- Gecikme banner'ını daha subtle yap: ikon + kısa metin, `bg-amber-500/5` ile daha hafif

### 2. LIG FİLTRESİ — Live Match Count Badge
**Dosya:** `src/pages/Live.tsx`

- `LeagueGrid`'e `liveMatches` prop'u geçir (zaten destekliyor ama geçilmiyor)
- Her lig ikonunun üstünde canlı maç sayısı badge'i gösterilsin

### 3. MATCH CARD — Premium Native Polish
**Dosya:** `src/components/live/LiveMatchCard2.tsx`

- Lig adı ve bayrak → kartın üst satırına daha belirgin yerleştir
- Skor animasyonu: gol olduğunda pulse efekti ekle (zaten var, güçlendir)
- İlk yarı skoru: daha belirgin göster, `HT 1-0` formatında pill badge olarak
- "Hızlı Analiz" CTA → daha belirgin: gradient background, shadow
- Kart hover/active: `shadow-md` → `shadow-lg` geçişi, `active:scale-[0.98]`
- Takım logoları: `ring-1 ring-border/30` ekle, daha polished görünüm
- Maç dakikası: kırmızı pulse dot ile birlikte daha büyük font
- `aria-label` ekle: `"${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}, Canlı"`

### 4. BOŞ DURUM — Daha İyi Empty State
**Dosya:** `src/pages/Live.tsx`

- Mevcut empty state iyi ama dekoratif elementler (blur circles) kaldırılabilir — daha temiz
- "Yaklaşan Maçlara Git" butonunu daha belirgin yap

### 5. LOADING STATE — Skeleton Cards
**Dosya:** `src/pages/Live.tsx`

- Tek spinner yerine 3 adet skeleton match card göster
- Daha native hissi verir, kullanıcı ne bekleyeceğini anlar

### 6. AUTO-REFRESH İNDİKATÖRÜ — Daha Subtle
**Dosya:** `src/pages/Live.tsx`

- "Otomatik güncelleme aktif (60 sn)" → sadece küçük yeşil dot, metin kaldır (zaten belli)

### 7. ACCESSIBILITY
**Dosya:** `src/components/live/LiveMatchCard2.tsx`

- `motion.button`'a `aria-label` ekle
- Skor bölgesine `role="status"` + `aria-live="polite"` ekle (skor değişince screen reader bilgilensin)

---

### Dosya Değişiklikleri

| Dosya | İşlem |
|-------|-------|
| `src/pages/Live.tsx` | Header iyileştirme, skeleton loading, liveMatches prop, subtle refresh indicator |
| `src/components/live/LiveMatchCard2.tsx` | Premium card polish, accessibility, CTA güçlendirme |

Fonksiyonalite değişmez. Sadece UI/UX ve accessibility iyileştirmeleri.

