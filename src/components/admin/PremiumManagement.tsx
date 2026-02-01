import React from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Users, 
  TrendingUp,
  Calendar,
  Loader2,
  Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { staggerContainer, staggerItem } from '@/lib/animations';

interface PlanStats {
  planType: string;
  count: number;
  revenue: number;
}

interface PremiumManagementProps {
  planStats: PlanStats[];
  totalPremium: number;
  monthlyRevenue: number;
  conversionRate: number;
  isLoading: boolean;
}

const planDetails: Record<string, { name: string; price: number; features: string[]; color: string }> = {
  basic: {
    name: 'Basic',
    price: 29.99,
    features: ['10 Günlük Chat', '5 Analiz/Gün', 'Temel Tahminler'],
    color: 'bg-blue-500',
  },
  plus: {
    name: 'Plus',
    price: 49.99,
    features: ['25 Günlük Chat', '15 Analiz/Gün', 'Gelişmiş Tahminler', 'AI Önerileri'],
    color: 'bg-purple-500',
  },
  pro: {
    name: 'Pro',
    price: 79.99,
    features: ['Sınırsız Chat', 'Sınırsız Analiz', 'Premium Tahminler', 'Öncelikli Destek'],
    color: 'bg-yellow-500',
  },
};

const PremiumManagement: React.FC<PremiumManagementProps> = ({
  planStats,
  totalPremium,
  monthlyRevenue,
  conversionRate,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalSubscribers = planStats.reduce((sum, p) => sum + p.count, 0);

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItem}>
        <h2 className="text-2xl font-bold">Premium Yönetimi</h2>
        <p className="text-muted-foreground">
          Abonelik paketleri ve gelir takibi
        </p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Crown className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPremium}</p>
                <p className="text-sm text-muted-foreground">Premium Kullanıcı</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">₺{monthlyRevenue.toLocaleString('tr-TR')}</p>
                <p className="text-sm text-muted-foreground">Aylık Gelir (Tahmini)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">%{conversionRate.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Dönüşüm Oranı</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Plan Cards */}
      <motion.div variants={staggerItem}>
        <h3 className="text-lg font-semibold mb-4">Paket Dağılımı</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(planDetails).map(([key, plan]) => {
            const stat = planStats.find(p => p.planType === key);
            const count = stat?.count || 0;
            const percentage = totalSubscribers > 0 ? (count / totalSubscribers) * 100 : 0;
            
            return (
              <Card key={key} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 ${plan.color}`} />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      {plan.name}
                    </CardTitle>
                    <Badge variant="outline">₺{plan.price}/ay</Badge>
                  </div>
                  <CardDescription>
                    {count} aktif abone
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Dağılım</span>
                      <span>%{percentage.toFixed(1)}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                  
                  <div className="space-y-1">
                    {plan.features.map((feature, i) => (
                      <p key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${plan.color}`} />
                        {feature}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Info Card */}
      <motion.div variants={staggerItem}>
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Premium Bilgileri</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Premium atama Kullanıcı Yönetimi sekmesinden yapılır</li>
                  <li>Gelir hesaplaması aktif abonelik * paket fiyatı üzerinden yapılır</li>
                  <li>Google Play satışları otomatik olarak sync edilir</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default PremiumManagement;
