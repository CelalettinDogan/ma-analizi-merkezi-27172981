

# Poisson Veri Kaydetme Bugfix ve Yayın Oncesi Son Duzeltme

## Sorun

`savePredictionFeatures` fonksiyonunun TypeScript tip tanimi (satir 224-239, `mlPredictionService.ts`) `poisson_home_expected` ve `poisson_away_expected` alanlarini icermiyor. `createFeatureRecord` bu alanlari uretiyor ama tip uyusmazligi nedeniyle veritabanina yazilmiyor. Sonuc: 73 kayitta 0 Poisson verisi.

## Cozum

Tek dosyada tek degisiklik:

### `src/services/mlPredictionService.ts` (satir 224-239)

`savePredictionFeatures` fonksiyonunun features parametre tipine iki alan ekle:

```text
// ONCE (satir 238):
    hybrid_confidence: number;
  }

// SONRA:
    hybrid_confidence: number;
    poisson_home_expected?: number | null;
    poisson_away_expected?: number | null;
  }
```

Bu degisiklikle `createFeatureRecord`'un urettigi `poisson_home_expected` ve `poisson_away_expected` alanlari artik `...features` spread ile veritabanina yazilacak.

## Dosya Degisiklikleri

| Dosya | Degisiklik |
|-------|-----------|
| `src/services/mlPredictionService.ts` | `savePredictionFeatures` tip tanimina `poisson_home_expected` ve `poisson_away_expected` ekle |

## Etki

- Yeni tahminlerde Poisson beklenen gol degerleri `prediction_features` tablosuna kaydedilecek
- ML ogrenme dongusu Poisson verilerine erisebilecek
- Mevcut 73 kayit degismez (zaten NULL), yeni kayitlardan itibaren duzgun calisir

