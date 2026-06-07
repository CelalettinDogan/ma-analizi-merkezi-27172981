# WC Sekmesi — Stadyum / Yayın Yönü Uygulaması

Seçilen yön: **v1 Stadyum / Yayın**. Mevcut `/live` sekmesi tamamen Dünya Kupası 2026 hub'ına dönüştürülecek. Alt navigasyondaki adı **WC**, ikonu **Trophy** olacak.

## Kapsam
Sadece frontend. Backend/sync zaten WC'yi destekliyor (önceki oturum). Bu plan rota, tasarım sistemi (dark Emerald/Amber) ve veri akışını koruyarak yalnızca `/live` sayfasını ve bottom nav'ı değiştirir.

## Komposizyon Sırası (prototipten birebir)
1. **Hero Banner** — koyu gradient kart, sol üstte pulse kırmızı nokta + "CANLI YAYIN" / "TURNUVA YAKINDA", büyük başlık `DÜNYA KUPASI 2026`, alt satır `Final Yolu • ABD • MEX • KAN`, sağda düşük opaklı kupa silüeti.
2. **Stage Chip Selector** — yatay scroll chip'ler: `Tümü • Grup A…L • Son 16 • Çeyrek • Yarı • Final`. Seçili olan dolu primary, diğerleri çerçeveli.
3. **Ongoing Matches** başlık + canlı maç sayısı rozeti → canlı maç kartı (takım bayrak/logo, skor, dakika, stadyum adı, "Detayları gör" CTA). Canlı yoksa **bugünün/yaklaşan ilk 3 WC maçı** aynı kart stilinde gösterilir (asla "maç yok" boş ekranı değil).
4. **Group Standings Snippet** — başlık + "Tam Tablo" linki, seçili grup için 4 takımlı kompakt tablo (Pos, Team, P, GD, Pts), lider satırı emerald accent.

## Veri
- **Canlı**: `cached_live_matches WHERE competition_code='WC'`
- **Bugün/yaklaşan**: `cached_matches WHERE competition_code='WC' AND utc_date >= now() ORDER BY utc_date ASC LIMIT 3`
- **Standings**: `cached_standings WHERE competition_code='WC'` → group_name'lere göre grupla, seçili grup gösterilir
- 60sn auto-refresh mevcut interval'ı korunur

## Yeni Dosyalar
- `src/pages/WC.tsx` — yeni hub (eski `Live.tsx` yerine route bind edilir)
- `src/components/wc/WCHeroBanner.tsx` — gradient hero, countdown VEYA live pulse durumu (11 Haz 2026 18:00 UTC sabit)
- `src/components/wc/StageChipSelector.tsx` — yatay scroll chip'ler, seçili state, haptic tap
- `src/components/wc/WCStandingsCard.tsx` — kompakt tablo (max 4 satır), "Tam Tablo" → `/standings?league=WC`

## Değiştirilen Dosyalar
- `src/components/navigation/BottomNav.tsx` — "Live" label → "WC", Radio icon → Trophy
- `src/App.tsx` — `/live` route'unu `WC.tsx`'e bağla, `/wc` aynı bileşene alias
- `src/i18n/locales/{tr,en,es,de,ar}/common.json` — yeni `wc.*` anahtarları (badge, hero subtitle, stages, ongoing, fullTable, hostNations, vb.)

## Silinen / Değişen Davranış
- Eski `Live.tsx` içeriği (genel league live scores) kaldırılır. Bottom nav'da artık "tüm canlı skorlar" girişi yok — Home sayfasındaki live carousel zaten bu rolü dolduruyor.
- `LiveMatchCard2` yeniden kullanılır; WC için aynı kart bileşeni.

## Tasarım Çevirisi (prototip→proje tokenları)
Prototip beyaz arka plan kullanıyor; proje **dark Emerald/Amber locked**:
- `bg-white` → `bg-card`
- `bg-slate-50/100` → `bg-background`
- `text-slate-900` → `text-foreground`, `text-slate-400/500` → `text-muted-foreground`
- `border-slate-100/200` → `border-border/40`
- `bg-slate-900` (chip seçili) → `bg-primary text-primary-foreground`
- `text-emerald-600/700` → `text-primary`
- `bg-emerald-50/20` (lider satır) → `bg-primary/8`
- `bg-red-500` pulse + `text-red-400` korunur (destructive token)
- Hero gradient: `linear-gradient(135deg, hsl(222 47% 9%) 0%, hsl(222 47% 6%) 100%)` + emerald/amber glow blob
- Yuvarlaklıklar 16/12px, 8pt grid korunur

## Animasyon (mevcut framer-motion kullanımı)
- Hero giriş: 400ms fade+y8
- Chip seçimi: layoutId pill highlight, 150ms
- Stagger maç kartları: 60ms gecikme
- Pulse: mevcut `animate-pulse` Tailwind
- `prefers-reduced-motion` saygılı

## i18n Anahtarları (örnek TR)
```
wc.tabLabel: "WC"
wc.heroBadge: "Canlı Yayın" | "Turnuva Yakında"
wc.heroTitle: "Dünya Kupası 2026"
wc.heroSubtitle: "Final Yolu • ABD • Meksika • Kanada"
wc.stages.all: "Tümü", groupA…L, r16, qf, sf, final
wc.ongoing: "Devam Eden Maçlar"
wc.ongoingCount_one/other: "{{count}} maç canlı"
wc.upcomingFallback: "Yaklaşan WC Maçları"
wc.viewDetails: "Detayları gör"
wc.standings: "{{group}} Puan Durumu"
wc.fullTable: "Tam Tablo"
wc.emptyHero: "İlk düdüğe {{days}} gün"
```

## Test
- Manuel: `/live` ve `/wc` route'ları aynı sayfayı açar; bottom nav'da WC vurgulu; canlı yokken yaklaşan 3 maç görünür; grup chip değiştirince standings güncellenir; tap → match analiz akışı tetiklenir.

Süre: ~25 dakika.
