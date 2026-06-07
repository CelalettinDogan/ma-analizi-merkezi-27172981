# Dünya Kupası Heyecan Modu — Empty State Yenileme

## Amaç
"Bugünün Maçları" ve "Yaklaşan Maçlar" bölümleri boş kaldığında kullanıcı sönük bir "maç yok" mesajı görmesin. Yerine **FIFA Dünya Kupası 2026 geri sayımı** ve atmosferik bir kart görünsün — kullanıcı turnuva heyecanını hissetsin.

## Kapsam
Sadece **frontend / görsel** değişiklik. Backend, sync, tahmin motoru aynı kalır.

## Yapılacaklar

### 1. Yeni bileşen: `src/components/home/WorldCupHypeCard.tsx`
Boş state yerine gösterilecek özel kart. İçeriği:

- **Arka plan**: Emerald → Amber yumuşak gradient + ince grid/particle dokusu (Magic UI `Particles` veya hafif `AnimatedGridPattern`, performans dostu)
- **Üst rozet**: 🏆 "FIFA Dünya Kupası 2026" — pulse animasyonlu küçük nokta
- **Başlık (büyük)**: "Dünya Kupası başlıyor"
- **Geri sayım**: 11 Haziran 2026 18:00'a kadar **GG : SS : DD : SN** — `setInterval` ile 1 sn'de bir güncellenen 4 büyük rakam bloğu, monospace font, kartlar arası "•" ayraç
- **Alt satır**: "104 maç • 48 takım • 12 grup • Meksika, ABD, Kanada"
- **CTA**: "Dünya Kupası maçlarını gör" → `onClick` ile `selectedLeague`'i `'WC'` yapar (parent'tan prop ile gelir)
- **Mikro animasyon**: framer-motion ile fade-in + hafif float; CTA `whileTap scale 0.96`

Turnuva başladıktan sonra (≥ 11 Haziran) kart otomatik olarak **"Dünya Kupası devam ediyor — bugün X maç"** moduna geçer ve geri sayım yerine "Canlı yayında" rozeti gösterir.

### 2. Entegrasyon noktaları
İki yer:

- **`src/components/TodaysMatches.tsx`** — bugünün maçı 0 olduğunda mevcut `EmptyState`/"Planlanmış maç bulunamadı" bloğu yerine `<WorldCupHypeCard variant="today" onSelectWC={...} />` render et. WC zaten seçiliyse normal empty state göster (sonsuz döngü olmasın).
- **`src/components/UpcomingMatches.tsx`** — `matches.length === 0` dalında aynı kart, `variant="upcoming"`. Varyant sadece başlık/CTA metnini ufak değiştirir.

Parent (`Index.tsx` / `useHomeData` tüketicisi) `onLeagueSelect('WC')` callback'ini iletecek — mevcut `selectedLeague` setter'ı zaten var, sadece prop drilling.

### 3. i18n
Tüm metinler `src/i18n/locales/{tr,en,es,de,ar}/home.json` içine yeni `worldCup` anahtarı altında:
```
worldCup: {
  badge, title, subtitleCountdown, subtitleLive,
  days, hours, minutes, seconds,
  meta: "104 maç • 48 takım • 12 grup",
  cta: "Dünya Kupası maçlarını gör",
  liveBadge: "Turnuva devam ediyor"
}
```

### 4. Tasarım tokenları
Yeni renk YOK. Mevcut `--primary` (emerald) ve hero glow'daki amber (`hsl(45 70% 50%)`) tonları kullanılır. Gradient `index.css`'e `--gradient-worldcup` olarak eklenir, kart bunu tüketir — design system uyumlu.

## Teknik Notlar
- Geri sayım hedefi: `new Date('2026-06-11T18:00:00Z')` sabit
- `useEffect` cleanup ile `setInterval` temizliği
- Kart yüksekliği ~260px, mobile-first (390px viewport'ta tüm rakamlar tek satırda kalır)
- Particles dahil tüm efektler `prefers-reduced-motion` kontrolüne saygı duyar
- Touch standartları (memory): `user-select: none`, `touch-manipulation`

## Dosya Özeti
- **Yeni**: `src/components/home/WorldCupHypeCard.tsx`
- **Düzenle**: `TodaysMatches.tsx`, `UpcomingMatches.tsx`, 5 dil `home.json`, `index.css` (1 gradient değişkeni)
- **Hariç**: backend, sync, prediction engine, bracket UI (Phase 2)

Tahmini süre: ~15 dakika.
