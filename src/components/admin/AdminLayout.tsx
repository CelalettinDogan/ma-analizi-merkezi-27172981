import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ChevronRight,
  Search,
  Activity,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import AdminSidebar, { NAV_ITEMS, AdminSection } from '@/components/admin/AdminSidebar';
import { cn } from '@/lib/utils';

export type { AdminSection };

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  onOpenCommandPalette?: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeSection,
  onSectionChange,
  onOpenCommandPalette,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const activeItem = NAV_ITEMS.find((i) => i.id === activeSection);

  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
  const cmdKey = isMac ? '⌘' : 'Ctrl';

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AdminSidebar activeSection={activeSection} onSectionChange={onSectionChange} />
        </div>

        <SidebarInset className="flex flex-col min-w-0">
          {/* Top Bar (desktop) */}
          <header className="hidden md:flex sticky top-0 z-30 h-12 items-center gap-3 border-b border-border bg-background/80 backdrop-blur px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border" />
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
              <span className="text-muted-foreground">Admin</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-medium">{activeItem?.label || 'Dashboard'}</span>
            </nav>

            <div className="ml-auto flex items-center gap-2">
              {/* Command palette trigger */}
              {onOpenCommandPalette && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenCommandPalette}
                  className="gap-2 h-8 text-muted-foreground hover:text-foreground"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Ara veya komut çalıştır</span>
                  <kbd className="ml-1 hidden lg:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    <span>{cmdKey}</span>K
                  </kbd>
                </Button>
              )}
              <Badge variant="outline" className="gap-1.5 text-emerald-500 border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </Badge>
            </div>
          </header>

          {/* Mobile Header */}
          <header className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border pt-safe">
            <div className="flex items-center justify-between px-3 py-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileNavOpen((v) => !v)}
                className="h-9 w-9"
                aria-label="Menü"
              >
                {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Activity className="w-4 h-4 text-primary" />
                {activeItem?.label || 'Admin'}
              </div>
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-[10px]">
                Live
              </Badge>
            </div>

            {/* Mobile horizontal tab strip */}
            <ScrollArea className="w-full">
              <div className="flex px-2 py-1.5 gap-1 min-w-max">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSectionChange(item.id);
                        setMobileNavOpen(false);
                      }}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground bg-muted/40',
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </header>

          {/* Mobile drawer overlay (extra menu — kept simple) */}
          <AnimatePresence>
            {mobileNavOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setMobileNavOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto pb-safe">
            <div className="container mx-auto p-3 md:p-6 max-w-7xl">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
