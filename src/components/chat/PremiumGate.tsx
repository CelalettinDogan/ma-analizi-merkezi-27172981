import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, MessageCircle, Lock, BarChart3, Star, Zap, ArrowLeft, Check, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface PremiumGateProps {
  onClose?: () => void;
  variant?: 'chatbot' | 'analysis' | 'general';
}

const variantContent = {
  chatbot: {
    title: 'AI Asistan VIP Üyelere Özel',
    subtitle: 'Yapay zeka destekli maç analizlerine erişmek için VIP üye olun',
    icon: Bot,
    gradient: 'from-primary via-primary/80 to-accent',
  },
  analysis: {
    title: 'Analiz Limitine Ulaştınız',
    subtitle: 'Sınırsız analiz için VIP üye olun',
    icon: BarChart3,
    gradient: 'from-orange-500 to-red-500',
  },
  general: {
    title: 'VIP Özellik',
    subtitle: 'Bu özellik VIP üyelere özel',
    icon: Crown,
    gradient: 'from-amber-500 to-orange-500',
  },
};

const vipFeatures = [
  { icon: Bot, label: 'AI Asistan', description: 'Günde 3 sohbet hakkı' },
  { icon: BarChart3, label: 'Gelişmiş Analizler', description: 'Detaylı maç istatistikleri' },
  { icon: Sparkles, label: 'Özel Tahminler', description: 'AI destekli skor tahminleri' },
  { icon: Star, label: 'Öncelikli Destek', description: 'Hızlı yanıt garantisi' },
];

const PremiumGate: React.FC<PremiumGateProps> = ({ onClose, variant = 'chatbot' }) => {
  const navigate = useNavigate();
  const content = variantContent[variant];
  const IconComponent = content.icon;

  const handleUpgrade = () => {
    navigate('/profile', { state: { openPremium: true } });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose || (() => navigate(-1))}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold">VIP Üyelik</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Icon */}
          <div className="text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className={`w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br ${content.gradient} p-0.5`}
            >
              <div className="w-full h-full rounded-3xl bg-background flex items-center justify-center">
                <IconComponent className="w-12 h-12 text-primary" />
              </div>
            </motion.div>
          </div>

          {/* Title & Subtitle */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                VIP Özellik
              </Badge>
            </div>
            <h2 className="text-2xl font-bold">{content.title}</h2>
            <p className="text-muted-foreground">{content.subtitle}</p>
          </div>

          {/* Features */}
          <Card className="p-4 space-y-3">
            <p className="text-sm font-medium text-center text-muted-foreground">
              VIP üyelik avantajları
            </p>
            {vipFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{feature.label}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
                <Check className="w-4 h-4 text-primary shrink-0" />
              </motion.div>
            ))}
          </Card>

          {/* CTA */}
          <div className="space-y-3">
            <Button
              onClick={handleUpgrade}
              className="w-full h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90"
              size="lg"
            >
              <Crown className="w-5 h-5 mr-2" />
              VIP Üye Ol
            </Button>
            
            {onClose && (
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full"
              >
                Daha Sonra
              </Button>
            )}
          </div>

          {/* Trust Badge */}
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap className="w-3 h-3 text-amber-500" />
              Yıllık planlarda 2 ay bedava!
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PremiumGate;