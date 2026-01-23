import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
}

// Gelişmiş Typing Indicator
const TypingIndicator = () => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-muted-foreground">Yazıyor</span>
    <div className="flex gap-1">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          className="w-1.5 h-1.5 bg-primary rounded-full"
        />
      ))}
    </div>
  </div>
);

const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ role, content, isLoading }, ref) => {
    const isUser = role === 'user';

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex gap-3 p-4",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
        )}>
          {isUser ? (
            <User className="w-4 h-4" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </div>

        {/* Message bubble */}
        <div className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser 
            ? "bg-primary text-primary-foreground rounded-tr-sm" 
            : "bg-card border border-border rounded-tl-sm"
        )}>
          {isLoading ? (
            <TypingIndicator />
          ) : isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
              <ReactMarkdown
                components={{
                  // Özel stil ayarlamaları
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic">{children}</em>
                  ),
                  code: ({ children }) => (
                    <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">{children}</code>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0">{children}</h3>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground my-2">{children}</blockquote>
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
        </div>
      </motion.div>
    );
  }
);

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
