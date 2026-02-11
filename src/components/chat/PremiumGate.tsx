import React from 'react';
import { motion } from 'framer-motion';
import { Bot, ArrowLeft, BarChart3, Shield, Zap, Star, Crown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PremiumGateProps {
  onClose?: () => void;
  variant?: 'chatbot' | 'analysis' | 'general';
}

const features = [
  { icon: Bot, text: 'Sınırsız AI maç yorumu' },
  { icon: BarChart3, text: 'Detaylı istatistik açıklamaları' },
  { icon: Shield, text: 'Risk seviyesi analizi' },
  { icon: Zap, text: 'Canlı maç içgörüleri' },
  { icon: Star, text: 'Reklamsız deneyim' },
];

const PremiumGate: React.FC<PremiumGateProps> = ({ onClose, variant = 'chatbot' }) => {
  const navigate = useNavigate();

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
        <h1 className="font-semibold text-base">AI Asistan</h1>
      </header>

      {/* Main — scroll-free, centered */}
      <main className="flex-1 flex flex-col justify-center px-5 gap-4 xs:gap-5 pb-32">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-1.5 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Bot className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-lg xs:text-xl font-bold leading-tight mt-1">AI Asistan</h2>
          <p className="text-xs xs:text-sm text-muted-foreground">Sınırsız Yapay Zeka Maç Analizi</p>
        </motion.div>

        {/* Chat Preview — blurred */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl border border-border/40 bg-muted/30 p-3.5"
        >
          <div className="space-y-3">
            {/* User bubble */}
            <div className="flex justify-end">
              <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-primary/15 px-3.5 py-2.5">
                <p className="text-xs text-foreground">Fenerbahçe - Galatasaray maçını analiz et</p>
              </div>
            </div>
            {/* AI bubble */}
            <div className="flex gap-2">
              <div className="shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-card/80 border border-border/30 px-3.5 py-2.5">
                <p className="text-xs text-foreground/80">
                  Fenerbahçe son 5 maçta %72 galibiyet oranı yakaladı. Ev sahibi avantajı ve form durumu göz önüne alındığında...
                </p>
              </div>
            </div>
          </div>
          {/* Fade overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent 20%, hsl(var(--background)) 95%)',
            }}
          />
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2.5 px-1"
        >
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs xs:text-sm text-muted-foreground">{f.text}</span>
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
            AI Asistanı Aç
          </Button>
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
