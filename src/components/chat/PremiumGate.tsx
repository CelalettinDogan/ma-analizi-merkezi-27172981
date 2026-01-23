import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, MessageCircle, TrendingUp, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PremiumGateProps {
  onClose?: () => void;
}

const features = [
  { icon: MessageCircle, label: 'Günlük 3 AI sohbet hakkı' },
  { icon: TrendingUp, label: 'Detaylı maç analizleri' },
  { icon: Sparkles, label: 'Kişiselleştirilmiş öneriler' },
];

const PremiumGate: React.FC<PremiumGateProps> = ({ onClose }) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/profile', { state: { openPremium: true } });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full p-6 text-center"
    >
      {/* Lock Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30"
      >
        <Crown className="w-10 h-10 text-white" />
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-bold mb-2"
      >
        AI Asistan'a Erişim
      </motion.h2>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-muted-foreground mb-6 max-w-sm"
      >
        Premium üyelikle AI futbol danışmanınıza 7/24 erişim sağlayın
      </motion.p>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3 mb-8 w-full max-w-xs"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <feature.icon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium">{feature.label}</span>
          </motion.div>
        ))}
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
          className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/30"
        >
          <Crown className="w-4 h-4 mr-2" />
          Premium'a Yükselt
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
