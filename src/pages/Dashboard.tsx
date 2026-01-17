import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, Target, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

// Dashboard components
import { AccuracyHeroCard } from "@/components/dashboard/AccuracyHeroCard";
import { QuickStatsGrid } from "@/components/dashboard/QuickStatsGrid";
import { AILearningBar } from "@/components/dashboard/AILearningBar";
import { PredictionTypePills } from "@/components/dashboard/PredictionTypePills";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import SavedSlipsList from "@/components/betslip/SavedSlipsList";
import AutoVerifyButton from "@/components/dashboard/AutoVerifyButton";

// Services
import { getOverallStats, getPredictionStats, getRecentPredictions, getAccuracyTrend, getPremiumStats, TrendData, PremiumStats } from "@/services/predictionService";
import { getBetSlipStats } from "@/services/betSlipService";

// Types
import { OverallStats, PredictionStats, PredictionRecord } from "@/types/prediction";

const Dashboard = () => {
  const { user } = useAuth();
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [predictionStats, setPredictionStats] = useState<PredictionStats[]>([]);
  const [recentPredictions, setRecentPredictions] = useState<PredictionRecord[]>([]);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [premiumStats, setPremiumStats] = useState<PremiumStats | null>(null);
  const [slipCount, setSlipCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [slipsOpen, setSlipsOpen] = useState(false);

  const loadData = async () => {
    try {
      const [overall, byType, recent, trend, premium] = await Promise.all([
        getOverallStats(),
        getPredictionStats(),
        getRecentPredictions(50),
        getAccuracyTrend(7),
        getPremiumStats()
      ]);
      
      setOverallStats(overall);
      setPredictionStats(byType);
      setRecentPredictions(recent);
      setTrendData(trend);
      setPremiumStats(premium);

      // Get slip count for logged in users
      if (user) {
        const slipStats = await getBetSlipStats(user.id);
        setSlipCount(slipStats.total);
      }
    } catch (error) {
      console.error("Dashboard data loading error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    toast.success("Veriler güncellendi");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const headerRightContent = (
    <div className="flex items-center gap-2">
      <AutoVerifyButton onVerificationComplete={loadData} />
      <Button
        variant="ghost"
        size="icon"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="h-9 w-9"
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );

  // Quick stats for the 2x2 grid
  const quickStats = [
    {
      icon: Target,
      label: "Toplam",
      value: overallStats?.total_predictions ?? 0,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Clock,
      label: "Beklemede",
      value: overallStats?.pending_predictions ?? 0,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      icon: CheckCircle2,
      label: "Başarılı",
      value: overallStats?.correct_predictions ?? 0,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: TrendingUp,
      label: "Başarı Oranı",
      value: `%${Math.round(overallStats?.accuracy_percentage ?? 0)}`,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AppHeader rightContent={headerRightContent} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Welcome Message */}
          {user && (
            <motion.p 
              variants={itemVariants}
              className="text-sm text-muted-foreground"
            >
              Hoş geldin, <span className="text-foreground font-medium">{user.email?.split("@")[0]}</span>
            </motion.p>
          )}

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Row 1: Accuracy Hero (large) + Quick Stats Grid (2x2) */}
            <motion.div variants={itemVariants} className="lg:col-span-5">
              <AccuracyHeroCard 
                accuracy={overallStats?.accuracy_percentage ?? 0}
                premiumAccuracy={premiumStats?.accuracy ?? 0}
                premiumTotal={premiumStats?.total ?? 0}
                trend={trendData?.trend ?? 0}
                isLoading={isLoading}
              />
            </motion.div>
            
            <motion.div variants={itemVariants} className="lg:col-span-7">
              <div className="grid grid-cols-2 gap-3 h-full">
                {quickStats.map((stat, index) => (
                  <Card 
                    key={stat.label}
                    className="p-4 bg-card/50 backdrop-blur-sm border-border/50 flex items-center gap-3 hover:bg-card/80 transition-colors"
                  >
                    <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-xl font-bold text-foreground">
                        {isLoading ? (
                          <span className="inline-block w-12 h-6 bg-muted/50 rounded animate-pulse" />
                        ) : (
                          stat.value
                        )}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* Row 2: AI Learning Bar (full width) */}
            <motion.div variants={itemVariants} className="lg:col-span-12">
              <AILearningBar
                correct={overallStats?.correct_predictions ?? 0}
                total={overallStats?.total_predictions ?? 0}
                isLoading={isLoading}
              />
            </motion.div>

            {/* Row 3: Prediction Type Pills + Activity Feed */}
            <motion.div variants={itemVariants} className="lg:col-span-5">
              <PredictionTypePills 
                stats={predictionStats}
                isLoading={isLoading}
              />
            </motion.div>
            
            <motion.div variants={itemVariants} className="lg:col-span-7">
              <ActivityFeed 
                predictions={recentPredictions}
                isLoading={isLoading}
              />
            </motion.div>
          </div>

          {/* Collapsible Slips Section (Only for logged in users) */}
          {user && (
            <motion.div variants={itemVariants}>
              <Collapsible open={slipsOpen} onOpenChange={setSlipsOpen}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between h-12 bg-card/50 hover:bg-card/80 border-border/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Kuponlarım</span>
                      {slipCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {slipCount}
                        </Badge>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${slipsOpen ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <SavedSlipsList />
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-xs text-muted-foreground">
            © 2026 FutbolTahmin. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
