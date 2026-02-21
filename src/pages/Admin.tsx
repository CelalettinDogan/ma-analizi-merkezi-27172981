import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useAdminData } from '@/hooks/admin/useAdminData';
import AdminLayout, { AdminSection } from '@/components/admin/AdminLayout';
import DashboardStats from '@/components/admin/DashboardStats';
import UserManagement from '@/components/admin/UserManagement';
import PremiumManagement from '@/components/admin/PremiumManagement';
import AIManagement from '@/components/admin/AIManagement';
import NotificationManagement from '@/components/admin/NotificationManagement';
import ActivityLog from '@/components/admin/ActivityLog';
import { fadeInUp } from '@/lib/animations';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');

  const {
    isLoading,
    dashboardData,
    refreshDashboard,
    users,
    usersCount,
    usersPage,
    setUsersPage,
    pageSize,
    refreshUsers,
    assignPremium,
    toggleRole,
    banUser,
    unbanUser,
    planStats,
    refreshPlanStats,
    predictionStats,
    leagueStats,
    systemPrompt,
    refreshPredictionStats,
    refreshLeagueStats,
    savePrompt,
    notifications,
    tokenCount,
    refreshNotifications,
    sendNotification,
    activityLogs,
    refreshActivityLogs,
  } = useAdminData();

  const isAuthorized = user && isAdmin;
  const isCheckingAuth = authLoading || roleLoading;

  useEffect(() => {
    if (isCheckingAuth) return;
    
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }
  }, [isCheckingAuth, user, navigate]);

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
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-safe">
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
      </div>
    );
  }

  const totalPremium = planStats.reduce((sum, p) => sum + p.count, 0);
  const monthlyRevenue = planStats.reduce((sum, p) => sum + p.revenue, 0);
  const conversionRate = dashboardData ? dashboardData.premiumRate : 0;
  const overallAccuracy = predictionStats.length > 0 
    ? predictionStats.reduce((sum, p) => sum + p.accuracy, 0) / predictionStats.length 
    : 0;
  const totalPredictions = predictionStats.reduce((sum, p) => sum + p.total, 0);

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <DashboardStats 
            data={dashboardData} 
            isLoading={isLoading} 
          />
        );
      
      case 'users':
        return (
          <UserManagement
            users={users}
            isLoading={isLoading}
            totalCount={usersCount}
            page={usersPage}
            pageSize={pageSize}
            onPageChange={setUsersPage}
            onRefresh={refreshUsers}
            onAssignPremium={assignPremium}
            onToggleRole={toggleRole}
            onBanUser={banUser}
            onUnbanUser={unbanUser}
          />
        );
      
      case 'premium':
        return (
          <PremiumManagement
            planStats={planStats}
            totalPremium={totalPremium}
            monthlyRevenue={monthlyRevenue}
            conversionRate={conversionRate}
            isLoading={isLoading}
          />
        );
      
      case 'ai':
        return (
          <AIManagement
            predictionStats={predictionStats}
            leagueStats={leagueStats}
            overallAccuracy={overallAccuracy}
            totalPredictions={totalPredictions}
            systemPrompt={systemPrompt}
            isLoading={isLoading}
            onSavePrompt={savePrompt}
            onRefresh={() => { refreshPredictionStats(); refreshLeagueStats(); }}
          />
        );
      
      case 'matches':
        return (
          <div className="text-center py-12 text-muted-foreground">
            <h2 className="text-2xl font-bold mb-2">Maç Yönetimi</h2>
            <p>Bu modül yakında aktif olacak.</p>
          </div>
        );
      
      case 'notifications':
        return (
          <NotificationManagement
            notifications={notifications}
            tokenCount={tokenCount}
            isLoading={isLoading}
            onSendNotification={sendNotification}
            onRefresh={refreshNotifications}
          />
        );
      
      case 'statistics':
        return (
          <div className="text-center py-12 text-muted-foreground">
            <h2 className="text-2xl font-bold mb-2">İstatistikler</h2>
            <p>Detaylı grafikler ve raporlar yakında eklenecek.</p>
          </div>
        );
      
      case 'logs':
        return (
          <ActivityLog
            logs={activityLogs}
            isLoading={isLoading}
            onRefresh={refreshActivityLogs}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderSection()}
    </AdminLayout>
  );
};

export default AdminPage;
