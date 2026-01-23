import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsageMeterProps {
  current: number;
  limit: number;
  className?: string;
}

const UsageMeter: React.FC<UsageMeterProps> = ({ current, limit, className }) => {
  const remaining = limit - current;
  const percentage = (current / limit) * 100;
  const isExhausted = remaining <= 0;
  const isLow = remaining === 1;

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2 bg-card/80 backdrop-blur-sm border-t border-border/50",
      className
    )}>
      <div className="flex items-center gap-2 flex-1">
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center",
          isExhausted ? "bg-destructive/20" : isLow ? "bg-yellow-500/20" : "bg-primary/20"
        )}>
          {isExhausted ? (
            <Clock className="w-3.5 h-3.5 text-destructive" />
          ) : (
            <Sparkles className={cn(
              "w-3.5 h-3.5",
              isLow ? "text-yellow-500" : "text-primary"
            )} />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">
              {isExhausted ? "Limit doldu" : `${remaining} hak kaldı`}
            </span>
            <span className="text-xs font-medium">
              {current}/{limit}
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
        </div>
      </div>

      {isExhausted && (
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          Yarın yenilenir
        </span>
      )}
    </div>
  );
};

export default UsageMeter;
