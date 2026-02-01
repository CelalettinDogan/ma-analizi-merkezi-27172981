import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Crown, 
  MessageSquare, 
  BarChart3, 
  TrendingUp, 
  Activity,
  Target,
  Calendar,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { staggerContainer, staggerItem } from '@/lib/animations';

interface DashboardData {
  totalUsers: number;
  premiumUsers: number;
  premiumRate: number;
  todayChats: number;
  todayAnalysis: number;
  aiAccuracy: number;
  liveMatches: number;
  activeUsers24h: number;
}

interface DashboardStatsProps {
  data: DashboardData | null;
  isLoading: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Veriler yüklenemedi
      </div>
    );
  }

  const stats = [
    {
      title: 'Toplam Kullanıcı',
      value: data.totalUsers.toLocaleString('tr-TR'),
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Premium Kullanıcı',
      value: data.premiumUsers.toLocaleString('tr-TR'),
      icon: Crown,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      badge: `%${data.premiumRate.toFixed(1)}`,
    },
    {
      title: 'Aktif (24s)',
      value: data.activeUsers24h.toLocaleString('tr-TR'),
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Günlük Chat',
      value: data.todayChats.toLocaleString('tr-TR'),
      icon: MessageSquare,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Günlük Analiz',
      value: data.todayAnalysis.toLocaleString('tr-TR'),
      icon: BarChart3,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Canlı Maç',
      value: data.liveMatches.toLocaleString('tr-TR'),
      icon: Calendar,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.title} variants={staggerItem}>
              <Card className="relative overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-2">
                    <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.title}</p>
                    </div>
                    {stat.badge && (
                      <Badge variant="secondary" className="w-fit text-xs">
                        {stat.badge}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* AI Accuracy Card */}
      <motion.div variants={staggerItem}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                AI Tahmin Başarısı
              </CardTitle>
              <Badge 
                variant={data.aiAccuracy >= 70 ? "default" : data.aiAccuracy >= 50 ? "secondary" : "destructive"}
              >
                %{data.aiAccuracy.toFixed(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={data.aiAccuracy} className="h-3" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={staggerItem}>
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Günlük Özet</h3>
                <p className="text-sm text-muted-foreground">
                  Bugün {data.todayChats + data.todayAnalysis} işlem gerçekleşti. 
                  Premium dönüşüm oranı %{data.premiumRate.toFixed(1)}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default DashboardStats;
