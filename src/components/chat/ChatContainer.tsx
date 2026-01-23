import React, { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, Trophy, Info, Calendar } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { ChatMessage as ChatMessageType } from '@/hooks/useChatbot';
import { useSmartPrompts } from '@/hooks/useSmartPrompts';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatContainerProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  isLoadingHistory?: boolean;
  onQuickPrompt?: (prompt: string) => void;
}

// Desteklenen ligler
const SUPPORTED_LEAGUES = [
  { icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", name: "Premier League", code: "PL" },
  { icon: "🇪🇸", name: "La Liga", code: "PD" },
  { icon: "🇮🇹", name: "Serie A", code: "SA" },
  { icon: "🇩🇪", name: "Bundesliga", code: "BL1" },
  { icon: "🇫🇷", name: "Ligue 1", code: "FL1" },
];

interface WelcomeMessageProps {
  onQuickPrompt?: (prompt: string) => void;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ onQuickPrompt }) => {
  const { prompts, isLoading: promptsLoading, error: promptsError } = useSmartPrompts(4);

  return (
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

      {/* Dynamic Smart Prompts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center gap-2 mb-3 justify-center">
          <Calendar className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Popüler sorular</span>
        </div>
        
        {promptsError && (
          <p className="text-xs text-amber-500 text-center mb-2">
            ⚠ Öneriler yüklenemedi
          </p>
        )}
        
        <div className="flex flex-wrap gap-2 justify-center">
          {promptsLoading ? (
            // Loading skeletons
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-28 rounded-full" />
              ))}
            </>
          ) : (
            prompts.map((prompt, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onQuickPrompt?.(prompt.text)}
                className="px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 hover:bg-muted hover:border-primary/30 transition-colors cursor-pointer flex items-center gap-1.5 text-sm"
              >
                <span>{prompt.icon}</span>
                <span className="text-xs truncate max-w-[120px]">{prompt.text}</span>
                {prompt.isPopular && <span className="text-[10px]">🔥</span>}
              </motion.button>
            ))
          )}
        </div>
      </motion.div>

      {/* Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"
      >
        <Sparkles className="w-3 h-3" />
        <span>Önerilerden birini deneyin veya kendi sorunuzu yazın</span>
      </motion.div>
    </motion.div>
  );
};

// History loading skeleton
const HistoryLoadingSkeleton: React.FC = () => (
  <div className="py-4 space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex gap-3 p-4 animate-pulse">
        <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

const ChatContainer: React.FC<ChatContainerProps> = ({ 
  messages, 
  isLoading, 
  isLoadingHistory,
  onQuickPrompt 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);
  const prevMessageCountRef = useRef(0);

  // Scroll to bottom function - stable reference
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    // Use double requestAnimationFrame for more reliable timing
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior
          });
        }
      });
    });
  }, []);

  // Initial scroll when messages load (from history)
  useEffect(() => {
    if (messages.length > 0 && !hasScrolledRef.current && !isLoadingHistory) {
      // Multiple attempts to ensure scroll works after DOM render
      const timers = [50, 150, 300].map(delay => 
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        }, delay)
      );
      
      hasScrolledRef.current = true;
      return () => timers.forEach(clearTimeout);
    }
  }, [messages.length, isLoadingHistory]);

  // Scroll on new messages (after initial load)
  useEffect(() => {
    const currentCount = messages.length;
    const prevCount = prevMessageCountRef.current;
    
    // Only scroll if new message was added (not on initial load)
    if (hasScrolledRef.current && currentCount > prevCount && prevCount > 0) {
      scrollToBottom('smooth');
    }
    
    prevMessageCountRef.current = currentCount;
  }, [messages.length, scrollToBottom]);

  // Reset scroll flag when messages are cleared
  useEffect(() => {
    if (messages.length === 0) {
      hasScrolledRef.current = false;
      prevMessageCountRef.current = 0;
    }
  }, [messages.length]);

  // Show history loading skeleton
  if (isLoadingHistory && messages.length === 0) {
    return (
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto"
      >
        <HistoryLoadingSkeleton />
      </div>
    );
  }

  // Show welcome message if no messages
  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <WelcomeMessage onQuickPrompt={onQuickPrompt} />
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
            timestamp={message.createdAt}
          />
        ))}
      </div>
    </div>
  );
};

export default ChatContainer;
