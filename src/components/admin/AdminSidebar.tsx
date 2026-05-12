import React from 'react';
import {
  LayoutDashboard,
  Users,
  Crown,
  Bot,
  Bell,
  Shield,
  DollarSign,
  ChevronLeft,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export type AdminSection =
  | 'dashboard'
  | 'users'
  | 'premium'
  | 'revenue'
  | 'ai'
  | 'notifications'
  | 'logs';

interface NavItem {
  id: AdminSection;
  label: string;
  icon: React.ElementType;
  group: 'overview' | 'growth' | 'system';
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'overview' },
  { id: 'users', label: 'Kullanıcılar', icon: Users, group: 'overview' },
  { id: 'revenue', label: 'Gelir & MRR', icon: DollarSign, group: 'growth' },
  { id: 'premium', label: 'Premium Planlar', icon: Crown, group: 'growth' },
  { id: 'ai', label: 'AI & Tahmin', icon: Bot, group: 'system' },
  { id: 'notifications', label: 'Bildirimler', icon: Bell, group: 'system' },
  { id: 'logs', label: 'Aktivite Logu', icon: Shield, group: 'system' },
];

const GROUP_LABELS: Record<NavItem['group'], string> = {
  overview: 'GENEL BAKIŞ',
  growth: 'BÜYÜME',
  system: 'SİSTEM',
};

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSectionChange: (s: AdminSection) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeSection, onSectionChange }) => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const grouped: Record<NavItem['group'], NavItem[]> = {
    overview: NAV_ITEMS.filter((i) => i.group === 'overview'),
    growth: NAV_ITEMS.filter((i) => i.group === 'growth'),
    system: NAV_ITEMS.filter((i) => i.group === 'system'),
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight">Admin Panel</p>
              <p className="text-[10px] text-muted-foreground tracking-wide">GolMetrik AI · 2026</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {(Object.keys(grouped) as NavItem['group'][]).map((g) => (
          <SidebarGroup key={g}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] tracking-wider">
                {GROUP_LABELS[g]}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {grouped[g].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={collapsed ? item.label : undefined}
                      >
                        <button
                          onClick={() => onSectionChange(item.id)}
                          className={cn(
                            'w-full flex items-center gap-2.5 text-sm',
                            isActive && 'font-medium',
                          )}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={collapsed ? 'Uygulamaya dön' : undefined}
            >
              <button
                onClick={() => (window.location.href = '/')}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
                {!collapsed && <span>Uygulamaya Dön</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
