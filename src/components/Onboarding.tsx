import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Trophy, 
  BarChart3, 
  Zap, 
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

interface OnboardingStep {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
}

const steps: OnboardingStep[] = [
  {
    icon: Sparkles,
    iconColor: 'text-yellow-400',
    title: "FutbolTahmin'e Hoş Geldin! ⚽",
    description: "Yapay zeka destekli futbol analiz platformu. Profesyonel istatistikler ve akıllı tahminlerle maçları analiz edin."
  },
  {
    icon: Trophy,
    iconColor: 'text-primary',
    title: "Liginizi Seçin",
    description: "Premier Lig, La Liga, Bundesliga ve daha fazlası. Favori liginizi seçerek maçları görüntüleyin ve analiz edin."
  },
  {
    icon: BarChart3,
    iconColor: 'text-blue-400',
    title: "Detaylı Analiz",
    description: "Form durumu, gol istatistikleri, H2H verisi ve AI destekli tahminler. Bir maça tıklayarak analizi başlatın."
  },
  {
    icon: Zap,
    iconColor: 'text-red-400',
    title: "Canlı Takip",
    description: "Devam eden maçları anlık takip edin. Canlı skorlar ve hızlı analiz için 'Canlı' sekmesini kullanın."
  },
  {
    icon: TrendingUp,
    iconColor: 'text-emerald-400',
    title: "İstatistikleriniz",
    description: "Tahmin geçmişi, başarı oranları ve kupon oluşturma. Dashboard'dan tüm verilerinizi takip edin."
  }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const goToNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (!isFirstStep) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Close button */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
        aria-label="Kapat"
      >
        <X className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Main card */}
      <motion.div 
        className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Progress bar */}
        <div className="px-6 pt-6">
          <Progress value={progress} className="h-1.5" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Adım {currentStep + 1} / {steps.length}</span>
            <button 
              onClick={handleSkip}
              className="hover:text-foreground transition-colors"
            >
              Atla
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8 min-h-[320px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex flex-col items-center text-center"
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                className="mb-6"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-card to-muted flex items-center justify-center border border-border shadow-lg">
                  <Icon className={`w-10 h-10 ${step.iconColor}`} />
                </div>
              </motion.div>

              {/* Title */}
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-2xl font-display font-bold text-foreground mb-3"
              >
                {step.title}
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-muted-foreground leading-relaxed max-w-sm"
              >
                {step.description}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 pb-4">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentStep ? 1 : -1);
                setCurrentStep(index);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentStep 
                  ? 'w-6 bg-primary' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Adım ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3 p-6 pt-0">
          <Button
            variant="outline"
            onClick={goToPrevious}
            disabled={isFirstStep}
            className="flex-1 gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Önceki
          </Button>
          <Button
            onClick={goToNext}
            className="flex-1 gap-1 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90"
          >
            {isLastStep ? 'Başla' : 'Sonraki'}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Onboarding;
