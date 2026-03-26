import React from 'react';
import { User, Crown, Zap, MessageCircle, Brain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ProfileHeaderProps {
  displayName: string;
  initials: string;
  email: string;
  memberSince: string | null;
  isAdmin: boolean;
  isPremium: boolean;
  planDisplayName: string;
  hasUnlimitedAnalyses: boolean;
  analysisRemaining: number;
  dailyAnalysisLimit: number;
  canUseAIChat: boolean;
  dailyChatLimit: number;
  chatRemaining: number | string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  displayName, initials, email, memberSince,
  isAdmin, isPremium, planDisplayName,
  hasUnlimitedAnalyses, analysisRemaining, dailyAnalysisLimit,
  canUseAIChat, dailyChatLimit, chatRemaining,
}) => {
  const getPlanBadgeStyle = () => {
    if (isAdmin) return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
    switch (planDisplayName) {
      case 'Premium Pro': return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-600 border-purple-500/30';
      case 'Premium Plus': return 'bg-primary/20 text-primary border-primary/30';
      case 'Premium Basic': return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Card className="glass-card">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "rounded-full p-[2px] flex-shrink-0",
            isAdmin 
              ? "bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 shadow-[0_0_16px_rgba(245,158,11,0.3)]"
              : isPremium 
                ? "bg-gradient-to-br from-primary via-primary to-emerald-500 shadow-[0_0_12px_hsl(var(--primary)/0.25)]"
                : "bg-gradient-to-br from-primary/40 to-primary/20"
          )}>
            <Avatar className="h-12 w-12 xs:h-14 xs:w-14 border-2 border-background">
              <AvatarFallback className="bg-primary/10 text-primary text-base font-bold">{initials}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold truncate font-display">{displayName}</h1>
              {(isPremium || isAdmin) && <Crown className="h-4 w-4 text-amber-500 flex-shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground break-all min-w-0">{email}</p>
            {memberSince && <p className="text-micro text-muted-foreground mt-0.5">Üye: {memberSince}</p>}
          </div>
        </div>

        <div className="flex items-center">
          {isAdmin ? (
            <Badge variant="outline" className="text-xs bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
              <Crown className="w-3 h-3 mr-1" /> Admin
            </Badge>
          ) : isPremium ? (
            <Badge variant="outline" className={`text-xs ${getPlanBadgeStyle()}`}>
              <Crown className="w-3 h-3 mr-1" /> {planDisplayName}
            </Badge>
          ) : (
            <Badge variant="outline" className={`text-xs ${getPlanBadgeStyle()}`}>
              <User className="w-3 h-3 mr-1" /> Ücretsiz Kullanıcı
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30">
            <div className="p-1.5 rounded-xl bg-primary/10">
              <Zap className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-micro text-muted-foreground leading-tight">Günlük Analiz</p>
              <p className="text-sm font-semibold leading-tight">
                {hasUnlimitedAnalyses ? (
                  <span className="text-emerald-500">Sınırsız</span>
                ) : (
                  <span>{analysisRemaining}/{dailyAnalysisLimit}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30">
            <div className="p-1.5 rounded-xl bg-primary/10">
              <MessageCircle className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-micro text-muted-foreground leading-tight">AI Asistan</p>
              <p className="text-sm font-semibold leading-tight">
                {!canUseAIChat ? (
                  <span className="text-muted-foreground">Kapalı</span>
                ) : dailyChatLimit >= 999 ? (
                  <span className="text-emerald-500">Sınırsız</span>
                ) : (
                  <span>{chatRemaining}/{dailyChatLimit}</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/30">
          <Brain className="w-4 h-4 text-primary flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">Analiz Motoru</p>
            <p className="text-micro text-muted-foreground">En güncel verilerle düzenli olarak iyileştirilmektedir.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;
