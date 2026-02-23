import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { useSmartPrompts } from '@/hooks/useSmartPrompts';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  disabledReason?: string;
  placeholder?: string;
  maxLength?: number;
}

// Prompt categories with subtle border colors only
const getPromptBorderColor = (text: string): string => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('maç') || lowerText.includes('vs') || lowerText.includes('analiz')) return 'border-emerald-500/30';
  if (lowerText.includes('puan') || lowerText.includes('sıralama') || lowerText.includes('lig')) return 'border-blue-500/30';
  if (lowerText.includes('istatistik') || lowerText.includes('gol') || lowerText.includes('form')) return 'border-purple-500/30';
  if (lowerText.includes('trend') || lowerText.includes('popüler') || lowerText.includes('favori')) return 'border-orange-500/30';
  return 'border-border/50';
};

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSend, 
  isLoading, 
  disabled = false,
  disabledReason,
  placeholder = "Futbol hakkında bir şeyler sorun...",
  maxLength = 500
}) => {
  const [message, setMessage] = useState('');
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { prompts, isLoading: promptsLoading } = useSmartPrompts(4);

  const characterCount = message.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isOverLimit = characterCount > maxLength;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (!message.trim() || isLoading || disabled || isOverLimit) return;
    onSend(message.trim());
    setMessage('');
    setShowQuickPrompts(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    if (!isLoading && !disabled) {
      onSend(promptText);
      setShowQuickPrompts(false);
    }
  };

  return (
    <div className="border-t border-border/50 bg-card/50 backdrop-blur-xl p-3 pb-safe space-y-2.5 shrink-0">
      {/* Quick Prompts - Minimal design */}
      <AnimatePresence>
        {showQuickPrompts && !disabled && !promptsLoading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-x-auto pb-1 -mb-1 scrollbar-hide"
          >
            <div className="flex gap-1.5 min-w-min">
              {prompts.map((prompt, index) => (
                <motion.button
                  key={prompt.text}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleQuickPrompt(prompt.text)}
                  disabled={isLoading}
                  className={cn(
                    "px-2.5 py-1.5 text-[11px] rounded-full transition-all flex items-center gap-1 shrink-0 touch-manipulation",
                    "bg-muted/50 border hover:bg-muted hover:border-primary/30",
                    getPromptBorderColor(prompt.text)
                  )}
                >
                  <span className="shrink-0">{prompt.icon}</span>
                  <span className="truncate max-w-[130px] font-medium">{prompt.text}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state for prompts */}
      {showQuickPrompts && promptsLoading && !disabled && (
        <div className="flex gap-1.5 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-7 w-28 rounded-full bg-muted/40 animate-pulse shrink-0"
            />
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div 
          className={cn(
            "flex-1 min-w-0 relative rounded-3xl transition-all duration-200",
            isFocused && "ring-1 ring-primary/20"
          )}
        >
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, maxLength + 50))}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setShowQuickPrompts(true);
              setIsFocused(true);
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={disabled && disabledReason ? disabledReason : placeholder}
            disabled={disabled || isLoading}
            className={cn(
              "min-h-[48px] max-h-[120px] resize-none pr-12 rounded-3xl text-sm",
              "bg-background/80 backdrop-blur-sm border-border/50",
              "focus:border-primary/50 focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-muted-foreground/50",
              disabled && "opacity-60 cursor-not-allowed"
            )}
            rows={1}
          />
          
          {/* Character counter - subtle */}
          <AnimatePresence>
            {message.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn(
                  "absolute bottom-2.5 right-14 text-[9px] px-1.5 py-0.5 rounded-full",
                  isOverLimit 
                    ? "bg-destructive/20 text-destructive" 
                    : isNearLimit 
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" 
                      : "text-muted-foreground/50"
                )}
              >
                {characterCount}/{maxLength}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Send button */}
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isLoading || disabled || isOverLimit}
            size="icon"
            className={cn(
              "h-11 w-11 rounded-full shrink-0 transition-all duration-200",
              "bg-gradient-to-br from-primary to-primary/80",
              "hover:from-primary/90 hover:to-primary/70",
              "shadow-md shadow-primary/20 hover:shadow-lg",
              "disabled:opacity-50 disabled:shadow-none"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </motion.div>
      </div>

      {/* Disabled reason tooltip */}
      {disabled && disabledReason && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-[11px] text-muted-foreground"
        >
          {disabledReason}
        </motion.p>
      )}
    </div>
  );
};

export default ChatInput;
