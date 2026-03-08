

# Takım İsmi Temizleme — Tüm Ligler İçin Genişletme

## Sorun
Mevcut override haritası İtalya, İngiltere, Almanya, İspanya takımlarını kapsıyor ama Fransa (Ligue 1) ve Şampiyonlar Ligi takımları eksik. "Racing Club de Lens" hala uzun görünüyor.

## Çözüm
`src/components/TodaysMatches.tsx` — tek dosya değişikliği:

### 1. TEAM_OVERRIDES'a Ligue 1 + CL takımları ekle
```
// Ligue 1
'Racing Club de Lens' → 'Lens'
'Stade Brestois 29' → 'Brest'
'Stade de Reims' → 'Reims'
'Stade Rennais FC 1901' → 'Rennes' (zaten var)
'OGC Nice' → 'Nice'
'AJ Auxerre' → 'Auxerre'
'Le Havre AC' → 'Le Havre'
'Angers SCO' → 'Angers'
'FC Nantes' → 'Nantes'
'Toulouse FC' → 'Toulouse'
'Montpellier HSC' → 'Montpellier'
'AS Saint-Étienne' → 'Saint-Étienne'

// La Liga eksikler
'Villarreal CF' → 'Villarreal'
'Getafe CF' → 'Getafe'
'CA Osasuna' → 'Osasuna'
'Deportivo Alavés' → 'Alavés'
'Real Valladolid CF' → 'Valladolid'
'UD Las Palmas' → 'Las Palmas'
'Girona FC' → 'Girona'
'Real Mallorca' → 'Mallorca'
'Cádiz CF' → 'Cádiz'
'Sevilla FC' → 'Sevilla'
'Valencia CF' → 'Valencia'
'CD Leganés' → 'Leganés'
'Real Betis Balompié' → 'Betis' (zaten var)

// CL'de gelebilecek takımlar
'FC Barcelona' → 'Barcelona'
'FC Bayern München' → 'Bayern'
'SL Benfica' → 'Benfica'
'Sporting CP' → 'Sporting'
'FC Porto' → 'Porto'
'AFC Ajax' → 'Ajax'
'PSV Eindhoven' → 'PSV'
'Feyenoord Rotterdam' → 'Feyenoord'
'FC Salzburg' → 'Salzburg'
'SK Sturm Graz' → 'Sturm Graz'
'Celtic FC' → 'Celtic'
'Club Brugge KV' → 'Club Brugge'
'BSC Young Boys' → 'Young Boys'
'FK Crvena Zvezda' → 'Crvena Zvezda'
'GNK Dinamo Zagreb' → 'Dinamo Zagreb'
'Shakhtar Donetsk' → 'Shakhtar'
```

### 2. Regex'e ek kalıplar ekle
- **Prefix**: `Racing Club de `, `Stade de `, `Stade `, `OGC `, `AJ `, `SL `, `FK `, `GNK `, `BSC `, `AFC `, `PSV `
- **Suffix**: `HSC`, `SCO`, `AC`, `KV`, `CP`, `29`

### 3. cleanTeamName fonksiyonu aynı kalır
Override → shortName/name temizle → fallback. Mevcut mantık yeterli, sadece veri genişliyor.

