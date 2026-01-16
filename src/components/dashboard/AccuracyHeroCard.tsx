import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface AccuracyHeroCardProps {
  accuracy: number;
  trend?: number; // positive = up, negative = down
  isLoading?: boolean;
}

export const AccuracyHeroCard = ({ accuracy, trend = 0, isLoading }: AccuracyHeroCardProps) => {
  const data = [
    { name: "Doğru", value: accuracy },
    { name: "Yanlış", value: 100 - accuracy },
  ];

  const COLORS = ["hsl(var(--primary))", "hsl(var(--muted))"];

  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-primary" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (trend > 0) return "text-primary";
    if (trend < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="flex flex-col items-center justify-center h-[200px]">
          <div className="w-32 h-32 rounded-full bg-muted/50 animate-pulse" />
          <div className="mt-4 h-4 w-24 bg-muted/50 rounded animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        
        <div className="relative flex flex-col items-center">
          {/* Radial Chart */}
          <div className="relative w-40 h-40 md:w-48 md:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius="70%"
                  outerRadius="90%"
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span 
                className="text-4xl md:text-5xl font-bold text-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                %{Math.round(accuracy)}
              </motion.span>
              <span className="text-xs text-muted-foreground mt-1">Doğruluk</span>
            </div>
          </div>

          {/* Trend indicator */}
          <motion.div 
            className={`flex items-center gap-1.5 mt-4 ${getTrendColor()}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {getTrendIcon()}
            <span className="text-sm font-medium">
              {trend > 0 ? "+" : ""}{trend}% son 7 gün
            </span>
          </motion.div>

          {/* Label */}
          <p className="text-sm text-muted-foreground mt-2 text-center">
            AI Tahmin Başarı Oranı
          </p>
        </div>
      </Card>
    </motion.div>
  );
};
