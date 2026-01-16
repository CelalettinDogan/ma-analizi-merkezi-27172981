import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { PredictionStats } from "@/types/prediction";

interface PredictionTypePillsProps {
  stats: PredictionStats[];
  isLoading?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  // Turkish keys from database (primary)
  "Maç Sonucu": "Maç Sonucu",
  "Toplam Gol Alt/Üst": "Alt/Üst",
  "Karşılıklı Gol": "KG Var/Yok",
  "Doğru Skor": "Doğru Skor",
  "İlk Yarı Sonucu": "İlk Yarı",
  "İlk Yarı / Maç Sonucu": "İY/MS",
  "İki Yarıda da Gol": "2YG",
  // Legacy English keys (backward compatibility)
  "match_result": "Maç Sonucu",
  "over_under": "Alt/Üst",
  "btts": "Karşılıklı Gol",
  "correct_score": "Doğru Skor",
  "first_half": "İlk Yarı",
  "handicap": "Handikap",
  "double_chance": "Çifte Şans",
  "combined": "Kombine",
};

export const PredictionTypePills = ({ stats, isLoading }: PredictionTypePillsProps) => {
  const getBarColor = (percentage: number) => {
    if (percentage >= 60) return "bg-primary";
    if (percentage >= 40) return "bg-secondary";
    return "bg-destructive/70";
  };

  if (isLoading) {
    return (
      <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="space-y-4">
          <div className="h-5 w-32 bg-muted/50 rounded animate-pulse" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-muted/50 rounded animate-pulse" />
                <div className="h-4 w-8 bg-muted/50 rounded animate-pulse" />
              </div>
              <div className="h-2 w-full bg-muted/50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // Sort by total predictions descending
  const sortedStats = [...stats].sort((a, b) => 
    (b.total_predictions || 0) - (a.total_predictions || 0)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50 h-full">
        <h3 className="text-sm font-semibold text-foreground mb-4">Tahmin Türleri</h3>
        
        <div className="space-y-3">
          {sortedStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Henüz tahmin verisi yok
            </p>
          ) : (
            sortedStats.slice(0, 6).map((stat, index) => {
              const percentage = stat.accuracy_percentage ?? 0;
              const label = TYPE_LABELS[stat.prediction_type || ""] || stat.prediction_type || "Bilinmeyen";
              
              return (
                <motion.div
                  key={stat.prediction_type}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                >
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground truncate">{label}</span>
                    <span className="font-medium text-foreground ml-2">%{Math.round(percentage)}</span>
                  </div>
                  <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${getBarColor(percentage)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.6 + index * 0.05 }}
                    />
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </Card>
    </motion.div>
  );
};
