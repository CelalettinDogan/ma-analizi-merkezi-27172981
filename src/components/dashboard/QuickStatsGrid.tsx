import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Target, Clock, CheckCircle2, XCircle } from "lucide-react";
import { OverallStats } from "@/types/prediction";

interface QuickStatsGridProps {
  stats: OverallStats | null;
  isLoading?: boolean;
}

export const QuickStatsGrid = ({ stats, isLoading }: QuickStatsGridProps) => {
  const items = [
    {
      label: "Toplam",
      value: stats?.total_predictions ?? 0,
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Beklemede",
      value: stats?.pending_predictions ?? 0,
      icon: Clock,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      label: "Doğru",
      value: stats?.correct_predictions ?? 0,
      icon: CheckCircle2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Yanlış",
      value: stats?.incorrect_predictions ?? 0,
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted/50 animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-8 bg-muted/50 rounded animate-pulse" />
                <div className="h-3 w-12 bg-muted/50 rounded animate-pulse" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${item.bgColor}`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
