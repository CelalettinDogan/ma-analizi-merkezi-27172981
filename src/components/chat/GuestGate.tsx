import React from 'react';
import { motion } from 'framer-motion';
import { Bot, LogIn, UserPlus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface GuestGateProps {
  onClose?: () => void;
}

/**
 * Guest (giriş yapmamış) kullanıcılar için bilgilendirme ekranı
 * 
 * - Giriş yap / Kayıt ol CTA'ları
 * - AI Asistan tanıtımı
 */
const GuestGate: React.FC<GuestGateProps> = ({ onClose }) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/auth', { state: { from: '/chat', mode: 'login' } });
  };

  const handleSignup = () => {
    navigate('/auth', { state: { from: '/chat', mode: 'signup' } });
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
            <h1 className="font-semibold">AI Asistan</h1>
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
              className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5"
            >
              <div className="w-full h-full rounded-3xl bg-background flex items-center justify-center">
                <Bot className="w-12 h-12 text-emerald-500" />
              </div>
            </motion.div>
          </div>

          {/* Title & Description */}
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold">AI Asistan'a Hoş Geldin</h2>
            <p className="text-muted-foreground">
              Yapay zeka destekli maç analizleri ve tahminler için giriş yapman gerekiyor.
            </p>
          </div>

          {/* Features Card */}
          <Card className="p-4 space-y-3 bg-muted/30">
            <p className="text-sm font-medium text-center text-muted-foreground">
              AI Asistan ile:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Maç tahminleri ve analizler
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Takım form değerlendirmesi
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                İstatistik bazlı öngörüler
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                H2H ve lig analizleri
              </li>
            </ul>
          </Card>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleLogin}
              className="w-full h-14 text-lg"
              size="lg"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Giriş Yap
            </Button>
            
            <Button
              variant="outline"
              onClick={handleSignup}
              className="w-full h-12"
              size="lg"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Hesap Oluştur
            </Button>
          </div>

          {/* Info text */}
          <p className="text-center text-xs text-muted-foreground">
            Ücretsiz hesap oluşturarak maç analizlerine erişebilirsin.
            <br />
            AI Asistan Premium kullanıcılara özeldir.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default GuestGate;
