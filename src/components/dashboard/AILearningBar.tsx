import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Brain, Sparkles } from "lucide-react";

interface AILearningBarProps {
  correct: number;
  total: number;
  isLoading?: boolean;
}

export const AILearningBar = ({ correct, total, isLoading }: AILearningBarProps) => {
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const hasData = total > 0;

  if (isLoading) {
    return (
      <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-muted/50 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-muted/50 rounded animate-pulse" />
            <div className="h-2 w-full bg-muted/50 rounded animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  // Empty state when no verified predictions
  if (!hasData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden relative">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          <div className="relative flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
              <Brain className="w-5 h-5 text-primary animate-pulse" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-foreground">AI Öğrenmeye Hazırlanıyor</span>
                <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse" />
              </div>

              <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/50"
                  animate={{ width: ["0%", "30%", "0%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              <p className="text-xs text-muted-foreground mt-1.5">
                Tahminler doğrulandıkça AI modeli öğrenecek
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden relative">
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative flex items-center gap-4">
          {/* AI Icon */}
          <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
            <Brain className="w-5 h-5 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">AI Model Öğreniyor</span>
                <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse" />
              </div>
              <span className="text-sm font-bold text-primary">%{percentage}</span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
              />
            </div>

            {/* Stats */}
            <p className="text-xs text-muted-foreground mt-1.5">
              {correct} doğru / {total} toplam tahmin
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
