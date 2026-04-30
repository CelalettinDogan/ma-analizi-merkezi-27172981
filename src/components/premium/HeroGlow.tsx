import React from 'react';

/**
 * GPU-optimized ambient glow using CSS keyframes instead of framer-motion.
 * Respects prefers-reduced-motion.
 */
const HeroGlow: React.FC = () => (
  <>
    <style>{`
      @keyframes hero-glow-1 {
        0%, 100% { transform: translate3d(0, 0, 0); }
        50% { transform: translate3d(30px, 20px, 0); }
      }
      @keyframes hero-glow-2 {
        0%, 100% { transform: translate3d(0, 0, 0); }
        50% { transform: translate3d(-25px, 30px, 0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .hero-glow-orb { animation: none !important; }
      }
    `}</style>
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden -z-10"
    >
      <div
        className="hero-glow-orb absolute -top-24 -left-12 w-[280px] h-[280px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.18) 0%, transparent 70%)',
          filter: 'blur(20px)',
          willChange: 'transform',
          animation: 'hero-glow-1 12s ease-in-out infinite',
        }}
      />
      <div
        className="hero-glow-orb absolute -top-16 -right-12 w-[260px] h-[260px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(45 70% 50% / 0.15) 0%, transparent 70%)',
          filter: 'blur(20px)',
          willChange: 'transform',
          animation: 'hero-glow-2 14s ease-in-out infinite',
        }}
      />
    </div>
  </>
);

export default HeroGlow;
