

# Hero'da Accuracy Neden Gözükmüyor

## Sorun
`overall_stats` tablosunda `accuracy_percentage` şu an **60.2%**. HeroSection'daki koşul `stats.accuracy >= 65` olduğu için accuracy badge gizleniyor ve yerine "AI destekli maç analizi" fallback metni gösteriliyor.

## Çözüm
`src/components/HeroSection.tsx` — eşik değerini düşür veya kaldır:

1. **Eşiği 50'ye düşür** — `stats.accuracy >= 50` yaparak %60 accuracy gösterilsin
2. **Accuracy varsa her zaman göster** — `stats.totalPredictions > 0` koşuluyla, accuracy yüzdesine bakılmaksızın badge gösterilsin (daha mantıklı — kullanıcı her zaman istatistik görmek istiyor)

**Önerilen yaklaşım:** `stats.totalPredictions > 0` koşulu. Böylece en az 1 analiz yapılmışsa accuracy badge görünür. Accuracy düşükse bile kullanıcıya bilgi verir.

Tek dosya değişikliği: `src/components/HeroSection.tsx` — satır 58'deki koşul.

