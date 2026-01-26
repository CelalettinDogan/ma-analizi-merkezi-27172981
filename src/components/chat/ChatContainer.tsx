import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, Trophy, Info, Calendar, ArrowDown } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { ChatMessage as ChatMessageType } from '@/hooks/useChatbot';
import { useSmartPrompts } from '@/hooks/useSmartPrompts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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

// Feature categories for welcome
const FEATURE_CATEGORIES = [
  { 
    icon: "⚽", 
    title: "Maç Tahminleri", 
    description: "Detaylı maç analizleri",
    color: "emerald"
  },
  { 
    icon: "📊", 
    title: "İstatistikler",
    description: "Takım ve oyuncu verileri",
    color: "blue"
  },
  { 
    icon: "🔥", 
    title: "Form Analizi",
    description: "Son performans takibi",
    color: "orange"
  }
];

// Date divider component
const DateDivider: React.FC<{ date: string }> = ({ date }) => (
  <div className="flex items-center gap-3 py-4 px-4">
    <div className="flex-1 h-px bg-border/50" />
    <span className="text-[11px] text-muted-foreground px-3 py-1 rounded-full bg-muted/50 font-medium">
      {date}
    </span>
    <div className="flex-1 h-px bg-border/50" />
  </div>
);

// Helper to format date for divider
const getDateLabel = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Bugün';
  if (diffDays === 1) return 'Dün';
  if (diffDays < 7) return `${diffDays} gün önce`;
  
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
};

// Check if we need a date divider between two messages
const needsDateDivider = (current: Date | undefined, previous: Date | undefined): boolean => {
  if (!current || !previous) return false;
  
  const currentDate = new Date(current.getFullYear(), current.getMonth(), current.getDate());
  const previousDate = new Date(previous.getFullYear(), previous.getMonth(), previous.getDate());
  
  return currentDate.getTime() !== previousDate.getTime();
};

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
      {/* Bot Avatar with glow */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="relative mb-5"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
          <Bot className="w-10 h-10 text-white" />
        </div>
        {/* Pulse rings */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-emerald-500/50"
          animate={{ scale: [1, 1.3, 1.3], opacity: [0.5, 0, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-emerald-500/30"
          animate={{ scale: [1, 1.5, 1.5], opacity: [0.3, 0, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />
        {/* Online indicator */}
        <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background" />
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
        className="text-muted-foreground mb-6 max-w-sm text-sm"
      >
        Futbol maçları, takım istatistikleri ve tahminler hakkında sorularınızı yanıtlamak için buradayım.
      </motion.p>

      {/* Feature Cards - Stagger animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-3 gap-2 w-full max-w-sm mb-5"
      >
        {FEATURE_CATEGORIES.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className={cn(
              "flex flex-col items-center gap-1.5 p-3 rounded-xl",
              "bg-card/80 backdrop-blur-sm border border-border/50",
              "hover:border-primary/30 transition-colors"
            )}
          >
            <span className="text-2xl">{feature.icon}</span>
            <span className="text-[10px] font-medium text-center leading-tight">{feature.title}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Desteklenen Ligler */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="w-full max-w-md mb-4"
      >
        <div className="flex items-center gap-2 mb-3 justify-center">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-foreground">Desteklenen Ligler</span>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {SUPPORTED_LEAGUES.map((league, index) => (
            <motion.div
              key={league.code}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.05 }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted/50 border border-border/50 text-xs"
            >
              <span>{league.icon}</span>
              <span className="text-muted-foreground">{league.name}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Bilgilendirme */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="flex items-start gap-2 p-3 rounded-xl bg-muted/30 border border-border/50 max-w-sm mb-4"
      >
        <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-[11px] text-muted-foreground text-left leading-relaxed">
          Türkiye Süper Ligi, Şampiyonlar Ligi ve diğer ligler için veri desteği henüz mevcut değil.
        </p>
      </motion.div>

      {/* Dynamic Smart Prompts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
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
                transition={{ delay: 1.1 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onQuickPrompt?.(prompt.text)}
                className={cn(
                  "px-3 py-2 rounded-full text-xs font-medium",
                  "bg-card/80 backdrop-blur-sm border border-border/50",
                  "hover:bg-muted hover:border-primary/30 transition-all",
                  "flex items-center gap-1.5 shadow-sm hover:shadow-md"
                )}
              >
                <span>{prompt.icon}</span>
                <span className="truncate max-w-[120px]">{prompt.text}</span>
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
        transition={{ delay: 1.2 }}
        className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground"
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

// New message scroll indicator
const ScrollToBottomButton: React.FC<{ onClick: () => void; visible: boolean }> = ({ onClick, visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.button
        initial={{ y: 20, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.8 }}
        onClick={onClick}
        className={cn(
          "absolute bottom-4 left-1/2 -translate-x-1/2 z-10",
          "flex items-center gap-2 px-4 py-2 rounded-full",
          "bg-primary text-primary-foreground shadow-lg shadow-primary/20",
          "hover:shadow-xl hover:scale-105 transition-all"
        )}
      >
        <ArrowDown className="w-4 h-4" />
        <span className="text-xs font-medium">Yeni mesaj</span>
      </motion.button>
    )}
  </AnimatePresence>
);

const ChatContainer: React.FC<ChatContainerProps> = ({ 
  messages, 
  isLoading, 
  isLoadingHistory,
  onQuickPrompt 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);
  const prevMessageCountRef = useRef(0);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Scroll to last message
  const scrollToLastMessage = useCallback((behavior: ScrollBehavior = 'auto') => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (lastMessageRef.current) {
          lastMessageRef.current.scrollIntoView({ 
            block: 'end', 
            behavior 
          });
        } else if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      });
    });
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setShowScrollButton(!isNearBottom && messages.length > 0);
  }, [messages.length]);

  // Initial scroll when history finishes loading
  useEffect(() => {
    if (!isLoadingHistory && messages.length > 0 && !hasScrolledRef.current) {
      const timers = [0, 50, 150, 300, 500].map(delay => 
        setTimeout(() => {
          scrollToLastMessage('auto');
        }, delay)
      );
      
      hasScrolledRef.current = true;
      return () => timers.forEach(clearTimeout);
    }
  }, [isLoadingHistory, messages.length, scrollToLastMessage]);

  // Scroll on new messages
  useEffect(() => {
    const currentCount = messages.length;
    const prevCount = prevMessageCountRef.current;
    
    if (hasScrolledRef.current && currentCount > prevCount && prevCount > 0) {
      scrollToLastMessage('smooth');
    }
    
    prevMessageCountRef.current = currentCount;
  }, [messages.length, scrollToLastMessage]);

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
      className="flex-1 overflow-y-auto scroll-smooth relative"
      onScroll={handleScroll}
    >
      <div className="py-4">
        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const showDivider = needsDateDivider(message.createdAt, prevMessage?.createdAt);
          
          return (
            <React.Fragment key={message.id}>
              {showDivider && message.createdAt && (
                <DateDivider date={getDateLabel(message.createdAt)} />
              )}
              <div ref={index === messages.length - 1 ? lastMessageRef : null}>
                <ChatMessage
                  role={message.role}
                  content={message.content}
                  isLoading={message.isLoading}
                  timestamp={message.createdAt}
                />
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Scroll to bottom button */}
      <ScrollToBottomButton 
        onClick={() => scrollToLastMessage('smooth')} 
        visible={showScrollButton} 
      />
    </div>
  );
};

export default ChatContainer;
