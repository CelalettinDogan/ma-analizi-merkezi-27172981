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
      className={`flex gap-2 px-3 py-[5px] items-end ${className}`}
    >
      {/* Avatar */}
      <img src={varioAvatar} alt="VARio" className="flex-shrink-0 w-8 h-8 rounded-full object-cover shadow-md shadow-emerald-500/15" />

      {/* Typing bubble */}
      <motion.div 
        className="flex items-center gap-2 px-4 py-3 rounded-[20px] rounded-tl-md bg-muted/60 backdrop-blur-xl border border-border/30 shadow-sm shadow-black/5"
      >
        {/* Animated dots */}
        <div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -4, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.12,
                ease: "easeInOut",
              }}
              className="w-1.5 h-1.5 rounded-full bg-primary"
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
