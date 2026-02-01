import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Play,
  Database,
  Loader2,
  Calendar,
  Zap,
  ShieldAlert,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppHeader from '@/components/layout/AppHeader';
import BottomNav from '@/components/navigation/BottomNav';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

interface CronJob {
  id: number;
  name: string;
  description: string;
  schedule: string;
  scheduleHuman: string;
  function: string;
  active: boolean;
  lastRun: string | null;
  status: 'healthy' | 'unknown' | 'error' | 'no-live-matches';
  recordCount?: number;
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);
  
  // Refs for cleanup
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Access control check
  const isAuthorized = user && isAdmin;
  const isCheckingAuth = authLoading || roleLoading;

  const fetchCronStatus = useCallback(async () => {
    if (!isAuthorized || !isMountedRef.current) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-cron-status');
      
      if (error) throw error;
      if (!isMountedRef.current) return;
      
      setJobs(data.jobs || []);
    } catch (e) {
      console.error('Error fetching cron status:', e);
      if (isMountedRef.current) {
        toast.error('Cron durumu alınamadı');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [isAuthorized]);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (isCheckingAuth) return;
    
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    fetchCronStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchCronStatus, 30000);
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [isCheckingAuth, user, isAdmin, fetchCronStatus, navigate]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchCronStatus();
  };

  const triggerJob = async (functionName: string) => {
    setTriggeringJob(functionName);
    try {
      const { error } = await supabase.functions.invoke(functionName);
      if (error) throw error;
      
      if (isMountedRef.current) {
        toast.success(`${functionName} başarıyla çalıştırıldı`);
      }
      
      // Clear previous timeout if exists
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      refreshTimeoutRef.current = setTimeout(fetchCronStatus, 2000);
    } catch (e) {
      console.error('Error triggering job:', e);
      if (isMountedRef.current) {
        toast.error(`${functionName} çalıştırılamadı`);
      }
    } finally {
      if (isMountedRef.current) {
        setTriggeringJob(null);
      }
    }
  };

  const getStatusIcon = (status: CronJob['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'no-live-matches':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: CronJob['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Sağlıklı</Badge>;
      case 'error':
        return <Badge variant="destructive">Hata</Badge>;
      case 'no-live-matches':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Canlı Maç Yok</Badge>;
      default:
        return <Badge variant="secondary">Bilinmiyor</Badge>;
    }
  };

  const formatLastRun = (lastRun: string | null) => {
    if (!lastRun) return 'Henüz çalışmadı';
    
    const date = new Date(lastRun);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-safe">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Unauthorized state
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <AppHeader />
        <main className="container mx-auto px-4 py-12">
          <motion.div 
            {...fadeInUp}
            className="max-w-md mx-auto text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/10 flex items-center justify-center border border-red-500/30">
              <ShieldAlert className="w-10 h-10 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Erişim Engellendi</h1>
            <p className="text-muted-foreground mb-6">
              Bu sayfaya erişim yetkiniz bulunmuyor. Admin paneline sadece yetkili kullanıcılar erişebilir.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={() => navigate('/')} className="gap-2">
                Ana Sayfaya Dön
              </Button>
              {!user && (
                <Button variant="outline" onClick={() => navigate('/auth')} className="gap-2">
                  <Lock className="w-4 h-4" />
                  Giriş Yap
                </Button>
              )}
            </div>
          </motion.div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const headerRightContent = (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-green-500 border-green-500/30">
        Admin
      </Badge>
      <Button
        variant="outline"
        size="icon"
        onClick={handleRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <AppHeader rightContent={headerRightContent} />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div {...fadeInUp} className="space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Cron Job Yönetimi
          </h1>
          <p className="text-muted-foreground">
            Zamanlanmış görevlerin durumunu izleyin ve manuel olarak tetikleyin.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          {...fadeInUp}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{jobs.length}</p>
                  <p className="text-xs text-muted-foreground">Toplam Job</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {jobs.filter(j => j.status === 'healthy').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Sağlıklı</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {jobs.filter(j => j.active).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Aktif</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Database className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {jobs.reduce((sum, j) => sum + (j.recordCount || 0), 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Cache Kayıt</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Jobs List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-4"
          >
            {jobs.map((job) => (
              <motion.div key={job.id} variants={staggerItem}>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <CardTitle className="text-lg">{job.name}</CardTitle>
                          <CardDescription>{job.description}</CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Zamanlama</p>
                          <p className="font-medium">{job.scheduleHuman}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Son Çalışma</p>
                          <p className="font-medium">{formatLastRun(job.lastRun)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Fonksiyon</p>
                          <p className="font-medium font-mono text-xs">{job.function}</p>
                        </div>
                      </div>
                      
                      {job.recordCount !== undefined && (
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Kayıt Sayısı</p>
                            <p className="font-medium">{job.recordCount}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {job.schedule}
                      </code>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerJob(job.function)}
                        disabled={triggeringJob === job.function}
                        className="gap-2"
                      >
                        {triggeringJob === job.function ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        Manuel Çalıştır
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Info */}
        <motion.div {...fadeInUp}>
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Cron Job Bilgileri</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Tüm zamanlar UTC timezone'da çalışır</li>
                    <li>Sağlık durumu cache tablolarının güncelleme zamanına göre belirlenir</li>
                    <li>Manuel tetikleme anında edge function'ı çağırır</li>
                    <li>Sayfa her 30 saniyede otomatik yenilenir</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
};

export default AdminPage;
