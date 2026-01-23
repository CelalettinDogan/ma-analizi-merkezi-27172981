import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X, Zap, MessageCircle, TrendingUp, Star, Sparkles, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PremiumPromotionModalProps {
  isOpen: boolean;
  type: 'limit' | 'feature' | 'general' | 'chatbot' | null;
  onClose: () => void;
}

const promotionContent = {
  limit: {
    title: 'Analiz Limitine Ulaştınız!',
    subtitle: 'Günlük 2 ücretsiz analiz hakkınız doldu',
    description: 'Premium ile sınırsız maç analizi yapın ve AI asistandan yararlanın.',
    icon: BarChart3,
    gradient: 'from-orange-500 to-red-500',
  },
  feature: {
    title: 'Premium Özellik',
    subtitle: 'Bu özellik Premium üyelere özel',
    description: 'Derin analiz, xG verileri ve taktik içgörüler için Premium\'a yükseltin.',
    icon: Star,
    gradient: 'from-purple-500 to-pink-500',
  },
  general: {
    title: 'Premium\'a Yükseltin',
    subtitle: 'Futbol analizinde bir adım önde olun',
    description: 'AI destekli tahminler, sınırsız analiz ve çok daha fazlası sizi bekliyor.',
    icon: Crown,
    gradient: 'from-amber-500 to-orange-500',
  },
  chatbot: {
    title: 'AI Asistan Premium\'a Özel',
    subtitle: 'Kişisel futbol danışmanınız',
    description: 'AI Asistan ile maç analizi yapın, tahmin alın ve sorularınızı sorun.',
    icon: MessageCircle,
    gradient: 'from-blue-500 to-cyan-500',
  },
};

const features = [
  { icon: MessageCircle, label: 'AI Sohbet Asistanı', free: false },
  { icon: BarChart3, label: 'Sınırsız Maç Analizi', free: false },
  { icon: TrendingUp, label: 'Derin İstatistik', free: false },
  { icon: Sparkles, label: 'Reklamsız Deneyim', free: false },
];

const PremiumPromotionModal: React.FC<PremiumPromotionModalProps> = ({
  isOpen,
  type,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!type) return null;

  const content = promotionContent[type];
  const IconComponent = content.icon;

  const handleUpgrade = () => {
    onClose();
    navigate('/profile', { state: { openPremium: true } });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
              {/* Header with gradient */}
              <div className={`bg-gradient-to-r ${content.gradient} p-6 relative`}>
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-4"
                >
                  <IconComponent className="w-8 h-8 text-white" />
                </motion.div>

                <h2 className="text-2xl font-bold text-white mb-1">{content.title}</h2>
                <p className="text-white/80">{content.subtitle}</p>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-muted-foreground mb-6">{content.description}</p>

                {/* Features list */}
                <div className="space-y-3 mb-6">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <feature.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{feature.label}</span>
                      <div className="ml-auto">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          Premium
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleUpgrade}
                    className={`w-full h-12 bg-gradient-to-r ${content.gradient} hover:opacity-90 text-white font-semibold rounded-xl`}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Planları Görüntüle
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className="w-full text-muted-foreground"
                  >
                    Daha sonra
                  </Button>
                </div>

                {/* Discount badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-4 text-center"
                >
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Zap className="w-3 h-3 text-amber-500" />
                    Yıllık planlarda 2 ay bedava!
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PremiumPromotionModal;
