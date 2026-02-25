import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import varioAvatar from '@/assets/vario-avatar.png';
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
  skipAnimation?: boolean;
}

// Format timestamp to relative time
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) return 'Az önce';
  if (diffMins < 60) return `${diffMins}dk`;
  if (diffHours < 24) return `${diffHours}sa`;
  
  return date.toLocaleTimeString('tr-TR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ role, content, isLoading, timestamp, onFeedback, skipAnimation }, ref) => {
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

    const Wrapper = skipAnimation ? 'div' : motion.div;
    const wrapperProps = skipAnimation
      ? {}
      : {
          initial: { opacity: 0, x: isUser ? 15 : -15, scale: 0.98 },
          animate: { opacity: 1, x: 0, scale: 1 },
          transition: { type: "spring" as const, stiffness: 350, damping: 30 },
        };

    return (
      <Wrapper
        ref={ref}
        {...wrapperProps}
        className={cn(
          "flex gap-2 px-3 py-[5px] group min-w-0 items-end",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onTouchStart={() => setShowActions(true)}
      >
        {/* Avatar */}
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md overflow-hidden",
            isUser 
              ? "bg-gradient-to-br from-primary to-primary/80 shadow-primary/15" 
              : "shadow-emerald-500/15"
          )}
        >
          {isUser ? (
            <User className="w-4 h-4 text-primary-foreground" />
          ) : (
            <img src={varioAvatar} alt="VARio" className="w-full h-full rounded-full object-cover" />
          )}
        </div>

        {/* Message bubble */}
        <div className={cn(
          "flex flex-col relative min-w-0 flex-1",
          isUser ? "items-end" : "items-start"
        )}>
          <div
            className={cn(
              "w-fit max-w-[75%] min-w-[80px] rounded-[20px] px-4 py-3 relative leading-[1.5]",
              isUser 
                ? "bg-gradient-to-br from-primary via-primary/95 to-emerald-600/90 text-primary-foreground rounded-tr-md shadow-md shadow-primary/[0.08]" 
                : "bg-muted/60 backdrop-blur-xl border border-border/30 rounded-tl-md shadow-sm shadow-black/5"
            )}
            style={{ wordBreak: 'normal', overflowWrap: 'break-word' }}
          >
            {isUser ? (
              <p className="text-sm whitespace-pre-wrap leading-[1.5]">{content}</p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-2 last:mb-0 leading-[1.5] text-[13.5px]">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-2 space-y-0.5 text-[13.5px]">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-2 space-y-0.5 text-[13.5px]">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-[13.5px] leading-[1.5]">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-muted-foreground">{children}</em>
                    ),
                    code: ({ children }) => (
                      <code className="px-1 py-0.5 bg-muted rounded text-micro font-mono text-primary">{children}</code>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-[15px] font-bold mb-2 mt-2.5 first:mt-0 text-foreground leading-[1.5]">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-[14px] font-bold mb-1.5 mt-2 first:mt-0 text-foreground leading-[1.5]">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-[13.5px] font-semibold mb-1 mt-1.5 first:mt-0 text-foreground leading-[1.5]">{children}</h3>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-primary/50 pl-2.5 italic text-muted-foreground my-2 text-[13.5px]">{children}</blockquote>
                    ),
                    hr: () => (
                      <hr className="border-border my-2" />
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
          
          {/* Actions & Timestamp Row */}
          <div className={cn(
            "flex items-center gap-1.5 mt-1 px-0.5",
            isUser ? "flex-row-reverse" : "flex-row"
          )}>
            {/* Timestamp - more subtle */}
            {timestamp && (
              <span className="text-micro text-muted-foreground/60">
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
                  className="flex items-center gap-0.5"
                >
                  {/* Copy button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCopy}
                    className="p-1 rounded-md hover:bg-muted transition-colors"
                    title="Kopyala"
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3 text-muted-foreground" />
                    )}
                  </motion.button>

                  {/* Feedback buttons */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleFeedback(true)}
                    disabled={feedback !== null}
                    className={cn(
                      "p-1 rounded-md transition-colors",
                      feedback === 'positive' 
                        ? "bg-emerald-500/20 text-emerald-500" 
                        : "hover:bg-muted text-muted-foreground"
                    )}
                    title="Faydalı"
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleFeedback(false)}
                    disabled={feedback !== null}
                    className={cn(
                      "p-1 rounded-md transition-colors",
                      feedback === 'negative' 
                        ? "bg-destructive/20 text-destructive" 
                        : "hover:bg-muted text-muted-foreground"
                    )}
                    title="Geliştirilmeli"
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Wrapper>
    );
  }
);

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
