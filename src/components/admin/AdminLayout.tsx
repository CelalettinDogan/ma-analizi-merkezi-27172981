import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Crown, 
  Bot, 
  Bell, 
  Shield,
  Menu,
  X,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export type AdminSection = 
  | 'dashboard' 
  | 'users' 
  | 'premium' 
  | 'ai' 
  | 'notifications' 
  | 'logs';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}

interface NavItem {
  id: AdminSection;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Panel', icon: LayoutDashboard },
  { id: 'users', label: 'Kullanıcılar', shortLabel: 'Kullanıcı', icon: Users },
  { id: 'premium', label: 'Premium', shortLabel: 'Premium', icon: Crown },
  { id: 'ai', label: 'AI & Analiz', shortLabel: 'AI', icon: Bot },
  { id: 'notifications', label: 'Bildirimler', shortLabel: 'Bildirim', icon: Bell },
  { id: 'logs', label: 'Aktivite Logu', shortLabel: 'Log', icon: Shield },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  activeSection, 
  onSectionChange 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavClick = (section: AdminSection) => {
    onSectionChange(section);
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 md:translate-x-0 md:static pt-safe hidden md:block",
          sidebarOpen ? "translate-x-0 !block" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-sm">Admin Panel</h2>
                <p className="text-xs text-muted-foreground">GolMetrik AI</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </ScrollArea>

          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-muted-foreground"
              onClick={() => window.location.href = '/'}
            >
              <ChevronLeft className="w-4 h-4" />
              Uygulamaya Dön
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border md:hidden pt-safe">
          <div className="flex items-center justify-between px-3 py-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = '/'}
              className="w-8 h-8"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">Admin</span>
            </div>
            <Badge variant="outline" className="text-green-500 border-green-500/30 text-[10px]">
              Online
            </Badge>
          </div>
        </header>

        {/* Mobile Tab Navigation */}
        <div className="md:hidden sticky top-[calc(env(safe-area-inset-top)+44px)] z-20 bg-background border-b border-border">
          <ScrollArea className="w-full">
            <div className="flex px-2 py-1.5 gap-1 min-w-max">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground bg-muted/50"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.shortLabel}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto pb-safe">
          <div className="container mx-auto p-3 md:p-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
