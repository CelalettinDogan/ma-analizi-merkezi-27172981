import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, Trophy, Info } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { ChatMessage as ChatMessageType } from '@/hooks/useChatbot';

interface ChatContainerProps {
  messages: ChatMessageType[];
  isLoading: boolean;
}

// Desteklenen ligler
const SUPPORTED_LEAGUES = [
  { icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", name: "Premier League", code: "PL" },
  { icon: "🇪🇸", name: "La Liga", code: "PD" },
  { icon: "🇮🇹", name: "Serie A", code: "SA" },
  { icon: "🇩🇪", name: "Bundesliga", code: "BL1" },
  { icon: "🇫🇷", name: "Ligue 1", code: "FL1" },
];

const WelcomeMessage: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center h-full p-6 text-center"
  >
    {/* Bot Avatar */}
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
      className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30"
    >
      <Bot className="w-8 h-8 text-white" />
    </motion.div>

    {/* Title */}
    <motion.h2
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-xl font-bold mb-2"
    >
      Merhaba! Ben Gol Asistan 👋
    </motion.h2>

    {/* Description */}
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="text-muted-foreground mb-6 max-w-sm"
    >
      Futbol maçları, takım istatistikleri ve tahminler hakkında sorularınızı yanıtlamak için buradayım.
    </motion.p>

    {/* Desteklenen Ligler */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="w-full max-w-md mb-4"
    >
      <div className="flex items-center gap-2 mb-3 justify-center">
        <Trophy className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Desteklenen Ligler</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {SUPPORTED_LEAGUES.map((league, index) => (
          <motion.div
            key={league.code}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.05 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border text-sm"
          >
            <span className="text-lg">{league.icon}</span>
            <span className="text-muted-foreground text-xs truncate">{league.name}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>

    {/* Bilgilendirme */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="flex items-start gap-2 p-3 rounded-xl bg-muted/30 border border-border/50 max-w-sm mb-4"
    >
      <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <p className="text-xs text-muted-foreground text-left">
        Türkiye Süper Ligi, Şampiyonlar Ligi ve diğer ligler için veri desteği henüz mevcut değil.
      </p>
    </motion.div>

    {/* Örnek Sorular */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="text-xs text-muted-foreground/70"
    >
      <p className="mb-2">Örnek sorular:</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {["Liverpool form durumu", "La Liga puan durumu", "Bugünkü maçlar"].map((q) => (
          <span key={q} className="px-2 py-1 rounded-full bg-muted/30 border border-border/30">
            "{q}"
          </span>
        ))}
      </div>
    </motion.div>

    {/* Tip */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.9 }}
      className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"
    >
      <Sparkles className="w-3 h-3" />
      <span>Aşağıdaki önerilerden birini deneyin veya kendi sorunuzu yazın</span>
    </motion.div>
  </motion.div>
);

const ChatContainer: React.FC<ChatContainerProps> = ({ messages, isLoading }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <WelcomeMessage />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto scroll-smooth"
    >
      <div className="py-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
            isLoading={message.isLoading}
          />
        ))}
      </div>
    </div>
  );
};

export default ChatContainer;
