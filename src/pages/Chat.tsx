import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Bot, Info } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { MatchAnalysis } from '@/types/match';

interface MatchContext {
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  homeTeamCrest?: string;
  awayTeamCrest?: string;
  predictions?: Array<{
    type: string;
    prediction: string;
    confidence: string;
  }>;
  insights?: {
    homeFormScore: number;
    awayFormScore: number;
    isDerby: boolean;
    matchImportance: string;
  };
  poissonData?: {
    expectedHomeGoals: number;
    expectedAwayGoals: number;
    bttsProbability: number;
  };
}

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { isPremium, isLoading: premiumLoading } = usePremiumStatus();
  const {
    messages,
    isLoading: chatLoading,
    usage,
    isAdmin,
    sendMessage,
    clearMessages,
    loadHistory,
  } = useChatbot();

  const [matchContext, setMatchContext] = useState<MatchContext | null>(null);
  const [contextSent, setContextSent] = useState(false);

  // Handle match context from navigation state
  useEffect(() => {
    const state = location.state as { matchAnalysis?: MatchAnalysis } | null;
    if (state?.matchAnalysis) {
      const analysis = state.matchAnalysis;
      setMatchContext({
        homeTeam: analysis.input.homeTeam,
        awayTeam: analysis.input.awayTeam,
        league: analysis.input.league,
        matchDate: analysis.input.matchDate,
        homeTeamCrest: analysis.input.homeTeamCrest,
        awayTeamCrest: analysis.input.awayTeamCrest,
        predictions: analysis.predictions.map(p => ({
          type: p.type,
          prediction: p.prediction,
          confidence: p.confidence,
        })),
        insights: analysis.insights ? {
          homeFormScore: analysis.insights.homeFormScore,
          awayFormScore: analysis.insights.awayFormScore,
          isDerby: analysis.insights.isDerby,
          matchImportance: analysis.insights.matchImportance,
        } : undefined,
        poissonData: analysis.poissonData ? {
          expectedHomeGoals: analysis.poissonData.expectedHomeGoals,
          expectedAwayGoals: analysis.poissonData.expectedAwayGoals,
          bttsProbability: analysis.poissonData.bttsProbability,
        } : undefined,
      });
      // Clear the state to prevent re-processing
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Load chat history on mount (for premium and admin users)
  useEffect(() => {
    if (user && (isPremium || isAdmin)) {
      loadHistory();
    }
  }, [user, isPremium, isAdmin, loadHistory]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: '/chat' } });
    }
  }, [authLoading, user, navigate]);

  // Auto-send context message when premium/admin user has match context
  useEffect(() => {
    const hasRemainingUsage = isAdmin || (usage && (typeof usage.remaining === 'number' ? usage.remaining > 0 : true));
    if ((isPremium || isAdmin) && matchContext && !contextSent && hasRemainingUsage) {
      const contextMessage = `${matchContext.homeTeam} vs ${matchContext.awayTeam} maçını analiz et. Bu maç hakkında detaylı bilgi ver.`;
      
      // Build context object to send to AI
      const aiContext = {
        match: {
          homeTeam: matchContext.homeTeam,
          awayTeam: matchContext.awayTeam,
          league: matchContext.league,
          date: matchContext.matchDate,
        },
        predictions: matchContext.predictions,
        insights: matchContext.insights,
        poissonData: matchContext.poissonData,
      };

      sendMessage(contextMessage, aiContext);
      setContextSent(true);
    }
  }, [isPremium, isAdmin, matchContext, contextSent, usage, sendMessage]);

  const handleSendMessage = (message: string) => {
    // If we have match context, include it in subsequent messages too
    if (matchContext) {
      const aiContext = {
        match: {
          homeTeam: matchContext.homeTeam,
          awayTeam: matchContext.awayTeam,
          league: matchContext.league,
          date: matchContext.matchDate,
        },
      };
      sendMessage(message, aiContext);
    } else {
      sendMessage(message);
    }
  };

  const handleClearMessages = () => {
    clearMessages();
    setMatchContext(null);
    setContextSent(false);
  };

  const isPageLoading = authLoading || premiumLoading;
  const hasRemainingUsage = isAdmin || (usage && (typeof usage.remaining === 'number' ? usage.remaining > 0 : true));
  const canChat = (isPremium || isAdmin) && hasRemainingUsage;

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
              onClick={handleClearMessages}
              className="rounded-full text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Match Context Banner */}
        {matchContext && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="px-4 pb-3"
          >
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {matchContext.homeTeam} vs {matchContext.awayTeam}
                </p>
                <p className="text-[10px] text-muted-foreground">{matchContext.league}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMatchContext(null);
                  setContextSent(false);
                }}
                className="text-xs h-7 px-2"
              >
                Kaldır
              </Button>
            </div>
          </motion.div>
        )}
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
        ) : !isPremium && !isAdmin ? (
          // Premium gate
          <PremiumGate onClose={() => navigate(-1)} />
        ) : (
          // Chat interface
          <>
            <ChatContainer 
              messages={messages} 
              isLoading={chatLoading} 
              onQuickPrompt={handleSendMessage}
            />
            
            {/* Usage meter */}
            {usage && (
              <UsageMeter current={usage.current} limit={usage.limit} isAdmin={isAdmin} />
            )}
            
            {/* Chat input */}
            <ChatInput
              onSend={handleSendMessage}
              isLoading={chatLoading}
              disabled={!canChat}
              placeholder={
                !isAdmin && usage && typeof usage.remaining === 'number' && usage.remaining <= 0
                  ? "Günlük limitiniz doldu"
                  : matchContext
                    ? `${matchContext.homeTeam} vs ${matchContext.awayTeam} hakkında sorun...`
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
