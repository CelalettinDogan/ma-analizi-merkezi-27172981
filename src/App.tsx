import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnalysisSetProvider } from "@/contexts/AnalysisSetContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthGuard from "@/components/auth/AuthGuard";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
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
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
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
