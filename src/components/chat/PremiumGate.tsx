import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Lock, Bot, BarChart3, Sparkles, Star, Zap, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PLAN_PRICES } from '@/constants/accessLevels';

interface PremiumGateProps {
  onClose?: () => void;
  variant?: 'chatbot' | 'analysis' | 'general';
}

const variantContent = {
  chatbot: {
    title: 'AI Asistan',
    subtitle: 'Premium üyelere özel',
    icon: Bot,
  },
  analysis: {
    title: 'Analiz Limiti',
    subtitle: 'Sınırsız analiz için yükselt',
    icon: BarChart3,
  },
  general: {
    title: 'Premium Özellik',
    subtitle: 'Premium üyelere özel',
    icon: Crown,
  },
};

const plans = [
  { name: 'Basic', price: PLAN_PRICES.premium_basic.monthly, chat: '3/gün', highlight: false },
  { name: 'Plus', price: PLAN_PRICES.premium_plus.monthly, chat: '5/gün', highlight: true },
  { name: 'Pro', price: PLAN_PRICES.premium_pro.monthly, chat: '10/gün', highlight: false },
];

const features = [
  { icon: Bot, label: 'AI Asistan' },
  { icon: BarChart3, label: 'Sınırsız Analiz' },
  { icon: Sparkles, label: 'Detaylı İstatistik' },
  { icon: Star, label: 'Reklamsız' },
];

const PremiumGate: React.FC<PremiumGateProps> = ({ onClose, variant = 'chatbot' }) => {
  const navigate = useNavigate();
  const content = variantContent[variant];
  const IconComponent = content.icon;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 pt-safe">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={onClose || (() => navigate(-1))}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-semibold text-base">Premium</h1>
      </header>

      {/* Main content — vertically centered, no scroll */}
      <main className="flex-1 flex flex-col justify-center px-5 gap-4 pb-36">
        {/* Hero: icon + text */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <IconComponent className="w-7 h-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Premium Özellik
              </span>
            </div>
            <h2 className="text-lg font-bold leading-tight">{content.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{content.subtitle}</p>
          </div>
        </motion.div>

        {/* Plan cards — horizontal 3-col */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-2"
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl overflow-hidden flex flex-col items-center text-center ${
                plan.highlight
                  ? 'bg-primary/5 border-2 border-primary shadow-sm'
                  : 'bg-muted/40 border border-border/50'
              }`}
            >
              {plan.highlight && (
                <div className="w-full bg-primary text-primary-foreground text-[9px] font-bold py-1 flex items-center justify-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" />
                  Popüler
                </div>
              )}
              <div className={`flex flex-col items-center py-3 px-1 ${!plan.highlight ? 'pt-4' : ''}`}>
                <span className={`text-xs font-semibold ${plan.highlight ? 'text-primary' : 'text-foreground'}`}>
                  {plan.name}
                </span>
                <span className="text-lg font-bold mt-1">₺{plan.price}</span>
                <span className="text-[10px] text-muted-foreground">/ay</span>
                <span className="text-[10px] text-muted-foreground mt-1.5">
                  {plan.chat} mesaj
                </span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Features — compact inline grid */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-x-3 gap-y-2 px-1"
        >
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground">{f.label}</span>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-background/95 backdrop-blur-lg border-t border-border/30">
        <div className="max-w-md mx-auto space-y-2">
          <Button
            onClick={() => navigate('/premium')}
            className="w-full h-13 text-base font-bold bg-gradient-to-r from-primary to-emerald-500 hover:opacity-90 rounded-2xl shadow-lg"
            size="lg"
          >
            <Crown className="w-5 h-5 mr-2" />
            Premium'a Geç
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            Google Play güvencesiyle • İstediğin zaman iptal
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="w-full text-xs text-muted-foreground py-1 active:opacity-70"
            >
              Daha Sonra
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PremiumGate;
