import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import UserMenu from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogIn, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Dashboard components
import { AccuracyHeroCard } from "@/components/dashboard/AccuracyHeroCard";
import { QuickStatsGrid } from "@/components/dashboard/QuickStatsGrid";
import { AILearningBar } from "@/components/dashboard/AILearningBar";
import { PredictionTypePills } from "@/components/dashboard/PredictionTypePills";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import SavedSlipsList from "@/components/betslip/SavedSlipsList";

// Services
import { getOverallStats, getPredictionStats, getRecentPredictions } from "@/services/predictionService";
import { getBetSlipStats } from "@/services/betSlipService";

// Types
import { OverallStats, PredictionStats, PredictionRecord } from "@/types/prediction";

const Dashboard = () => {
  const { user } = useAuth();
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [predictionStats, setPredictionStats] = useState<PredictionStats[]>([]);
  const [recentPredictions, setRecentPredictions] = useState<PredictionRecord[]>([]);
  const [slipCount, setSlipCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [slipsOpen, setSlipsOpen] = useState(false);

  const loadData = async () => {
    try {
      const [overall, byType, recent] = await Promise.all([
        getOverallStats(),
        getPredictionStats(),
        getRecentPredictions(50)
      ]);
      
      setOverallStats(overall);
      setPredictionStats(byType);
      setRecentPredictions(recent);

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

  // Calculate trend (mock for now - could be based on last 7 days vs previous)
  const calculateTrend = () => {
    // This would ideally compare current accuracy to previous period
    return 3; // Mock: +3% improvement
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NavLink to="/" className="flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground hidden sm:inline">Dashboard</span>
            </NavLink>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-9 w-9"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
            {user ? (
              <UserMenu />
            ) : (
              <NavLink to="/auth">
                <Button variant="outline" size="sm" className="h-9">
                  <LogIn className="w-4 h-4 mr-2" />
                  Giriş Yap
                </Button>
              </NavLink>
            )}
          </div>
        </div>
      </header>

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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground"
            >
              Hoş geldin, <span className="text-foreground font-medium">{user.email?.split("@")[0]}</span>
            </motion.p>
          )}

          {/* Top Row: Accuracy Hero + Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AccuracyHeroCard 
              accuracy={overallStats?.accuracy_percentage ?? 0}
              trend={calculateTrend()}
              isLoading={isLoading}
            />
            <QuickStatsGrid 
              stats={overallStats}
              isLoading={isLoading}
            />
          </div>

          {/* AI Learning Bar */}
          <AILearningBar
            correct={overallStats?.correct_predictions ?? 0}
            total={overallStats?.total_predictions ?? 0}
            isLoading={isLoading}
          />

          {/* Bottom Row: Prediction Types + Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PredictionTypePills 
              stats={predictionStats}
              isLoading={isLoading}
            />
            <ActivityFeed 
              predictions={recentPredictions}
              isLoading={isLoading}
            />
          </div>

          {/* Collapsible Slips Section (Only for logged in users) */}
          {user && (
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
