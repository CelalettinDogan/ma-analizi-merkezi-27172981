import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Brain, BarChart3, Users, TrendingUp, Check, Sparkles } from 'lucide-react';

interface AnalysisLoadingStateProps {
  homeTeam: string;
  awayTeam: string;
  homeTeamCrest?: string;
  awayTeamCrest?: string;
  isComplete?: boolean;
}

const LOADING_STEPS = [
  { id: 1, message: 'Form analizi yapılıyor...', icon: TrendingUp },
  { id: 2, message: 'H2H verileri toplanıyor...', icon: Users },
  { id: 3, message: 'İstatistikler hesaplanıyor...', icon: BarChart3 },
  { id: 4, message: 'AI tahminleri oluşturuluyor...', icon: Brain },
  { id: 5, message: 'Sonuçlar hazırlanıyor...', icon: Sparkles },
];

const TeamLogo = ({ name, crest }: { name: string; crest?: string }) => {
  if (crest) {
    return (
      <img 
        src={crest} 
        alt={name} 
        className="w-14 h-14 object-contain"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  }
  return (
    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
      <span className="text-lg font-semibold text-primary">
        {name.substring(0, 2).toUpperCase()}
      </span>
    </div>
  );
};

const AnalysisLoadingState: React.FC<AnalysisLoadingStateProps> = ({
  homeTeam,
  awayTeam,
  homeTeamCrest,
  awayTeamCrest,
  isComplete = false,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  // When complete, jump to final state
  useEffect(() => {
    if (isComplete) {
      setCurrentStep(LOADING_STEPS.length);
      setProgress(100);
    }
  }, [isComplete]);

  // Animate through steps (slower: 2s per step = 10s total)
  useEffect(() => {
    if (isComplete) return;
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) =>
        prev < LOADING_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 2000);
    return () => clearInterval(stepInterval);
  }, [isComplete]);

  // Animate progress bar (slower, with deceleration after 85%)
  useEffect(() => {
    if (isComplete) return;
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        if (prev >= 85) return prev + Math.random() * 0.5 + 0.2; // very slow after 85%
        return prev + Math.random() * 2 + 1; // slower: +1-3
      });
    }, 500);
    return () => clearInterval(progressInterval);
  }, [isComplete]);

  const displayProgress = Math.min(Math.round(progress), isComplete ? 100 : 92);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="w-full"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 md:p-7">
        {/* Shimmer bg */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary/5 to-transparent skew-x-12"
          />
        </div>

        <div className="relative z-10 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-center gap-2.5">
            <motion.div
              animate={isComplete ? {} : { rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              {isComplete ? (
                <Check className="w-6 h-6 text-green-500" />
              ) : (
                <Brain className="w-6 h-6 text-primary" />
              )}
            </motion.div>
            <h2 className="text-lg font-semibold text-foreground">
              {isComplete ? 'Analiz Tamamlandı' : 'Maç Analiz Ediliyor'}
            </h2>
          </div>

          {/* Teams */}
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-1.5">
              <TeamLogo name={homeTeam} crest={homeTeamCrest} />
              <span className="text-xs font-medium text-foreground max-w-[90px] text-center truncate">
                {homeTeam}
              </span>
            </div>
            <span className="text-lg font-semibold text-muted-foreground">VS</span>
            <div className="flex flex-col items-center gap-1.5">
              <TeamLogo name={awayTeam} crest={awayTeamCrest} />
              <span className="text-xs font-medium text-foreground max-w-[90px] text-center truncate">
                {awayTeam}
              </span>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{isComplete ? 'Tamamlandı' : 'İşleniyor...'}</span>
              <span>{displayProgress}%</span>
            </div>
            <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`absolute inset-y-0 left-0 rounded-full ${
                  isComplete
                    ? 'bg-green-500'
                    : 'bg-gradient-to-r from-primary to-green-500'
                }`}
                animate={{ width: `${displayProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-1.5">
            {LOADING_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isDone = isComplete || index < currentStep;
              const isCurrent = !isComplete && index === currentStep;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg transition-colors ${
                    isCurrent ? 'bg-primary/5' : ''
                  }`}
                  style={{ opacity: index <= currentStep || isComplete ? 1 : 0.35 }}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      isDone
                        ? 'bg-green-500/15 text-green-500'
                        : isCurrent
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-3 h-3" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Icon className="w-2.5 h-2.5" />
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      isDone
                        ? 'text-green-500'
                        : isCurrent
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {step.message}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Skeleton cards */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {['AI Öneri', 'Tahminler', 'İstatistikler'].map((label, i) => (
              <div
                key={label}
                className="relative overflow-hidden rounded-xl border border-border/40 bg-card/50 p-3"
              >
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: i * 0.3 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-transparent"
                />
                <div className="relative space-y-2">
                  <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                  <div className="h-2 w-full bg-muted rounded animate-pulse" />
                  <div className="h-2 w-2/3 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalysisLoadingState;
