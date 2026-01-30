

# H2H Verileri Görüntülenmeme Sorunu - Çözüm

## Tespit Edilen Sorun

**matchId hook'a iletilmiyor!** 

H2H API'si çalışıyor ve Lazio-Genoa için 15 geçmiş maç var, ama `Index.tsx`'de maç seçildiğinde `matchId` dahil edilmiyor:

```text
Index.tsx (satır 208-213):
─────────────────────────────────────────
const matchInput: MatchInput = {
  homeTeam: match.homeTeam.name,
  awayTeam: match.awayTeam.name,
  league: leagueCode,
  matchDate: match.utcDate.split('T')[0],
  // ❌ matchId EKSİK!
};
```

`useMatchAnalysis` hook'u matchId'yi kontrol ediyor (satır 119) ama hiçbir zaman alamıyor, bu yüzden boş database cache'den okumaya çalışıyor ve "Geçmiş karşılaşma bulunamadı" gösteriyor.

---

## Çözüm

`Index.tsx`'de maç seçildiğinde `matchId`'yi de `MatchInput`'a ekle:

```text
Dosya: src/pages/Index.tsx
Satır: 208-213

Önceki:
const matchInput: MatchInput = {
  homeTeam: match.homeTeam.name,
  awayTeam: match.awayTeam.name,
  league: leagueCode,
  matchDate: match.utcDate.split('T')[0],
};

Sonraki:
const matchInput: MatchInput = {
  homeTeam: match.homeTeam.name,
  awayTeam: match.awayTeam.name,
  league: leagueCode,
  matchDate: match.utcDate.split('T')[0],
  matchId: match.id, // ✅ H2H API için gerekli
};
```

---

## Beklenen Sonuç

Değişiklik sonrası:

| Önceki | Sonraki |
|--------|---------|
| "Geçmiş karşılaşma bulunamadı" | 15 geçmiş Lazio-Genoa maçı |
| Database cache (boş) | Gerçek API verileri |

H2H Timeline artık şöyle görünecek:
- Lazio: 0 galibiyet
- Beraberlik: 1
- Genoa: 0 galibiyet
- Son 5 maç skorları (0-3, 1-1, vb.)

---

## Teknik Detaylar

**Tek satır ekleme** - `src/pages/Index.tsx` satır 212'ye:
```tsx
matchId: match.id,
```

Bu değişiklik, `useMatchAnalysis` hook'unun `getHeadToHead(data.matchId)` fonksiyonunu çağırmasını ve gerçek H2H verilerini API'den almasını sağlayacak.

