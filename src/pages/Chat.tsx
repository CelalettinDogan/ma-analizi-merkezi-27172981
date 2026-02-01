import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Bot, Info, Crown, Sparkles, Star, MoreVertical } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useChatbot } from '@/hooks/useChatbot';
import { useAccessLevel } from '@/hooks/useAccessLevel';
import ChatContainer from '@/components/chat/ChatContainer';
import ChatInput from '@/components/chat/ChatInput';
import UsageMeter from '@/components/chat/UsageMeter';
import PremiumGate from '@/components/chat/PremiumGate';
import GuestGate from '@/components/chat/GuestGate';
import ChatLimitSheet from '@/components/chat/ChatLimitSheet';
import BottomNav from '@/components/navigation/BottomNav';
import { fadeInUp } from '@/lib/animations';
import { MatchAnalysis } from '@/types/match';
import { cn } from '@/lib/utils';

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
  const { 
    planType, 
    isAdmin, 
    canUseAIChat, 
    dailyChatLimit,
    isGuest,
    isPremium,
  } = useAccessLevel();
  const {
    messages,
    isLoading: chatLoading,
    isLoadingHistory,
    usage,
    hasAccess,
    sendMessage,
    clearMessages,
    loadHistory,
  } = useChatbot();

  const [matchContext, setMatchContext] = useState<MatchContext | null>(null);
  const [contextSent, setContextSent] = useState(false);
  const [showLimitSheet, setShowLimitSheet] = useState(false);
  
  // Plan badge info
  const isPremiumBasic = planType === 'premium_basic';
  const isPremiumPlus = planType === 'premium_plus';
  const isPremiumPro = planType === 'premium_pro';

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
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Load chat history on mount (for premium users)
  useEffect(() => {
    if (user && hasAccess) {
      loadHistory();
    }
  }, [user, hasAccess, loadHistory]);

  // Auto-send context message when premium user has match context
  useEffect(() => {
    const hasRemainingUsage = isAdmin || (usage && (typeof usage.remaining === 'number' ? usage.remaining > 0 : true));
    if (hasAccess && matchContext && !contextSent && hasRemainingUsage && !isLoadingHistory) {
      const contextMessage = `${matchContext.homeTeam} vs ${matchContext.awayTeam} maçını analiz et. Bu maç hakkında detaylı bilgi ver.`;
      
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
  }, [hasAccess, matchContext, contextSent, usage, sendMessage, isLoadingHistory, isAdmin]);

  const handleSendMessage = (message: string) => {
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

  // Usage check
  const hasRemainingUsage = isAdmin || (usage && (typeof usage.remaining === 'number' ? usage.remaining > 0 : true));
  const canChat = hasAccess && hasRemainingUsage;
  const isLimitReached = isPremium && !isAdmin && usage && typeof usage.remaining === 'number' && usage.remaining <= 0;

  // Show limit sheet when limit is reached
  useEffect(() => {
    if (isLimitReached && !showLimitSheet) {
      setShowLimitSheet(true);
    }
  }, [isLimitReached, showLimitSheet]);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-safe">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // GUEST: Not logged in - show guest gate
  if (isGuest) {
    return <GuestGate onClose={() => navigate(-1)} />;
  }

  // FREE USER: Logged in but no premium - show premium gate
  if (!canUseAIChat) {
    return <PremiumGate onClose={() => navigate(-1)} variant="chatbot" />;
  }

  // PREMIUM USER: Has access - show chat interface
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Chat Limit Sheet for Premium users */}
      <ChatLimitSheet
        isOpen={showLimitSheet}
        onClose={() => setShowLimitSheet(false)}
        currentPlan={planType}
        dailyLimit={dailyChatLimit}
      />

      {/* Header */}
      <motion.header
        {...fadeInUp}
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 pt-safe"
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
            
            {/* Bot Avatar with Online Status */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Bot className="w-4.5 h-4.5 text-white" />
                </div>
                {/* Online indicator */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background">
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                </span>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-sm">Gol Asistan</h1>
                  {isAdmin && (
                    <Badge variant="secondary" className="text-[10px] h-5 bg-amber-500/20 text-amber-600 border-0">
                      <Crown className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  {isPremiumPro && !isAdmin && (
                    <Badge variant="secondary" className="text-[10px] h-5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-600 border-0">
                      <Star className="w-3 h-3 mr-1" />
                      Pro
                    </Badge>
                  )}
                  {isPremiumPlus && !isAdmin && (
                    <Badge variant="secondary" className="text-[10px] h-5 bg-primary/20 text-primary border-0">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Plus
                    </Badge>
                  )}
                  {isPremiumBasic && !isAdmin && (
                    <Badge variant="secondary" className="text-[10px] h-5 bg-emerald-500/20 text-emerald-600 border-0">
                      Basic
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <p className="text-[10px] text-muted-foreground">
                    {chatLoading ? (
                      <motion.span
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        Yazıyor...
                      </motion.span>
                    ) : (
                      "Çevrimiçi"
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem 
                onClick={handleClearMessages}
                disabled={messages.length === 0}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Sohbeti Temizle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        <ChatContainer 
          messages={messages} 
          isLoading={chatLoading}
          isLoadingHistory={isLoadingHistory}
          onQuickPrompt={handleSendMessage}
        />
        
        {/* Usage meter for Premium users (not admin) */}
        {!isAdmin && usage && dailyChatLimit < 999 && (
          <UsageMeter current={usage.current} limit={usage.limit} isAdmin={false} />
        )}
        
        {/* Chat input */}
        <ChatInput
          onSend={handleSendMessage}
          isLoading={chatLoading}
          disabled={!canChat}
          disabledReason={isLimitReached ? "Günlük limitiniz doldu" : undefined}
          placeholder={
            matchContext
              ? `${matchContext.homeTeam} vs ${matchContext.awayTeam} hakkında sorun...`
              : "Futbol hakkında bir şeyler sorun..."
          }
          maxLength={500}
        />
      </main>

      <BottomNav />
    </div>
  );
};

export default Chat;
