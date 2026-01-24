import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const VIP_DAILY_LIMIT = 3;

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
  isAdmin: boolean;
  isVip: boolean;
  hasAccess: boolean;
  error: string | null;
  sendMessage: (message: string, context?: Record<string, unknown>) => Promise<void>;
  clearMessages: () => Promise<void>;
  loadHistory: () => Promise<void>;
}

export const useChatbot = (): UseChatbotReturn => {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [usage, setUsage] = useState<ChatUsage | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isVip, setIsVip] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check roles on mount (admin and vip)
  useEffect(() => {
    const checkRoles = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsVip(false);
        setUsage(null);
        return;
      }

      try {
        const { data, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (rolesError) {
          console.error('Error fetching roles:', rolesError);
          return;
        }

        const roles = data?.map(r => r.role) || [];
        const hasAdmin = roles.includes('admin');
        const hasVip = roles.includes('vip');

        setIsAdmin(hasAdmin);
        setIsVip(hasVip);

        // Set usage based on role
        if (hasAdmin) {
          setUsage({ current: 0, limit: "∞", remaining: "∞" });
        } else if (hasVip) {
          // Load VIP usage
          const today = new Date().toISOString().split('T')[0];
          const { data: usageData } = await supabase
            .from('chatbot_usage')
            .select('usage_count')
            .eq('user_id', user.id)
            .eq('usage_date', today)
            .single();

          const current = usageData?.usage_count ?? 0;
          setUsage({
            current,
            limit: VIP_DAILY_LIMIT,
            remaining: VIP_DAILY_LIMIT - current,
          });
        }
      } catch (e) {
        console.error('Error checking roles:', e);
      }
    };

    checkRoles();
  }, [user]);

  // Computed access check
  const hasAccess = isAdmin || isVip;

  // Load chat history - fetch LATEST 50 messages (descending) then reverse for UI
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

    // Check VIP limit
    if (isVip && !isAdmin && usage) {
      const remaining = typeof usage.remaining === 'number' ? usage.remaining : 0;
      if (remaining <= 0) {
        setError('Günlük VIP limitiniz doldu');
        toast.warning('Günlük limitiniz doldu. Yarın tekrar deneyin!');
        return;
      }
    }

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
        if (data.code === 'AUTH_REQUIRED' || data.code === 'AUTH_INVALID') {
          setError('Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın.');
          toast.error('Oturum hatası');
        } else if (data.code === 'ACCESS_DENIED') {
          setError('Bu özelliğe erişmek için VIP veya Admin olmanız gerekiyor');
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

      // Update usage for VIP
      if (data.usage && isVip && !isAdmin) {
        setUsage({
          current: data.usage.current,
          limit: VIP_DAILY_LIMIT,
          remaining: Math.max(0, VIP_DAILY_LIMIT - data.usage.current)
        });
      }

      // Update roles from response
      if (data.isAdmin !== undefined) setIsAdmin(data.isAdmin);
      if (data.isVip !== undefined) setIsVip(data.isVip);

    } catch (e) {
      console.error('Chatbot error:', e);
      setError('Bağlantı hatası oluştu');
      toast.error('Bağlantı hatası');
      setMessages(prev => prev.filter(m => !m.isLoading));
    } finally {
      setIsLoading(false);
    }
  }, [user, session, messages, isAdmin, isVip, usage]);

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