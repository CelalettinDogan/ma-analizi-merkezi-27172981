import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { ChatMessage as ChatMessageType } from '@/hooks/useChatbot';

interface ChatContainerProps {
  messages: ChatMessageType[];
  isLoading: boolean;
}

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

    {/* Capabilities */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="grid grid-cols-2 gap-3 w-full max-w-sm"
    >
      {[
        { icon: '⚽', text: 'Maç Analizi' },
        { icon: '📊', text: 'İstatistikler' },
        { icon: '🎯', text: 'Tahminler' },
        { icon: '🏆', text: 'Lig Durumu' },
      ].map((item, index) => (
        <motion.div
          key={item.text}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + index * 0.1 }}
          className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border"
        >
          <span className="text-lg">{item.icon}</span>
          <span className="text-sm font-medium">{item.text}</span>
        </motion.div>
      ))}
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
