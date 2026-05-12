import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, DollarSign, Bot, MoreHorizontal, Crown, Bell, Shield } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { AdminSection } from '@/components/admin/AdminSidebar';

interface AdminBottomNavProps {
  activeSection: AdminSection;
  onSectionChange: (s: AdminSection) => void;
}

const triggerHaptic = () => {
  try { Haptics.impact({ style: ImpactStyle.Light }); } catch {}
};

interface MainItem {
  id: AdminSection | 'more';
  label: string;
  icon: React.ElementType;
}

const MAIN_ITEMS: MainItem[] = [
  { id: 'dashboard', label: 'Özet', icon: LayoutDashboard },
  { id: 'users', label: 'Kullanıcı', icon: Users },
  { id: 'revenue', label: 'Gelir', icon: DollarSign },
  { id: 'ai', label: 'AI', icon: Bot },
  { id: 'more', label: 'Daha', icon: MoreHorizontal },
];

const MORE_ITEMS: { id: AdminSection; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'premium', label: 'Premium Planlar', icon: Crown, description: 'Plan dağılımı ve gelir' },
  { id: 'notifications', label: 'Bildirimler', icon: Bell, description: 'Push gönderimi ve geçmiş' },
  { id: 'logs', label: 'Aktivite Logu', icon: Shield, description: 'Admin ve sistem olayları' },
];

const MORE_SECTIONS: AdminSection[] = ['premium', 'notifications', 'logs'];

const AdminBottomNav: React.FC<AdminBottomNavProps> = ({ activeSection, onSectionChange }) => {
  const [moreOpen, setMoreOpen] = useState(false);

  const handleClick = useCallback((id: MainItem['id']) => {
    triggerHaptic();
    if (id === 'more') {
      setMoreOpen(true);
      return;
    }
    onSectionChange(id);
  }, [onSectionChange]);

  const moreActive = MORE_SECTIONS.includes(activeSection);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden" aria-label="Admin sekmeleri">
        <div
          className="mx-3 mb-3 rounded-[22px] bg-card/75 backdrop-blur-2xl border border-border/15 shadow-[0_-4px_32px_-4px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.04)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center py-2 px-1">
            {MAIN_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === 'more' ? moreActive : activeSection === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleClick(item.id)}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="relative flex flex-col items-center justify-center py-1.5 flex-1 min-h-[56px] touch-manipulation rounded-2xl select-none"
                >
                  <div className="relative z-10 flex flex-col items-center gap-1.5">
                    <div className="relative">
                      {isActive && (
                        <motion.div
                          layoutId="adminNavPill"
                          className="absolute -inset-x-3.5 -inset-y-1.5 rounded-2xl bg-primary/10"
                          transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                        />
                      )}
                      <motion.div
                        className="relative"
                        animate={{ scale: isActive ? 1.12 : 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      >
                        <Icon
                          className={cn(
                            'transition-colors duration-200 w-[24px] h-[24px]',
                            isActive ? 'text-primary' : 'text-muted-foreground/55',
                          )}
                          strokeWidth={isActive ? 2.3 : 1.7}
                          {...(isActive ? { fill: 'currentColor', fillOpacity: 0.12 } : {})}
                        />
                      </motion.div>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] leading-none whitespace-nowrap transition-all duration-200',
                        isActive ? 'text-primary font-bold' : 'text-muted-foreground/55 font-medium',
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[24px] border-t border-border/30 p-0 max-h-[85vh]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="mx-auto mt-2 mb-1 h-1.5 w-12 rounded-full bg-muted-foreground/20" />
          <SheetHeader className="px-5 pt-2 pb-1 text-left">
            <SheetTitle className="text-base">Daha fazla</SheetTitle>
          </SheetHeader>
          <div className="px-3 py-3 space-y-1.5">
            {MORE_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    triggerHaptic();
                    onSectionChange(item.id);
                    setMoreOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-2xl transition-colors text-left select-none touch-manipulation',
                    isActive ? 'bg-primary/10' : 'hover:bg-muted/50 active:bg-muted/60',
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      isActive ? 'bg-primary/15' : 'bg-muted/60',
                    )}
                  >
                    <Icon className={cn('w-5 h-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm font-semibold leading-tight', isActive && 'text-primary')}>
                      {item.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AdminBottomNav;
