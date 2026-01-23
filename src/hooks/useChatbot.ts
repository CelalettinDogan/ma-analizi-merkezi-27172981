import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
}

interface UseChatbotReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isLoadingHistory: boolean;
  usage: ChatUsage | null;
  isPremium: boolean | null;
  isAdmin: boolean;
  error: string | null;
  sendMessage: (message: string, context?: Record<string, unknown>) => Promise<void>;
  clearMessages: () => Promise<void>;
  loadHistory: () => Promise<void>;
}

const DAILY_LIMIT = 3;

export const useChatbot = (): UseChatbotReturn => {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [usage, setUsage] = useState<ChatUsage | null>(null);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check admin role on mount
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (data) {
          setIsAdmin(true);
          // Admin kullanıcılar için usage sınırsız
          setUsage({ current: 0, limit: "∞", remaining: "∞" });
        }
      } catch (e) {
        console.error('Error checking admin role:', e);
      }
    };

    checkAdminRole();
  }, [user]);

  // Load usage on mount (only for non-admin users)
  useEffect(() => {
    const loadUsage = async () => {
      if (!user || isAdmin) {
        // Admin için usage kontrolü yapma, zaten sınırsız
        if (!user) setUsage(null);
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
          .from('chatbot_usage')
          .select('usage_count')
          .eq('user_id', user.id)
          .eq('usage_date', today)
          .single();

        const current = data?.usage_count ?? 0;
        setUsage({
          current,
          limit: DAILY_LIMIT,
          remaining: DAILY_LIMIT - current,
        });
      } catch (e) {
        console.error('Error loading usage:', e);
      }
    };

    loadUsage();
  }, [user, isAdmin]);

  // Load chat history - fetch LATEST 50 messages (descending) then reverse for UI
  const loadHistory = useCallback(async () => {
    if (!user) return;

    setIsLoadingHistory(true);
    try {
      // Fetch newest 50 messages first (descending order)
      const { data, error: historyError } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (historyError) throw historyError;

      if (data && data.length > 0) {
        // Reverse to get chronological order (oldest first for display)
        const loadedMessages: ChatMessage[] = data
          .filter(h => h.role !== 'system')
          .reverse() // Newest-first → Oldest-first for UI
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

  // Send message with conversation history
  const sendMessage = useCallback(async (message: string, context?: Record<string, unknown>) => {
    if (!user || !session) {
      setError('Giriş yapmanız gerekiyor');
      toast.error('Lütfen giriş yapın');
      return;
    }

    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      createdAt: new Date(),
    };

    // Add loading assistant message
    const loadingMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      createdAt: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);

    try {
      // Prepare conversation history (last 5 messages for context)
      const conversationHistory = messages.slice(-5).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chatbot`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            message: message.trim(), 
            context,
            conversationHistory 
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (data.code === 'AUTH_REQUIRED' || data.code === 'AUTH_INVALID') {
          setError('Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın.');
          toast.error('Oturum hatası');
        } else if (data.code === 'PREMIUM_REQUIRED') {
          setIsPremium(false);
          setError('Bu özellik sadece Premium üyelere açıktır');
        } else if (data.code === 'LIMIT_EXCEEDED') {
          setUsage(data.usage);
          setError('Günlük kullanım limitiniz doldu');
          toast.warning('Günlük limitiniz doldu. Yarın tekrar deneyin!');
        } else if (data.code === 'AI_RATE_LIMIT') {
          setError('Servis şu anda yoğun. Lütfen biraz bekleyin.');
          toast.warning('Servis yoğun, lütfen bekleyin');
        } else {
          setError(data.error || 'Bir hata oluştu');
          toast.error(data.error || 'Bir hata oluştu');
        }

        // Remove loading message on error
        setMessages(prev => prev.filter(m => !m.isLoading));
        return;
      }

      // Update with actual response
      setMessages(prev => 
        prev.map(m => 
          m.isLoading 
            ? { ...m, content: data.message, isLoading: false }
            : m
        )
      );

      // Update usage
      if (data.usage) {
        setUsage(data.usage);
      }

      setIsPremium(data.isPremium ?? true);
      setIsAdmin(data.isAdmin ?? false);

    } catch (e) {
      console.error('Chatbot error:', e);
      setError('Bağlantı hatası oluştu');
      toast.error('Bağlantı hatası');
      
      // Remove loading message on error
      setMessages(prev => prev.filter(m => !m.isLoading));
    } finally {
      setIsLoading(false);
    }
  }, [user, session, messages]);

  // Clear messages (both local and database)
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
    isPremium,
    isAdmin,
    error,
    sendMessage,
    clearMessages,
    loadHistory,
  };
};
