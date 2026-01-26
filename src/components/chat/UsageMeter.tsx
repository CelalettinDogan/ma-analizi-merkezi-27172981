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

// Circular Progress Component
const CircularProgress: React.FC<{
  percentage: number;
  isExhausted: boolean;
  isLow: boolean;
}> = ({ percentage, isExhausted, isLow }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on status
  const strokeColor = isExhausted 
    ? 'hsl(var(--destructive))' 
    : isLow 
      ? '#eab308' // yellow-500
      : 'hsl(var(--primary))';

  return (
    <div className="relative w-12 h-12">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
        {/* Background circle */}
        <circle
          cx="22"
          cy="22"
          r={radius}
          className="fill-none stroke-muted"
          strokeWidth="3"
        />
        {/* Progress circle */}
        <motion.circle
          cx="22"
          cy="22"
          r={radius}
          className="fill-none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Zap className={cn(
          "w-4 h-4",
          isExhausted ? "text-destructive" : isLow ? "text-yellow-500" : "text-primary"
        )} />
      </div>
      
      {/* Pulse effect when low */}
      {isLow && !isExhausted && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-yellow-500"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
};

const UsageMeter: React.FC<UsageMeterProps> = ({ current, limit, isAdmin, className }) => {
  // Admin has unlimited access
  if (isAdmin) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-t border-amber-500/20",
          className
        )}
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
          <Crown className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              Admin
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
              Sınırsız
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Tüm özelliklere tam erişim
          </p>
        </div>
      </motion.div>
    );
  }

  // Regular user usage meter
  const numericCurrent = typeof current === 'number' ? current : parseInt(current) || 0;
  const numericLimit = typeof limit === 'number' ? limit : parseInt(limit) || 3;
  
  const remaining = numericLimit - numericCurrent;
  const percentage = Math.min((numericCurrent / numericLimit) * 100, 100);
  const isExhausted = remaining <= 0;
  const isLow = remaining === 1;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 bg-card/80 backdrop-blur-sm border-t border-border/50",
        isExhausted && "bg-destructive/5 border-destructive/20",
        className
      )}
    >
      {/* Circular Progress */}
      <CircularProgress 
        percentage={percentage} 
        isExhausted={isExhausted} 
        isLow={isLow} 
      />
      
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className={cn(
            "text-sm font-medium",
            isExhausted ? "text-destructive" : isLow ? "text-yellow-600 dark:text-yellow-400" : "text-foreground"
          )}>
            {isExhausted 
              ? "Limit doldu" 
              : isLow 
                ? "Son 1 hak kaldı!" 
                : `${remaining} hak kaldı`
            }
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {numericCurrent}/{numericLimit}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              isExhausted 
                ? "bg-destructive" 
                : isLow 
                  ? "bg-yellow-500" 
                  : "bg-primary"
            )}
          />
        </div>

        {/* Renewal info */}
        {isExhausted && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] text-muted-foreground mt-1"
          >
            Yarın 00:00'da yenilenir
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

export default UsageMeter;
