

## Problem

Satır 518'deki takım alanı (`flex-1 min-w-0 flex items-center gap-1.5`) tüm öğeleri tek satırda yan yana gösteriyor: ev sahibi logo + isim + tire + deplasman isim + logo. Dar ekranlarda (320px) `truncate` takım isimlerini kısaltsa da, logolar ve isimler arasında `gap-1.5` sabit kalıyor ve öğeler sıkışabiliyor. Asıl sorun: iki takım ismi ve iki logo aynı flex satırında, `min-w-0` olmasına rağmen içerik sığmadığında logo ile metin üst üste binebiliyor.

## Çözüm

Takım satırını iki satırlı (stacked) yapıya dönüştürmek yerine, mevcut tek satır yapısını koruyup her takım için ayrı bir `min-w-0` konteyner oluşturarak taşmayı garanti önlemek:

### Değişiklik: `src/components/TodaysMatches.tsx` (satır 518-532)

Mevcut düz flex yerine, her takımı kendi `min-w-0 flex items-center` konteynerine almak:

```tsx
{/* Teams */}
<div className="flex-1 min-w-0 flex items-center gap-1">
  {/* Home */}
  <div className="flex items-center gap-1 min-w-0 flex-1">
    {match.homeTeam.crest && (
      <img src={match.homeTeam.crest} alt="" className="w-4 h-4 object-contain shrink-0" />
    )}
    <span className="text-sm truncate min-w-0">
      {cleanTeamName(match.homeTeam)}
    </span>
  </div>
  <span className="text-muted-foreground/50 text-xs shrink-0 px-0.5">–</span>
  {/* Away */}
  <div className="flex items-center gap-1 min-w-0 flex-1">
    <span className="text-sm truncate min-w-0">
      {cleanTeamName(match.awayTeam)}
    </span>
    {match.awayTeam.crest && (
      <img src={match.awayTeam.crest} alt="" className="w-4 h-4 object-contain shrink-0" />
    )}
  </div>
</div>
```

**Önemli değişiklikler:**
- Her takım kendi `flex-1 min-w-0` konteynerine sahip → eşit alan paylaşımı
- Logo boyutu `w-5 h-5` → `w-4 h-4` (dar ekranda daha az yer kaplar)
- `gap-1.5` → `gap-1` (daha sıkı aralık)
- Tire etrafına `px-0.5` eklenerek minimum boşluk garanti

Bu yapıda her takım ismi kendi konteynerinde `truncate` olur ve logo ile çakışma mümkün olmaz.

