import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StandingsSegmentedControlProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'standings', label: 'Puan', icon: Trophy },
  { id: 'goals', label: 'Goller', icon: Target },
  { id: 'form', label: 'Form', icon: TrendingUp },
];

const StandingsSegmentedControl: React.FC<StandingsSegmentedControlProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="relative bg-muted/50 rounded-xl p-1 border border-border/30">
      <div className="relative flex">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "relative z-10 flex-1 flex items-center justify-center gap-1.5",
                "py-2.5 rounded-lg text-xs font-semibold",
                "transition-colors duration-200 touch-manipulation",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="segmentedPill"
                  className="absolute inset-0 bg-card rounded-lg shadow-sm border border-border/40"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default StandingsSegmentedControl;
