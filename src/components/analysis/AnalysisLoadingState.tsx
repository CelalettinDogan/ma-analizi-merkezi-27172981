import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Brain, BarChart3, Users, TrendingUp, Check, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AnalysisLoadingStateProps {
  homeTeam: string;
  awayTeam: string;
  homeTeamCrest?: string;
  awayTeamCrest?: string;
}

const LOADING_STEPS = [
  { id: 1, message: 'Form analizi yapılıyor...', icon: TrendingUp },
  { id: 2, message: 'H2H verileri toplanıyor...', icon: Users },
  { id: 3, message: 'İstatistikler hesaplanıyor...', icon: BarChart3 },
  { id: 4, message: 'AI tahminleri oluşturuluyor...', icon: Brain },
  { id: 5, message: 'Sonuçlar hazırlanıyor...', icon: Sparkles },
];

const AnalysisLoadingState: React.FC<AnalysisLoadingStateProps> = ({
  homeTeam,
  awayTeam,
  homeTeamCrest,
  awayTeamCrest,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  // Animate through steps
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < LOADING_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500);

    return () => clearInterval(stepInterval);
  }, []);

  // Animate progress bar
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 95) {
          return prev + Math.random() * 5 + 2;
        }
        return prev;
      });
    }, 300);

    return () => clearInterval(progressInterval);
  }, []);

  // Team logo with fallback
  const TeamLogo = ({ name, crest }: { name: string; crest?: string }) => {
    if (crest) {
      return (
        <img 
          src={crest} 
          alt={name} 
          className="w-16 h-16 object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }
    
    return (
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
        <span className="text-xl font-bold text-primary">
          {name.substring(0, 2).toUpperCase()}
        </span>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      {/* Main Loading Card */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-6 md:p-8">
        {/* Animated background glow */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary/10 to-transparent skew-x-12"
          />
        </div>

        <div className="relative z-10 space-y-6">
          {/* Header with spinner */}
          <div className="flex items-center justify-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Brain className="w-8 h-8 text-primary" />
            </motion.div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              Maç Analiz Ediliyor
            </h2>
          </div>

          {/* Match Info */}
          <div className="flex items-center justify-center gap-4 md:gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <TeamLogo name={homeTeam} crest={homeTeamCrest} />
              <span className="text-sm font-medium text-foreground max-w-[100px] text-center truncate">
                {homeTeam}
              </span>
            </motion.div>

            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex flex-col items-center"
            >
              <span className="text-2xl font-bold text-muted-foreground">VS</span>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <TeamLogo name={awayTeam} crest={awayTeamCrest} />
              <span className="text-sm font-medium text-foreground max-w-[100px] text-center truncate">
                {awayTeam}
              </span>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>İşleniyor...</span>
              <span>{Math.min(Math.round(progress), 95)}%</span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary to-green-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${Math.min(progress, 95)}%` }}
                transition={{ duration: 0.3 }}
              />
              {/* Shimmer effect */}
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
            </div>
          </div>

          {/* Loading Steps */}
          <div className="space-y-2">
            {LOADING_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isComplete = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ 
                    opacity: index <= currentStep ? 1 : 0.4,
                    x: 0 
                  }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    isCurrent ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isComplete 
                      ? 'bg-green-500/20 text-green-500' 
                      : isCurrent 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {isComplete ? (
                      <Check className="w-4 h-4" />
                    ) : isCurrent ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    isComplete 
                      ? 'text-green-500' 
                      : isCurrent 
                        ? 'text-foreground font-medium' 
                        : 'text-muted-foreground'
                  }`}>
                    {step.message}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Skeleton Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            {['AI Öneri', 'Tahminler', 'İstatistikler'].map((label, index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="relative overflow-hidden rounded-xl border border-border bg-card/50 p-4"
              >
                {/* Shimmer overlay */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: 'linear',
                    delay: index * 0.3 
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/50 to-transparent"
                />
                
                <div className="relative space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-muted rounded animate-pulse" />
                    <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="pt-2">
                    <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalysisLoadingState;
