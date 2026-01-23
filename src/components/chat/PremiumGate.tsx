import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, MessageCircle, TrendingUp, Lock, BarChart3, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PremiumGateProps {
  onClose?: () => void;
  variant?: 'chatbot' | 'analysis' | 'general';
}

const variantContent = {
  chatbot: {
    title: 'AI Asistan Premium\'a Özel',
    subtitle: 'Kişisel futbol danışmanınız sizi bekliyor',
    icon: MessageCircle,
    gradient: 'from-emerald-500 to-teal-600',
  },
  analysis: {
    title: 'Analiz Limitine Ulaştınız',
    subtitle: 'Günlük 2 ücretsiz analiz hakkınız doldu',
    icon: BarChart3,
    gradient: 'from-orange-500 to-red-500',
  },
  general: {
    title: 'Premium Özellik',
    subtitle: 'Bu özellik Premium üyelere özel',
    icon: Crown,
    gradient: 'from-amber-500 to-orange-500',
  },
};

const plans = [
  { name: 'Temel', price: '₺49/ay', aiChat: '5/gün', analysis: '10/gün' },
  { name: 'Pro', price: '₺99/ay', aiChat: 'Sınırsız', analysis: 'Sınırsız', popular: true },
  { name: 'Ultra', price: '₺149/ay', aiChat: 'Sınırsız', analysis: 'Sınırsız' },
];

const PremiumGate: React.FC<PremiumGateProps> = ({ onClose, variant = 'chatbot' }) => {
  const navigate = useNavigate();
  const content = variantContent[variant];
  const IconComponent = content.icon;

  const handleUpgrade = () => {
    navigate('/profile', { state: { openPremium: true } });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full p-6 text-center relative"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className={`w-20 h-20 rounded-full bg-gradient-to-br ${content.gradient} flex items-center justify-center mb-6 shadow-lg`}
      >
        <IconComponent className="w-10 h-10 text-white" />
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-bold mb-2"
      >
        {content.title}
      </motion.h2>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-muted-foreground mb-6 max-w-sm"
      >
        {content.subtitle}
      </motion.p>

      {/* Mini Plan Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2 mb-6 w-full max-w-xs"
      >
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className={`flex items-center justify-between p-3 rounded-xl border ${
              plan.popular 
                ? 'bg-primary/10 border-primary/30' 
                : 'bg-card border-border'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{plan.name}</span>
              {plan.popular && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                  Popüler
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-sm font-bold">{plan.price}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Features highlight */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-4 text-xs text-muted-foreground mb-6"
      >
        <div className="flex items-center gap-1">
          <MessageCircle className="w-3 h-3" />
          <span>AI Chat</span>
        </div>
        <div className="flex items-center gap-1">
          <BarChart3 className="w-3 h-3" />
          <span>Sınırsız Analiz</span>
        </div>
        <div className="flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Reklamsız</span>
        </div>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="w-full max-w-xs space-y-3"
      >
        <Button
          onClick={handleUpgrade}
          className={`w-full h-12 bg-gradient-to-r ${content.gradient} hover:opacity-90 text-white font-semibold rounded-xl shadow-lg`}
        >
          <Crown className="w-4 h-4 mr-2" />
          Planları Görüntüle
        </Button>

        {onClose && (
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-muted-foreground"
          >
            Daha sonra
          </Button>
        )}
      </motion.div>

      {/* Discount badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-4"
      >
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Zap className="w-3 h-3 text-amber-500" />
          Yıllık planlarda 2 ay bedava!
        </span>
      </motion.div>

      {/* Decorative lock */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
        className="absolute top-4 right-4"
      >
        <Lock className="w-5 h-5 text-muted-foreground" />
      </motion.div>
    </motion.div>
  );
};

export default PremiumGate;
