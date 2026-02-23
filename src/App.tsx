import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { AnalysisSetProvider } from "@/contexts/AnalysisSetContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthGuard from "@/components/auth/AuthGuard";
import { Capacitor } from "@capacitor/core";
import { App as CapApp, URLOpenListenerEvent } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { supabase } from "@/integrations/supabase/client";
import { purchaseService } from "@/services/purchaseService";
import Index from "./pages/Index";
import Live from "./pages/Live";
import Standings from "./pages/Standings";
import Premium from "./pages/Premium";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Chat from "./pages/Chat";
import AnalysisHistory from "./pages/AnalysisHistory";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import DeleteAccount from "./pages/DeleteAccount";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import BottomNav from "@/components/navigation/BottomNav";

const queryClient = new QueryClient();

const HIDE_BOTTOM_NAV_ROUTES = ['/auth', '/reset-password', '/terms', '/privacy', '/delete-account', '/admin', '/callback'];

const GlobalBottomNav = () => {
  const location = useLocation();
  if (HIDE_BOTTOM_NAV_ROUTES.includes(location.pathname)) return null;
  return <BottomNav />;
};

// Deep Link Handler Component - must be inside BrowserRouter
const DeepLinkHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const deepLinkListener = CapApp.addListener('appUrlOpen', async (event: URLOpenListenerEvent) => {
        try {
          const url = new URL(event.url);
          
          // OAuth callback için kontrol (golmetrik://callback veya https://*/callback)
          const isCallback = url.protocol === 'golmetrik:' || url.host === 'callback' || url.pathname === '/callback';
          if (isCallback) {
            // URL hash veya search params'dan token'ları al
            const hashParams = new URLSearchParams(url.hash.substring(1));
            const searchParams = url.searchParams;
            
            const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
            
            if (accessToken && refreshToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              // In-app tarayıcıyı kapat
              try {
                await Browser.close();
              } catch (e) {
                // Browser zaten kapalı olabilir
              }
              // Giriş başarılı, ana sayfaya yönlendir
              navigate('/', { replace: true });
            }
          }
        } catch (error) {
          console.error('Deep link işleme hatası:', error);
        }
      });

      return () => {
        deepLinkListener.then(listener => listener.remove());
      };
    }
  }, [navigate]);

  return null;
};

const AppContent = () => {
  // Initialize purchase service
  useEffect(() => {
    purchaseService.initialize().catch(console.error);
  }, []);

  // Handle Android back button
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const backButtonListener = CapApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          CapApp.exitApp();
        }
      });

      return () => {
        backButtonListener.then(listener => listener.remove());
      };
    }
  }, []);

  return (
    <BrowserRouter>
      <DeepLinkHandler />
      <ErrorBoundary>
        <Routes>
          {/* Korumalı Sayfalar - Giriş zorunlu */}
          <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
          <Route path="/live" element={<AuthGuard><Live /></AuthGuard>} />
          <Route path="/standings" element={<AuthGuard><Standings /></AuthGuard>} />
          <Route path="/premium" element={<AuthGuard><Premium /></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
          <Route path="/admin" element={<AuthGuard><Admin /></AuthGuard>} />
          <Route path="/chat" element={<AuthGuard><Chat /></AuthGuard>} />
          <Route path="/analysis-history" element={<AuthGuard><AnalysisHistory /></AuthGuard>} />
          
          {/* Açık Sayfalar - Giriş gerektirmeyen */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/callback" element={<AuthCallback />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
      <GlobalBottomNav />
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <AnalysisSetProvider>
            <Toaster />
            <Sonner />
            <AppContent />
          </AnalysisSetProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
