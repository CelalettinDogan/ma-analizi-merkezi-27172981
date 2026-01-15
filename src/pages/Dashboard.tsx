import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StatsOverview from '@/components/dashboard/StatsOverview';
import PredictionTypeChart from '@/components/dashboard/PredictionTypeChart';
import RecentPredictions from '@/components/dashboard/RecentPredictions';
import AutoVerifyButton from '@/components/dashboard/AutoVerifyButton';
import MLPerformanceCard from '@/components/dashboard/MLPerformanceCard';
import SavedSlipsList from '@/components/betslip/SavedSlipsList';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getOverallStats, 
  getPredictionStats, 
  getRecentPredictions 
} from '@/services/predictionService';
import { OverallStats, PredictionStats, PredictionRecord } from '@/types/prediction';

const Dashboard: React.FC = () => {
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [predictionStats, setPredictionStats] = useState<PredictionStats[]>([]);
  const [recentPredictions, setRecentPredictions] = useState<PredictionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [overall, byType, recent] = await Promise.all([
        getOverallStats(),
        getPredictionStats(),
        getRecentPredictions(50),
      ]);
      
      setOverallStats(overall);
      setPredictionStats(byType);
      setRecentPredictions(recent);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationComplete = () => {
    loadData();
    setRefreshTrigger(prev => prev + 1); // Trigger ML card refresh
  };

  useEffect(() => {
    loadData();
  }, []);

  // Show login prompt for bet slips if not authenticated
  const renderSlipsContent = () => {
    if (authLoading) {
      return (
        <div className="max-w-2xl mx-auto">
          <SavedSlipsList isLoading={true} onRefresh={loadData} />
        </div>
      );
    }

    if (!user) {
      return (
        <div className="max-w-md mx-auto">
          <Card className="glass-card text-center">
            <CardHeader>
              <CardTitle className="text-foreground">Giriş Gerekli</CardTitle>
              <CardDescription>
                Kişisel kuponlarınızı görüntülemek için lütfen giriş yapın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/auth">
                <Button className="bg-primary hover:bg-primary/90 gap-2">
                  <LogIn className="h-4 w-4" />
                  Giriş Yap / Kayıt Ol
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto">
        <SavedSlipsList isLoading={isLoading} onRefresh={loadData} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anasayfa
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">FT</span>
              </div>
              <span className="font-display font-bold text-lg text-foreground">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AutoVerifyButton onVerificationComplete={handleVerificationComplete} />
            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Yenile
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
            Tahmin <span className="gradient-text">İstatistikleri</span>
          </h1>
          <p className="text-muted-foreground">
            {user ? `Hoş geldin, ${user.user_metadata?.display_name || user.email?.split('@')[0]}` : 'Tüm tahminlerin performans analizi'}
          </p>
        </div>

        {/* Stats Overview */}
        <StatsOverview stats={overallStats} isLoading={isLoading} />

        {/* Tabs for different views */}
        <Tabs defaultValue="predictions" className="w-full">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 bg-muted/50">
            <TabsTrigger value="predictions">Tahminler</TabsTrigger>
            <TabsTrigger value="ai">AI Model</TabsTrigger>
            <TabsTrigger value="slips">Kuponlarım</TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <PredictionTypeChart stats={predictionStats} isLoading={isLoading} />
              <RecentPredictions 
                predictions={recentPredictions} 
                isLoading={isLoading} 
                onRefresh={loadData}
              />
            </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
            <div className="max-w-2xl mx-auto">
              <MLPerformanceCard refreshTrigger={refreshTrigger} />
            </div>
          </TabsContent>

          <TabsContent value="slips" className="mt-6">
            {renderSlipsContent()}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 FutbolTahmin. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
