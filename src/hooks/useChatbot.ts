import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useAccessLevel } from './useAccessLevel';
import { useStreakRewards } from './useStreakRewards';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  isLoading?: boolean;
}

interface ChatUsage {
  current: number | string;
  limit: number | string;
  remaining: number | string;
  /** Bonus credits available (separate from plan limit) */
  bonusRemaining?: number;
}

interface UseChatbotReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isLoadingHistory: boolean;
  usage: ChatUsage | null;
  isAdmin: boolean;
  /** @deprecated Use canUseAIChat from useAccessLevel instead */
  isVip: boolean;
  hasAccess: boolean;
  error: string | null;
  sendMessage: (message: string, context?: Record<string, unknown>) => Promise<void>;
  clearMessages: () => Promise<void>;
  loadHistory: () => Promise<void>;
}

/**
 * Chatbot + Premium + Streak Bonus Etkileşim Kuralları:
 * 
 * 1. Admin: Sınırsız (limit yok)
 * 2. Premium Pro (10/gün): Plan limiti kullanılır, bonus bittiyse ek hak verir
 * 3. Premium Plus (5/gün): Plan limiti kullanılır, bonus bittiyse ek hak verir
 * 4. Premium Basic (3/gün): Plan limiti kullanılır, bonus bittiyse ek hak verir
 * 5. Free (0/gün): SADECE bonus credit varsa erişebilir, her mesajda bonus tüketilir
 * 
 * Öncelik sırası:
 * - Premium kullanıcılar: Önce plan limiti kullanılır → Plan limiti dolunca bonus credit tüketilir
 * - Free kullanıcılar: Her mesaj için bonus credit tüketilir (use_bonus_credit RPC)
 */
export const useChatbot = (): UseChatbotReturn => {
  const { user, session } = useAuth();
  const { canUseAIChat, isAdmin, dailyChatLimit, planType } = useAccessLevel();
  const { bonusCredits } = useStreakRewards();
  const queryClient = useQueryClient();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [usage, setUsage] = useState<ChatUsage | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Free user with bonus credits can access
  const hasBonusChatAccess = bonusCredits.bonus_chat > 0;
  const hasAccess = canUseAIChat || hasBonusChatAccess || isAdmin;

  // Load usage on mount
  useEffect(() => {
    const loadUsage = async () => {
      if (!user) {
        setUsage(null);
        return;
      }

      if (isAdmin) {
        setUsage({ current: 0, limit: "∞", remaining: "∞" });
        return;
      }

      // Free user — only bonus credits matter
      if (!canUseAIChat) {
        if (hasBonusChatAccess) {
          setUsage({
            current: 0,
            limit: bonusCredits.bonus_chat,
            remaining: bonusCredits.bonus_chat,
            bonusRemaining: bonusCredits.bonus_chat,
          });
        } else {
          setUsage(null);
        }
        return;
      }

      // Premium user — plan limit + bonus overflow
      if (dailyChatLimit >= 999) {
        setUsage({ current: 0, limit: "∞", remaining: "∞" });
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0];
        const { data: usageData } = await supabase
          .from('chatbot_usage')
          .select('usage_count')
          .eq('user_id', user.id)
          .eq('usage_date', today)
          .maybeSingle();

        const current = usageData?.usage_count ?? 0;
        const planRemaining = Math.max(0, dailyChatLimit - current);
        
        setUsage({
          current,
          limit: dailyChatLimit,
          remaining: planRemaining + bonusCredits.bonus_chat,
          bonusRemaining: bonusCredits.bonus_chat,
        });
      } catch (e) {
        console.error('Error loading chat usage:', e);
        setUsage({
          current: 0,
          limit: dailyChatLimit,
          remaining: dailyChatLimit + bonusCredits.bonus_chat,
          bonusRemaining: bonusCredits.bonus_chat,
        });
      }
    };

    loadUsage();
  }, [user, isAdmin, canUseAIChat, dailyChatLimit, hasBonusChatAccess, bonusCredits.bonus_chat]);

  const isVip = planType === 'premium_basic' || planType === 'premium_plus' || planType === 'premium_pro';

  // Load chat history
  const loadHistory = useCallback(async () => {
    if (!user) return;

    setIsLoadingHistory(true);
    try {
      const { data, error: historyError } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (historyError) throw historyError;

      if (data && data.length > 0) {
        const loadedMessages: ChatMessage[] = data
          .filter(h => h.role !== 'system')
          .reverse()
          .map(h => ({
            id: h.id,
            role: h.role as 'user' | 'assistant',
            content: h.content,
            createdAt: new Date(h.created_at || Date.now()),
          }));
        setMessages(loadedMessages);
      }
    } catch (e) {
      console.error('Error loading chat history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  // Send message
  const sendMessage = useCallback(async (message: string, context?: Record<string, unknown>) => {
    if (!user || !session) {
      setError('Giriş yapmanız gerekiyor');
      toast.error('Lütfen giriş yapın');
      return;
    }

    if (!message.trim()) return;

    // Determine if we need to consume a bonus credit
    const isFreePlan = !canUseAIChat;
    let needsBonusCredit = false;

    if (!isAdmin) {
      const remaining = typeof usage?.remaining === 'number' ? usage.remaining : 0;
      
      if (remaining <= 0) {
        setError('Günlük AI Asistan limitiniz doldu');
        toast.warning('Günlük limitiniz doldu. Yarın tekrar deneyin!');
        return;
      }

      // Free user: always consume bonus credit
      if (isFreePlan) {
        needsBonusCredit = true;
      }
      // Premium user: consume bonus only when plan limit exhausted
      else if (dailyChatLimit < 999 && usage) {
        const planRemaining = Math.max(0, dailyChatLimit - (typeof usage.current === 'number' ? usage.current : 0));
        if (planRemaining <= 0) {
          needsBonusCredit = true;
        }
      }
    }

    setIsLoading(true);
    setError(null);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      createdAt: new Date(),
    };

    const loadingMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      createdAt: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);

    try {
      // Note: bonus_chat consumption is handled server-side atomically.
      // Do NOT call useBonusCredit here — server will consume after successful response.

      const conversationHistory = messages.slice(-5).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chatbot`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message: message.trim(),
            context,
            conversationHistory,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'AUTH_REQUIRED' || data.code === 'AUTH_INVALID') {
          setError('Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın.');
          toast.error('Oturum hatası');
        } else if (data.code === 'ACCESS_DENIED') {
          setError('Bu özelliğe erişmek için Premium veya Admin olmanız gerekiyor');
          toast.error('Erişim reddedildi');
        } else if (data.code === 'LIMIT_EXCEEDED') {
          setUsage(data.usage);
          setError('Günlük kullanım limitiniz doldu');
          toast.warning('Günlük limitiniz doldu. Yarın tekrar deneyin!');
        } else {
          setError(data.error || 'Bir hata oluştu');
          toast.error(data.error || 'Bir hata oluştu');
        }

        setMessages(prev => prev.filter(m => !m.isLoading));
        return;
      }

      // Update with actual response
      setMessages(prev =>
        prev.map(m =>
          m.isLoading
            ? { ...m, content: data.message || data.response, isLoading: false }
            : m
        )
      );

      // Update usage counters from server response (authoritative)
      if (!isAdmin && data.usage) {
        const serverUsage = data.usage;
        const bonusRem = typeof serverUsage.bonusRemaining === 'number'
          ? serverUsage.bonusRemaining
          : (usage?.bonusRemaining ?? 0);

        if (isFreePlan) {
          setUsage({
            current: 0,
            limit: bonusRem,
            remaining: bonusRem,
            bonusRemaining: bonusRem,
          });
        } else if (dailyChatLimit < 999) {
          const current = typeof serverUsage.current === 'number' ? serverUsage.current : 0;
          const planRemaining = Math.max(0, dailyChatLimit - current);
          setUsage({
            current,
            limit: dailyChatLimit,
            remaining: planRemaining + bonusRem,
            bonusRemaining: bonusRem,
          });
        }

        // Refresh bonus credits cache so other UI updates
        if (serverUsage.usedBonus) {
          queryClient.invalidateQueries({ queryKey: ['bonus-credits'] });
        }
      }
    } catch (e) {
      console.error('Chatbot error:', e);
      setError('Bağlantı hatası oluştu');
      toast.error('Bağlantı hatası');
      setMessages(prev => prev.filter(m => !m.isLoading));
    } finally {
      setIsLoading(false);
    }
  }, [user, session, messages, isAdmin, dailyChatLimit, usage, canUseAIChat, queryClient]);

  // Clear messages
  const clearMessages = useCallback(async () => {
    setMessages([]);

    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing chat history:', error);
        toast.error('Sohbet geçmişi silinemedi');
      } else {
        toast.success('Sohbet geçmişi temizlendi');
      }
    } catch (e) {
      console.error('Error clearing chat history:', e);
    }
  }, [user]);

  return {
    messages,
    isLoading,
    isLoadingHistory,
    usage,
    isAdmin,
    isVip,
    hasAccess,
    error,
    sendMessage,
    clearMessages,
    loadHistory,
  };
};
