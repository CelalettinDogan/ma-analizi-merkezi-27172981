import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, Lock, BarChart3, Star, Zap, ArrowLeft, Check, Bot, AlertCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { PLAN_PRICES } from '@/constants/accessLevels';

interface PremiumGateProps {
  onClose?: () => void;
  variant?: 'chatbot' | 'analysis' | 'general';
}

const variantContent = {
  chatbot: {
    title: 'AI Asistan Premium Kullanıcılara Özel',
    subtitle: 'Yapay zeka destekli maç analizlerine erişmek için Premium planına geç',
    icon: Bot,
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
  },
  analysis: {
    title: 'Analiz Limitine Ulaştınız',
    subtitle: 'Sınırsız analiz için Premium planına geçin',
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

const planComparison = [
  { 
    name: 'Basic', 
    price: PLAN_PRICES.premium_basic.monthly,
    chat: '3/gün',
    analysis: 'Sınırsız',
    highlight: false,
  },
  { 
    name: 'Plus', 
    price: PLAN_PRICES.premium_plus.monthly,
    chat: '5/gün',
    analysis: 'Sınırsız',
    highlight: false,
  },
  { 
    name: 'Pro', 
    price: PLAN_PRICES.premium_pro.monthly,
    chat: '10/gün',
    analysis: 'Sınırsız',
    highlight: true,
  },
];

const premiumBenefits = [
  { icon: Bot, label: 'AI Asistan', description: 'Yapay zeka destekli analizler' },
  { icon: BarChart3, label: 'Sınırsız Analiz', description: 'Günlük limit yok' },
  { icon: Sparkles, label: 'Gelişmiş İstatistikler', description: 'Tüm detaylı veriler' },
  { icon: Star, label: 'Reklamsız Deneyim', description: 'Kesintisiz kullanım' },
];

/**
 * Free kullanıcılar için Premium tanıtım sayfası
 * 
 * - Paket karşılaştırma tablosu
 * - Premium avantajları
 * - Play Store uyumlu legal metinler
 */
const PremiumGate: React.FC<PremiumGateProps> = ({ onClose, variant = 'chatbot' }) => {
  const navigate = useNavigate();
  const content = variantContent[variant];
  const IconComponent = content.icon;

  const handleUpgrade = () => {
    navigate('/premium');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50 pt-safe">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose || (() => navigate(-1))}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold">Premium Planlar</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-auto space-y-6"
        >
          {/* Icon */}
          <div className="text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br ${content.gradient} p-0.5`}
            >
              <div className="w-full h-full rounded-3xl bg-background flex items-center justify-center">
                <IconComponent className="w-10 h-10 text-primary" />
              </div>
            </motion.div>
          </div>

          {/* Title & Subtitle */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                Premium Özellik
              </Badge>
            </div>
            <h2 className="text-xl font-bold">{content.title}</h2>
            <p className="text-sm text-muted-foreground">{content.subtitle}</p>
          </div>

          {/* Plan Comparison */}
          <Card className="p-4">
            <p className="text-xs font-medium text-center text-muted-foreground mb-4">
              Paket Karşılaştırması
            </p>
            <div className="space-y-2">
              {planComparison.map((plan) => (
                <div
                  key={plan.name}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    plan.highlight 
                      ? 'bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30' 
                      : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {plan.highlight && <Star className="w-4 h-4 text-primary" />}
                    <span className={`font-medium ${plan.highlight ? 'text-primary' : ''}`}>
                      {plan.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-center">
                      <MessageCircle className="w-3 h-3 mx-auto mb-0.5 text-muted-foreground" />
                      <span>{plan.chat}</span>
                    </div>
                    <div className="font-semibold">
                      ₺{plan.price}/ay
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Benefits */}
          <Card className="p-4 space-y-3">
            <p className="text-xs font-medium text-center text-muted-foreground">
              Premium Avantajları
            </p>
            {premiumBenefits.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{feature.label}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              </motion.div>
            ))}
          </Card>

          {/* Legal notice */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Abonelik otomatik yenilenir. Google Play &gt; Abonelikler'den iptal edebilirsiniz.
            </p>
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

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-border/50">
        <div className="max-w-md mx-auto space-y-3">
          <Button
            onClick={handleUpgrade}
            className="w-full h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90"
            size="lg"
          >
            <Crown className="w-5 h-5 mr-2" />
            Premium Planları Gör
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
      </div>
    </div>
  );
};

export default PremiumGate;
