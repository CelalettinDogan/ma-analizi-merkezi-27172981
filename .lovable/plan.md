

## Kalan İyileştirmeler — GolMetrik AI

Önceki audit'te 8 öncelikli alan belirlenmişti. Şu ana kadar tamamlananlar:

| Alan | Durum |
|------|-------|
| ✅ Lazy loading (TabShell) | Tamamlandı |
| ✅ Profil sayfası premium polish | Tamamlandı |
| ✅ Error reporting (ErrorBoundary → DB) | Tamamlandı |
| ✅ Dependency cleanup | Tamamlandı |
| ✅ Accessibility (BottomNav aria-labels) | Tamamlandı |

Kalan iyileştirmeler:

---

### 1. ANALİZ SONUCU CACHING (Öncelik: Yüksek)

**Sorun:** Aynı maç tekrar analiz edildiğinde hak düşmüyor (fix edildi) ama tüm API çağrıları + AI çağrısı tekrar yapılıyor — gereksiz maliyet ve bekleme süresi.

**Düzeltme — `src/hooks/useMatchAnalysis.ts`:**
- `analyzeMatch` başında DB'den son 24 saat içindeki cached sonucu kontrol et (`predictions` tablosu, `match_key + created_at > now() - 24h`)
- Cached sonuç varsa → API çağrısı yapmadan direkt döndür
- Cached sonuç yoksa → normal akışla devam et
- ~20 satır ekleme, mevcut fonksiyonun başına early return

---

### 2. PROFIL SAYFASI REFACTOR (Öncelik: Orta)

**Sorun:** `Profile.tsx` 669 satır — bakımı zor, tek dosyada tüm mantık.

**Düzeltme:**
- `src/components/profile/ProfileHeader.tsx` — avatar, isim, plan badge
- `src/components/profile/RecentAnalyses.tsx` — son analizler listesi
- `src/components/profile/SettingsMenu.tsx` — ayarlar menüsü + tema + çıkış
- `Profile.tsx` sadece bu 3 bileşeni compose etsin (~80 satır)

---

### 3. useMatchAnalysis REFACTOR (Öncelik: Orta)

**Sorun:** 842 satır tek dosyada — `runLimitedAnalysis` ve `analyzeMatch` ayrılmalı.

**Düzeltme:**
- `src/hooks/analysis/runLimitedAnalysis.ts` — eksik veri ile analiz
- `src/hooks/analysis/runFullAnalysis.ts` — tam analiz akışı
- `src/hooks/analysis/helpers.ts` — `calculateHybridConfidence`, `calculateFormScore`
- `useMatchAnalysis.ts` sadece state yönetimi + doğru fonksiyonu çağırma (~100 satır)

---

### 4. OFFLINE PERSISTENCE (Öncelik: Düşük)

**Sorun:** App restart sonrası React Query cache'i kayboluyor.

**Düzeltme — `src/App.tsx`:**
- `@tanstack/react-query-persist-client` + `createSyncStoragePersister` (localStorage) ekle
- QueryClient'a `persister` bağla
- Offline'da eski veri gösterilir, online olunca refetch

---

### Öncelik Sırası

| # | Alan | Etki | Dosya Sayısı |
|---|------|------|-------------|
| 1 | Analiz caching | API maliyeti ↓, UX ↑ | 1 dosya |
| 2 | Profile refactor | Kod kalitesi | 4 dosya |
| 3 | useMatchAnalysis refactor | Kod kalitesi | 4 dosya |
| 4 | Offline persistence | Resilience | 1 dosya + package.json |

Hangilerini uygulamak istersin?

