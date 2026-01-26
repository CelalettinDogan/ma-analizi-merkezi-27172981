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

// Prompt categories with colors
const promptCategoryColors: Record<string, { bg: string; text: string; border: string }> = {
  match: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
  standings: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' },
  stats: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20' },
  trend: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20' },
  default: { bg: 'bg-muted', text: 'text-foreground', border: 'border-border/50' },
};

const getPromptCategory = (text: string): keyof typeof promptCategoryColors => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('maç') || lowerText.includes('vs') || lowerText.includes('analiz')) return 'match';
  if (lowerText.includes('puan') || lowerText.includes('sıralama') || lowerText.includes('lig')) return 'standings';
  if (lowerText.includes('istatistik') || lowerText.includes('gol') || lowerText.includes('form')) return 'stats';
  if (lowerText.includes('trend') || lowerText.includes('popüler') || lowerText.includes('favori')) return 'trend';
  return 'default';
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
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
    <div className="border-t border-border/50 bg-card/50 backdrop-blur-xl p-4 space-y-3">
      {/* Quick Prompts - Kategorize */}
      <AnimatePresence>
        {showQuickPrompts && !disabled && !promptsLoading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-x-auto pb-2 -mb-2"
          >
            <div className="flex gap-2 min-w-min">
              {prompts.map((prompt, index) => {
                const category = getPromptCategory(prompt.text);
                const colors = promptCategoryColors[category];
                
                return (
                  <motion.button
                    key={prompt.text}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickPrompt(prompt.text)}
                    disabled={isLoading}
                    className={cn(
                      "px-3 py-2 text-xs rounded-full transition-all flex items-center gap-1.5 shrink-0",
                      "border shadow-sm hover:shadow-md",
                      colors.bg,
                      colors.text,
                      colors.border,
                      "hover:border-primary/30"
                    )}
                  >
                    <span className="shrink-0 text-sm">{prompt.icon}</span>
                    <span className="truncate max-w-[160px] font-medium">{prompt.text}</span>
                    {prompt.isPopular && (
                      <span className="shrink-0 text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-semibold">
                        HOT
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state for prompts */}
      {showQuickPrompts && promptsLoading && !disabled && (
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-9 w-36 rounded-full bg-muted/40 animate-pulse shrink-0"
            />
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div 
          className={cn(
            "flex-1 relative rounded-2xl transition-all duration-200",
            isFocused && "ring-2 ring-primary/20"
          )}
        >
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, maxLength + 50))} // Allow slight overflow for UX
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setShowQuickPrompts(true);
              setIsFocused(true);
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={disabled && disabledReason ? disabledReason : placeholder}
            disabled={disabled || isLoading}
            className={cn(
              "min-h-[44px] max-h-[150px] resize-none pr-12 rounded-2xl",
              "bg-background/80 backdrop-blur-sm border-border/50",
              "focus:border-primary/50 focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-muted-foreground/60",
              disabled && "opacity-60 cursor-not-allowed"
            )}
            rows={1}
          />
          
          {/* Character counter */}
          <AnimatePresence>
            {message.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn(
                  "absolute bottom-2 right-14 text-[10px] px-1.5 py-0.5 rounded-full",
                  isOverLimit 
                    ? "bg-destructive/20 text-destructive" 
                    : isNearLimit 
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" 
                      : "text-muted-foreground"
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
              "shadow-lg shadow-primary/20 hover:shadow-primary/30",
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
          className="text-center text-xs text-muted-foreground"
        >
          {disabledReason}
        </motion.p>
      )}
    </div>
  );
};

export default ChatInput;
