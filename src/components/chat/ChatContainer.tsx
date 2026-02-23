import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowDown } from 'lucide-react';
import varioAvatar from '@/assets/vario-avatar.png';
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

// Desteklenen ligler - sadece bayraklar
const SUPPORTED_LEAGUES = [
  { icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", code: "PL" },
  { icon: "🇪🇸", code: "PD" },
  { icon: "🇮🇹", code: "SA" },
  { icon: "🇩🇪", code: "BL1" },
  { icon: "🇫🇷", code: "FL1" },
];

// Date divider component
const DateDivider: React.FC<{ date: string }> = ({ date }) => (
  <div className="flex items-center gap-3 py-3 px-4">
    <div className="flex-1 h-px bg-border/50" />
    <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted/50 font-medium">
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

// Minimalist Welcome Message - 2026 Design
const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ onQuickPrompt }) => {
  const { prompts, isLoading: promptsLoading } = useSmartPrompts(4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full p-5 text-center"
    >
      {/* Compact Bot Avatar */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative mb-4"
      >
        <img src={varioAvatar} alt="VARio" className="w-16 h-16 rounded-full object-cover shadow-xl shadow-emerald-500/25" />
        {/* Simple glow */}
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl -z-10" />
        {/* Online indicator */}
        <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background" />
      </motion.div>

      {/* Title & Description */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-lg font-bold mb-1"
      >
        Merhaba! Ben VARio 👋
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-muted-foreground mb-5 text-sm"
      >
        Futbol analizleri için buradayım
      </motion.p>

      {/* Smart Prompts - Main Focus */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-xs mb-5"
      >
        <div className="grid grid-cols-2 gap-2">
          {promptsLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </>
          ) : (
            prompts.map((prompt, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onQuickPrompt?.(prompt.text)}
                className={cn(
                  "p-3 rounded-xl text-left",
                  "bg-card/80 backdrop-blur-sm border border-border/50",
                  "hover:bg-muted hover:border-primary/30 transition-all",
                  "flex flex-col gap-1"
                )}
              >
                <span className="text-lg">{prompt.icon}</span>
                <span className="text-[11px] font-medium line-clamp-2 leading-tight">{prompt.text}</span>
              </motion.button>
            ))
          )}
        </div>
      </motion.div>

      {/* Desteklenen Ligler - Compact */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-3"
      >
        <Trophy className="w-3.5 h-3.5 text-muted-foreground" />
        <div className="flex gap-2">
          {SUPPORTED_LEAGUES.map((league) => (
            <span key={league.code} className="text-base">
              {league.icon}
            </span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// History loading skeleton - forwardRef for AnimatePresence compatibility
const HistoryLoadingSkeleton = React.forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} className="py-4 space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex gap-2.5 p-3 animate-pulse">
        <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
    ))}
  </div>
));
HistoryLoadingSkeleton.displayName = 'HistoryLoadingSkeleton';

// Scroll to bottom button - minimal
const ScrollToBottomButton: React.FC<{ onClick: () => void; visible: boolean }> = ({ onClick, visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.button
        initial={{ y: 20, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.8 }}
        onClick={onClick}
        className={cn(
          "absolute bottom-3 left-1/2 -translate-x-1/2 z-10",
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
          "bg-primary text-primary-foreground shadow-md",
          "hover:shadow-lg transition-shadow text-xs font-medium"
        )}
      >
        <ArrowDown className="w-3 h-3" />
        Yeni mesaj
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
  const prevMessageCountRef = useRef(0);
  const [showScrollButton, setShowScrollButton] = useState(false);


  // Scroll to bottom of container
  const scrollToLastMessage = useCallback((behavior: ScrollBehavior = 'auto') => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior,
      });
    }
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setShowScrollButton(!isNearBottom && messages.length > 0);
  }, [messages.length]);

  // Use ResizeObserver to scroll to bottom when content size changes (e.g. markdown renders)
  useEffect(() => {
    if (messages.length === 0 || !containerRef.current) return;
    
    let initialScrollDone = false;
    const contentEl = containerRef.current;
    
    const observer = new ResizeObserver(() => {
      // Only auto-scroll if user hasn't scrolled up manually
      if (!initialScrollDone) {
        contentEl.scrollTop = contentEl.scrollHeight;
        initialScrollDone = true;
        return;
      }
      
      const { scrollTop, scrollHeight, clientHeight } = contentEl;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      if (isNearBottom) {
        contentEl.scrollTop = contentEl.scrollHeight;
      }
    });
    
    // Observe the inner content wrapper for size changes
    const innerEl = contentEl.firstElementChild;
    if (innerEl) {
      observer.observe(innerEl);
    }
    
    // Also force immediate scroll
    contentEl.scrollTop = contentEl.scrollHeight;
    
    // Retry a few times for good measure
    const timers = [50, 150, 400, 800, 1500].map(delay =>
      setTimeout(() => {
        contentEl.scrollTop = contentEl.scrollHeight;
      }, delay)
    );
    
    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [isLoadingHistory, messages.length]);

  // Smooth scroll on new messages
  useEffect(() => {
    const currentCount = messages.length;
    const prevCount = prevMessageCountRef.current;
    
    if (currentCount > prevCount && prevCount > 0) {
      scrollToLastMessage('smooth');
    }
    
    prevMessageCountRef.current = currentCount;
  }, [messages.length, scrollToLastMessage]);

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
      className="flex-1 overflow-y-auto relative"
      onScroll={handleScroll}
    >
      <div className="py-3">
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
        {/* Scroll anchor */}
        <div aria-hidden="true" style={{ height: 1 }} />
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
