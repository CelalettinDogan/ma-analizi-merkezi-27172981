import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Zap, Bot, Crown, Trophy, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAccessLevel } from '@/hooks/useAccessLevel';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: 'premium' | 'live';
}

/**
 * Bottom Navigation Bar — Floating Pill Design
 * 
 * Flicker fix: Uses useState for stable role, only updates when isLoading becomes false.
 * This prevents the Premium tab from flickering on first render for Admin/Premium users.
 */
const BottomNav = React.forwardRef<HTMLElement, { onSearchClick?: () => void }>(({ onSearchClick }, ref) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isPremium, isLoading } = useAccessLevel();
  
  // Stable role state — prevents flicker by only updating when loading completes
  const [stableRole, setStableRole] = useState<'admin' | 'premium' | 'free' | null>(null);

  useEffect(() => {
    if (!isLoading) {
      setStableRole(isAdmin ? 'admin' : isPremium ? 'premium' : 'free');
    }
  }, [isLoading, isAdmin, isPremium]);

  const navItems = useMemo((): NavItem[] => {
    const items: NavItem[] = [
      { icon: Home, label: 'Ana Sayfa', path: '/' },
      { icon: Zap, label: 'Canlı', path: '/live', badge: 'live' },
      { icon: Bot, label: 'AI Asistan', path: '/chat' },
      { icon: Trophy, label: 'Sıralama', path: '/standings' },
    ];

    const role = stableRole;

    // Only show Premium tab for free users
    if (role === null || role === 'free') {
      items.push({ icon: Crown, label: 'Premium', path: '/premium', badge: 'premium' });
    }

    items.push({ icon: User, label: 'Profil', path: '/profile' });

    // Add premium badge to AI chat for free users
    if (role === 'free') {
      const chatItem = items.find(i => i.path === '/chat');
      if (chatItem) chatItem.badge = 'premium';
    }

    return items;
  }, [stableRole]);

  const handleClick = useCallback((item: NavItem, e: React.MouseEvent) => {
    e.preventDefault();
    navigate(item.path);
  }, [navigate]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4" ref={ref}
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
    >
      {/* Floating pill container */}
      <div className="bg-card/80 backdrop-blur-2xl border border-border/30 rounded-[20px] shadow-elevated max-w-md mx-auto overflow-hidden">
        {/* Top shine line */}
        <div className="h-px bg-gradient-to-r from-transparent via-foreground/[0.06] to-transparent" />
        
        <div className="flex items-center justify-evenly py-2 px-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={(e) => handleClick(item, e)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-3",
                  "min-h-[48px]",
                  "touch-manipulation rounded-2xl transition-all duration-200"
                )}
              >
                {/* Active background glow */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/12 rounded-2xl"
                    style={{ boxShadow: '0 0 16px -2px hsl(var(--primary) / 0.2)' }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                
                <motion.div 
                  className="relative z-10"
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Icon 
                    className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} 
                  />
                  {item.badge === 'live' && (
                    <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
                  )}
                  {item.badge === 'premium' && (
                    <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full" />
                  )}
                </motion.div>
                <span className={cn(
                  "text-micro font-medium transition-colors relative z-10",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
