import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, ChevronRight } from "lucide-react";
import { PredictionRecord } from "@/types/prediction";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActivityFeedProps {
  predictions: PredictionRecord[];
  isLoading?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  "match_result": "MS",
  "over_under": "A/Ü",
  "btts": "KG",
  "correct_score": "Skor",
  "first_half": "İY",
  "handicap": "HDP",
  "double_chance": "ÇŞ",
  "combined": "KMB",
};

export const ActivityFeed = ({ predictions, isLoading }: ActivityFeedProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusIcon = (isCorrect: boolean | null) => {
    if (isCorrect === null) return <Clock className="w-4 h-4 text-secondary" />;
    if (isCorrect) return <CheckCircle2 className="w-4 h-4 text-primary" />;
    return <XCircle className="w-4 h-4 text-destructive" />;
  };

  const getStatusBadge = (isCorrect: boolean | null) => {
    if (isCorrect === null) {
      return <Badge variant="outline" className="text-xs bg-secondary/10 text-secondary border-secondary/30">Beklemede</Badge>;
    }
    if (isCorrect) {
      return <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Kazandı</Badge>;
    }
    return <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30">Kaybetti</Badge>;
  };

  const renderPredictionItem = (prediction: PredictionRecord, index: number, showAnimation = true) => (
    <motion.div
      key={prediction.id}
      initial={showAnimation ? { opacity: 0, x: -10 } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: showAnimation ? 0.5 + index * 0.05 : 0 }}
      className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0"
    >
      {/* Status icon */}
      <div className="shrink-0">
        {getStatusIcon(prediction.is_correct)}
      </div>

      {/* Match info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {prediction.home_team} - {prediction.away_team}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {TYPE_LABELS[prediction.prediction_type] || prediction.prediction_type}
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground truncate max-w-[80px]">
            {prediction.prediction_value}
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(prediction.match_date), "d MMM", { locale: tr })}
          </span>
        </div>
      </div>

      {/* Status badge */}
      <div className="shrink-0">
        {getStatusBadge(prediction.is_correct)}
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="space-y-4">
          <div className="h-5 w-24 bg-muted/50 rounded animate-pulse" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="w-4 h-4 rounded-full bg-muted/50 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-3/4 bg-muted/50 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-muted/50 rounded animate-pulse" />
              </div>
              <div className="h-5 w-16 bg-muted/50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const displayPredictions = predictions.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50 h-full flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">Son Aktivite</h3>
          {predictions.length > 5 && (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">
                  Tümünü Gör
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Tüm Tahminler</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-4">
                  <div className="space-y-1">
                    {predictions.map((prediction, index) => (
                      <div key={prediction.id} className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
                        <div className="shrink-0">
                          {getStatusIcon(prediction.is_correct)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {prediction.home_team} - {prediction.away_team}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {TYPE_LABELS[prediction.prediction_type] || prediction.prediction_type}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {prediction.prediction_value}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(prediction.match_date), "d MMM", { locale: tr })}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {getStatusBadge(prediction.is_correct)}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          )}
        </div>
        
        <div className="flex-1">
          {displayPredictions.length === 0 ? (
            <div className="flex items-center justify-center h-full py-8">
              <p className="text-sm text-muted-foreground text-center">
                Henüz tahmin yapılmadı
              </p>
            </div>
          ) : (
            displayPredictions.map((prediction, index) => 
              renderPredictionItem(prediction, index)
            )
          )}
        </div>
      </Card>
    </motion.div>
  );
};
