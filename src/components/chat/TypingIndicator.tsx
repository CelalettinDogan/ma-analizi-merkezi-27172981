import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import varioAvatar from '@/assets/vario-avatar.png';

interface TypingIndicatorProps {
  className?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ className }) => {
  const [statusIndex, setStatusIndex] = useState(0);
  const statuses = ["Düşünüyor", "Analiz yapıyor", "Hazırlanıyor"];

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statuses.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`flex gap-2.5 px-3 py-2 ${className}`}
    >
      {/* Compact Avatar */}
      <img src={varioAvatar} alt="VARio" className="flex-shrink-0 w-7 h-7 rounded-full object-cover shadow-md shadow-emerald-500/15" />

      {/* Typing bubble - minimal */}
      <motion.div 
        className="flex items-center gap-2 px-3 py-2 rounded-2xl rounded-tl-sm bg-card/70 backdrop-blur-lg border border-border/40"
      >
        {/* Animated dots */}
        <div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -3, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.12,
                ease: "easeInOut",
              }}
              className="w-1.5 h-1.5 rounded-full bg-primary"
              style={{ willChange: 'transform' }}
            />
          ))}
        </div>

        {/* Status text - subtle */}
        <motion.span
          key={statusIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] text-muted-foreground"
        >
          {statuses[statusIndex]}...
        </motion.span>
      </motion.div>
    </motion.div>
  );
};

export default TypingIndicator;
