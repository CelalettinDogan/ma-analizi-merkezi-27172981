import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Lock, Download, MessageCircle, BarChart3, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STORE_LINKS, getStoreLink } from '@/hooks/usePlatformPremium';

interface WebPremiumGateProps {
  onClose?: () => void;
  variant?: 'chatbot' | 'analysis' | 'general';
}

const variantContent = {
  chatbot: {
    title: 'AI Asistan Mobil Uygulamada',
    subtitle: 'Kişisel futbol danışmanınız mobil uygulamada sizi bekliyor',
    icon: MessageCircle,
    gradient: 'from-emerald-500 to-teal-600',
  },
  analysis: {
    title: 'Sınırsız Analiz Mobil Uygulamada',
    subtitle: 'Günlük web limitiniz doldu. Mobil uygulamada sınırsız analiz yapabilirsiniz.',
    icon: BarChart3,
    gradient: 'from-orange-500 to-red-500',
  },
  general: {
    title: 'Premium Özellik Mobil Uygulamada',
    subtitle: 'Bu özellik mobil uygulamamızda Premium kullanıcılara açıktır',
    icon: Smartphone,
    gradient: 'from-blue-500 to-cyan-500',
  },
};

const features = [
  { icon: MessageCircle, label: 'AI Asistan', description: 'Yapay zeka destekli maç analizi' },
  { icon: BarChart3, label: 'Sınırsız Analiz', description: 'Günlük limit yok' },
  { icon: Sparkles, label: 'Reklamsız', description: 'Kesintisiz deneyim' },
];

const WebPremiumGate: React.FC<WebPremiumGateProps> = ({ onClose, variant = 'chatbot' }) => {
  const content = variantContent[variant];
  const IconComponent = content.icon;

  const handleDownloadApp = () => {
    const storeLink = getStoreLink();
    window.open(storeLink, '_blank', 'noopener,noreferrer');
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

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2 mb-6 w-full max-w-xs"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
          >
            <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
              <feature.icon className="w-4 h-4 text-primary" />
            </div>
            <div className="text-left">
              <span className="font-semibold text-sm">{feature.label}</span>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </div>
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
          onClick={handleDownloadApp}
          className={`w-full h-12 bg-gradient-to-r ${content.gradient} hover:opacity-90 text-white font-semibold rounded-xl shadow-lg`}
        >
          <Download className="w-4 h-4 mr-2" />
          Uygulamayı İndir
        </Button>

        {/* Store badges */}
        <div className="flex items-center justify-center gap-4 py-2">
          <a
            href={STORE_LINKS.playStore}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-70 hover:opacity-100 transition-opacity"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
              alt="Google Play"
              className="h-9"
            />
          </a>
          <a
            href={STORE_LINKS.appStore}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-70 hover:opacity-100 transition-opacity"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
              alt="App Store"
              className="h-9"
            />
          </a>
        </div>

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

      {/* Info badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-4"
      >
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Zap className="w-3 h-3 text-emerald-500" />
          Premium özellikler sadece mobil uygulamada
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

export default WebPremiumGate;
