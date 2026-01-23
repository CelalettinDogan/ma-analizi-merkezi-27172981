import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X, Zap, MessageCircle, TrendingUp, Star, Sparkles, BarChart3, Smartphone, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

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
  { icon: MessageCircle, label: 'AI Sohbet Asistanı' },
  { icon: BarChart3, label: 'Sınırsız Maç Analizi' },
  { icon: TrendingUp, label: 'Derin İstatistik' },
  { icon: Sparkles, label: 'Reklamsız Deneyim' },
];

const PremiumPromotionModal: React.FC<PremiumPromotionModalProps> = ({
  isOpen,
  type,
  onClose,
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;

  if (!type) return null;

  const content = promotionContent[type];
  const IconComponent = content.icon;

  const handleUpgrade = () => {
    onClose();
    navigate('/profile', { state: { openPremium: true } });
  };

  const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.yourapp';
  const appStoreUrl = 'https://apps.apple.com/app/yourapp';

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

                {/* CTA Buttons - Platform-specific */}
                <div className="space-y-3">
                  {isMobile ? (
                    // Mobile: Direct to premium upgrade
                    <Button
                      onClick={handleUpgrade}
                      className={`w-full h-12 bg-gradient-to-r ${content.gradient} hover:opacity-90 text-white font-semibold rounded-xl`}
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Planları Görüntüle
                    </Button>
                  ) : (
                    // Desktop: Encourage app download
                    <>
                      <div className="text-center mb-3">
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                          <Smartphone className="w-4 h-4" />
                          <span>Premium için mobil uygulamamızı indirin</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 h-11 gap-2"
                          onClick={() => window.open(playStoreUrl, '_blank')}
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                          </svg>
                          Google Play
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 h-11 gap-2"
                          onClick={() => window.open(appStoreUrl, '_blank')}
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                          </svg>
                          App Store
                        </Button>
                      </div>

                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-card px-2 text-muted-foreground">veya</span>
                        </div>
                      </div>

                      <Button
                        onClick={handleUpgrade}
                        variant="secondary"
                        className="w-full h-11"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Web'de Planları Görüntüle
                      </Button>
                    </>
                  )}

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
