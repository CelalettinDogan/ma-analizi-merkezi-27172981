import React from 'react';
import { motion } from 'framer-motion';

/**
 * Slow animated radial gradients behind the hero. Pure decoration.
 * Sits absolute at top of the page; pointer-events-none.
 */
const HeroGlow: React.FC = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden -z-10"
  >
    <motion.div
      className="absolute -top-24 -left-12 w-[280px] h-[280px] rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(var(--primary) / 0.18) 0%, transparent 70%)',
        filter: 'blur(20px)',
      }}
      animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
      transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute -top-16 -right-12 w-[260px] h-[260px] rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(45 70% 50% / 0.15) 0%, transparent 70%)',
        filter: 'blur(20px)',
      }}
      animate={{ x: [0, -25, 0], y: [0, 30, 0] }}
      transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
);

export default HeroGlow;
