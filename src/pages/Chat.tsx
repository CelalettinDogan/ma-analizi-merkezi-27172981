import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useChatbot } from '@/hooks/useChatbot';
import ChatContainer from '@/components/chat/ChatContainer';
import ChatInput from '@/components/chat/ChatInput';
import UsageMeter from '@/components/chat/UsageMeter';
import PremiumGate from '@/components/chat/PremiumGate';
import BottomNav from '@/components/navigation/BottomNav';
import { fadeInUp } from '@/lib/animations';

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isPremium, isLoading: premiumLoading } = usePremiumStatus();
  const {
    messages,
    isLoading: chatLoading,
    usage,
    sendMessage,
    clearMessages,
    loadHistory,
  } = useChatbot();

  // Load chat history on mount
  useEffect(() => {
    if (user && isPremium) {
      loadHistory();
    }
  }, [user, isPremium, loadHistory]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: '/chat' } });
    }
  }, [authLoading, user, navigate]);

  const isPageLoading = authLoading || premiumLoading;
  const canChat = isPremium && usage && usage.remaining > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.header
        {...fadeInUp}
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-sm">Gol Asistan</h1>
                <p className="text-[10px] text-muted-foreground">AI Futbol Danışmanı</p>
              </div>
            </div>
          </div>

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearMessages}
              className="rounded-full text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden pb-20 md:pb-0">
        {isPageLoading ? (
          // Loading state
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Yükleniyor...</p>
            </div>
          </div>
        ) : !isPremium ? (
          // Premium gate
          <PremiumGate onClose={() => navigate(-1)} />
        ) : (
          // Chat interface
          <>
            <ChatContainer messages={messages} isLoading={chatLoading} />
            
            {/* Usage meter */}
            {usage && (
              <UsageMeter current={usage.current} limit={usage.limit} />
            )}
            
            {/* Chat input */}
            <ChatInput
              onSend={sendMessage}
              isLoading={chatLoading}
              disabled={!canChat}
              placeholder={
                usage && usage.remaining <= 0
                  ? "Günlük limitiniz doldu"
                  : "Futbol hakkında bir şeyler sorun..."
              }
            />
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Chat;
