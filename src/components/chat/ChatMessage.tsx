import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import TypingIndicator from './TypingIndicator';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
  timestamp?: Date;
  onFeedback?: (positive: boolean) => void;
}

// Format timestamp to relative time
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) return 'Az önce';
  if (diffMins < 60) return `${diffMins}dk önce`;
  if (diffHours < 24) return `${diffHours}sa önce`;
  
  return date.toLocaleTimeString('tr-TR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ role, content, isLoading, timestamp, onFeedback }, ref) => {
    const isUser = role === 'user';
    const [copied, setCopied] = useState(false);
    const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
    const [showActions, setShowActions] = useState(false);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        toast.success('Kopyalandı');
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error('Kopyalanamadı');
      }
    };

    const handleFeedback = (positive: boolean) => {
      setFeedback(positive ? 'positive' : 'negative');
      onFeedback?.(positive);
      toast.success(positive ? 'Teşekkürler!' : 'Geri bildiriminiz alındı');
    };

    // Show loading indicator
    if (isLoading) {
      return <TypingIndicator />;
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: isUser ? 20 : -20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={cn(
          "flex gap-3 p-4 group",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onTouchStart={() => setShowActions(true)}
      >
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg",
            isUser 
              ? "bg-gradient-to-br from-primary to-primary/80 shadow-primary/20" 
              : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20"
          )}
        >
          {isUser ? (
            <User className="w-4 h-4 text-primary-foreground" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </motion.div>

        {/* Message bubble */}
        <div className={cn(
          "flex flex-col relative",
          isUser ? "items-end" : "items-start"
        )}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 relative",
              isUser 
                ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-sm shadow-lg shadow-primary/10" 
                : "bg-card/80 backdrop-blur-xl border border-border/50 rounded-tl-sm shadow-sm"
            )}
          >
            {isUser ? (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-2 last:mb-0 leading-relaxed text-sm">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-2 space-y-1 text-sm">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-2 space-y-1 text-sm">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-sm">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-muted-foreground">{children}</em>
                    ),
                    code: ({ children }) => (
                      <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono text-primary">{children}</code>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-base font-bold mb-2 mt-3 first:mt-0 text-foreground">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-sm font-bold mb-2 mt-3 first:mt-0 text-foreground">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0 text-foreground">{children}</h3>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground my-2 text-sm">{children}</blockquote>
                    ),
                    hr: () => (
                      <hr className="border-border my-3" />
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </motion.div>
          
          {/* Actions & Timestamp Row */}
          <div className={cn(
            "flex items-center gap-2 mt-1.5 px-1",
            isUser ? "flex-row-reverse" : "flex-row"
          )}>
            {/* Timestamp */}
            {timestamp && (
              <span className="text-[10px] text-muted-foreground/60">
                {formatRelativeTime(timestamp)}
              </span>
            )}
            
            {/* Action buttons for AI messages */}
            <AnimatePresence>
              {!isUser && showActions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1"
                >
                  {/* Copy button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    title="Kopyala"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </motion.button>

                  {/* Feedback buttons */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleFeedback(true)}
                    disabled={feedback !== null}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      feedback === 'positive' 
                        ? "bg-emerald-500/20 text-emerald-500" 
                        : "hover:bg-muted text-muted-foreground"
                    )}
                    title="Faydalı"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleFeedback(false)}
                    disabled={feedback !== null}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      feedback === 'negative' 
                        ? "bg-destructive/20 text-destructive" 
                        : "hover:bg-muted text-muted-foreground"
                    )}
                    title="Geliştirilmeli"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  }
);

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
