

# Takım İsmi Sadeleştirme

## Sorun
Mevcut `cleanTeamName` fonksiyonu sadece ön ekleri (US, FC, ACF...) temizliyor ama:
- "Parma Calcio" → "Parma Calcio" (Calcio temizlenmiyor)
- "Internazionale Milano" → "Internazionale Milano" (Inter olması lazım)
- "Torino FC" → sondaki FC temizlenmiyor

## Çözüm
`TodaysMatches.tsx` dosyasındaki `cleanTeamName` fonksiyonunu genişlet:

1. **Manuel override haritası** — Bilinen takımlar için kısa isim (Inter, Juve, Atletico, vb.)
2. **Son ek temizleme** — "Calcio", "FC", "SC", "CF" gibi son ekleri de regex ile temizle
3. **Öncelik sırası:** Override map → shortName temizlenmiş → name temizlenmiş

```
TEAM_OVERRIDES = {
  "FC Internazionale Milano" → "Inter",
  "Parma Calcio 1913" → "Parma",
  "Juventus FC" → "Juventus",
  "Hellas Verona FC" → "Verona",
  "Atalanta BC" → "Atalanta",
  "Torino FC" → "Torino",
  "Como 1907" → "Como",
  "Venezia FC" → "Venezia",
  ...
}

TEAM_SUFFIXES = / (Calcio|FC|SC|CF|BC|SFC|AFC|1913|1907|1899|de Madrid)$/i
```

Tek dosya değişikliği: `src/components/TodaysMatches.tsx`

