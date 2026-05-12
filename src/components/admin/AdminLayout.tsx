import React from 'react';
import { ChevronLeft, Search, Activity, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import AdminSidebar, { NAV_ITEMS, AdminSection } from '@/components/admin/AdminSidebar';
import AdminBottomNav from '@/components/admin/AdminBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const activeItem = NAV_ITEMS.find((i) => i.id === activeSection);

  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
  const cmdKey = isMac ? '⌘' : 'Ctrl';

  // ====== MOBILE: Native shell with bottom tabs ======
  if (isMobile) {
    return (
      <div
        className="bg-background flex flex-col select-none"
        style={{ height: 'var(--app-height, 100vh)' }}
      >
        {/* Native top bar */}
        <header
          className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/40"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center justify-between px-2 h-12">
            <button
              onClick={() => {
                try { Haptics.impact({ style: ImpactStyle.Light }); } catch {}
                navigate('/');
              }}
              className="w-11 h-11 -ml-1 flex items-center justify-center rounded-full active:bg-muted/60 touch-manipulation"
              aria-label="Geri"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-1.5 text-sm font-semibold truncate px-2">
              <Activity className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">{activeItem?.label || 'Admin'}</span>
            </div>
            <div className="w-11 h-11 flex items-center justify-end">
              <Badge variant="outline" className="gap-1 text-emerald-500 border-emerald-500/30 text-[10px] px-1.5 py-0.5 h-5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </Badge>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main
          className="flex-1 overflow-y-auto"
          style={{
            paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
            overscrollBehavior: 'none',
          }}
        >
          <div className="p-3">{children}</div>
        </main>

        {/* Bottom nav */}
        <AdminBottomNav activeSection={activeSection} onSectionChange={onSectionChange} />
      </div>
    );
  }

  // ====== DESKTOP: Existing sidebar shell ======
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar activeSection={activeSection} onSectionChange={onSectionChange} />

        <SidebarInset className="flex flex-col min-w-0">
          <header className="sticky top-0 z-30 h-12 flex items-center gap-3 border-b border-border bg-background/80 backdrop-blur px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border" />
            <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
              <span className="text-muted-foreground">Admin</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-medium">{activeItem?.label || 'Dashboard'}</span>
            </nav>

            <div className="ml-auto flex items-center gap-2">
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

          <main className="flex-1 overflow-y-auto pb-safe">
            <div className="container mx-auto p-3 md:p-6 max-w-7xl">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
