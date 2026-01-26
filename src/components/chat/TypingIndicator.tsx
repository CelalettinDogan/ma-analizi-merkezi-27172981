import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

interface TypingIndicatorProps {
  className?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ className }) => {
  const [statusIndex, setStatusIndex] = useState(0);
  const statuses = ["Düşünüyor", "Analiz yapıyor", "Yanıt hazırlanıyor"];

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statuses.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={`flex gap-3 p-4 ${className}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
        <Bot className="w-4 h-4 text-white" />
      </div>

      {/* Typing bubble */}
      <motion.div 
        className="flex items-center gap-3 px-4 py-3 rounded-2xl rounded-tl-sm bg-card/80 backdrop-blur-xl border border-border/50 shadow-sm"
        animate={{ 
          boxShadow: [
            '0 0 0 0 hsl(var(--primary) / 0)',
            '0 0 0 4px hsl(var(--primary) / 0.1)',
            '0 0 0 0 hsl(var(--primary) / 0)'
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {/* Animated dots */}
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -6, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
              className="w-2 h-2 rounded-full bg-primary"
            />
          ))}
        </div>

        {/* Dynamic status text */}
        <motion.span
          key={statusIndex}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 5 }}
          className="text-xs text-muted-foreground font-medium"
        >
          {statuses[statusIndex]}...
        </motion.span>
      </motion.div>
    </motion.div>
  );
};

export default TypingIndicator;
