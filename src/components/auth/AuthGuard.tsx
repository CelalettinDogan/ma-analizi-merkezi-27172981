import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Kimlik doğrulama koruması
 * - Giriş yapmamış kullanıcıları /auth sayfasına yönlendirir
 * - Hedef sayfayı location.state.from ile korur
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Yükleme durumunda spinner göster
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Giriş yapılmamışsa Auth sayfasına yönlendir
  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // Giriş yapılmışsa içeriği göster
  return <>{children}</>;
};

export default AuthGuard;
