import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsageMeterProps {
  current: number | string;
  limit: number | string;
  isAdmin?: boolean;
  className?: string;
}

const UsageMeter: React.FC<UsageMeterProps> = ({ current, limit, isAdmin, className }) => {
  // Admin has unlimited access - compact display
  if (isAdmin) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-t border-amber-500/20",
          className
        )}
      >
        <Crown className="w-4 h-4 text-amber-500" />
        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
          Sınırsız Erişim
        </span>
      </motion.div>
    );
  }

  // Regular user - horizontal compact bar
  const numericCurrent = typeof current === 'number' ? current : parseInt(current) || 0;
  const numericLimit = typeof limit === 'number' ? limit : parseInt(limit) || 3;
  
  const remaining = numericLimit - numericCurrent;
  const percentage = Math.min((numericCurrent / numericLimit) * 100, 100);
  const isExhausted = remaining <= 0;
  const isLow = remaining === 1;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "flex items-center gap-3 px-4 py-2 bg-card/50 border-t border-border/50 shrink-0",
        isExhausted && "bg-destructive/5 border-destructive/20",
        className
      )}
    >
      {/* Icon */}
      <Zap className={cn(
        "w-4 h-4 shrink-0",
        isExhausted ? "text-destructive" : isLow ? "text-amber-500" : "text-primary"
      )} />
      
      {/* Usage text */}
      <span className={cn(
        "text-xs font-medium shrink-0",
        isExhausted ? "text-destructive" : isLow ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
      )}>
        {isExhausted ? "Limit doldu" : `${remaining} hak`}
      </span>
      
      {/* Progress bar - flex grows */}
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            isExhausted 
              ? "bg-destructive" 
              : isLow 
                ? "bg-amber-500" 
                : "bg-primary"
          )}
        />
      </div>
      
      {/* Counter */}
      <span className="text-[10px] text-muted-foreground shrink-0">
        {numericCurrent}/{numericLimit}
      </span>
    </motion.div>
  );
};

export default UsageMeter;
