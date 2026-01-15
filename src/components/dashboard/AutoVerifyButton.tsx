import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, AlertCircle, Sparkles, Brain } from 'lucide-react';
import { autoVerifyPredictions } from '@/services/autoVerifyService';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AutoVerifyButtonProps {
  onVerificationComplete: () => void;
}

const AutoVerifyButton: React.FC<AutoVerifyButtonProps> = ({ onVerificationComplete }) => {
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{
    verified: Array<{
      homeTeam: string;
      awayTeam: string;
      homeScore: number;
      awayScore: number;
      wasCorrect: boolean;
      predictionType: string;
      predictionValue: string;
    }>;
    notFound: Array<{
      home_team: string;
      away_team: string;
      match_date: string;
    }>;
    errors: string[];
    mlStatsUpdated: number;
  } | null>(null);

  const handleAutoVerify = async () => {
    setIsVerifying(true);
    try {
      const verificationResults = await autoVerifyPredictions();
      setResults(verificationResults);
      
      const correctCount = verificationResults.verified.filter(v => v.wasCorrect).length;
      const incorrectCount = verificationResults.verified.filter(v => !v.wasCorrect).length;
      
      if (verificationResults.verified.length > 0) {
        toast({
          title: '🤖 AI Öğrenme Güncellendi',
          description: `${verificationResults.verified.length} tahmin doğrulandı (${correctCount}✓ / ${incorrectCount}✗) • ML model güncellendi`,
        });
        setShowResults(true);
        onVerificationComplete();
      } else if (verificationResults.notFound.length > 0) {
        toast({
          title: 'Sonuç Bulunamadı',
          description: `${verificationResults.notFound.length} maç için henüz sonuç bulunamadı.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Bilgi',
          description: 'Doğrulanacak bekleyen tahmin bulunamadı.',
        });
      }
      
      if (verificationResults.errors.length > 0) {
        console.warn('Verification errors:', verificationResults.errors);
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Otomatik doğrulama sırasında bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleAutoVerify}
        disabled={isVerifying}
        variant="outline"
        className="gap-2"
      >
        <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
        {isVerifying ? 'Doğrulanıyor...' : 'Otomatik Doğrula'}
      </Button>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Doğrulama Sonuçları
              {results && results.mlStatsUpdated > 0 && (
                <Badge variant="outline" className="ml-2 gap-1 border-primary/30 text-primary">
                  <Sparkles className="w-3 h-3" />
                  AI Güncellendi
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {results && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                {/* ML Learning Stats */}
                {results.mlStatsUpdated > 0 && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground">AI Öğrenme Döngüsü</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {results.mlStatsUpdated} tahmin sonucu ML modeline aktarıldı. 
                      Gelecek tahminler bu verilerden öğrenecek.
                    </p>
                  </div>
                )}

                {results.verified.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-foreground">
                      Doğrulanan Tahminler ({results.verified.length})
                    </h4>
                    <div className="space-y-2">
                      {results.verified.map((v, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm text-foreground">
                              {v.homeTeam} {v.homeScore} - {v.awayScore} {v.awayTeam}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {v.predictionType}: {v.predictionValue}
                            </p>
                          </div>
                          <Badge 
                            variant={v.wasCorrect ? 'default' : 'destructive'}
                            className="flex items-center gap-1"
                          >
                            {v.wasCorrect ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                Doğru
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3" />
                                Yanlış
                              </>
                            )}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.notFound.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-muted-foreground">
                      Sonuç Bulunamayan Maçlar ({results.notFound.length})
                    </h4>
                    <div className="space-y-1">
                      {results.notFound.slice(0, 5).map((nf, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground">
                          {nf.home_team} vs {nf.away_team} ({nf.match_date})
                        </p>
                      ))}
                      {results.notFound.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          ... ve {results.notFound.length - 5} maç daha
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {results.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-destructive">
                      Hatalar ({results.errors.length})
                    </h4>
                    <div className="space-y-1">
                      {results.errors.map((err, idx) => (
                        <p key={idx} className="text-xs text-destructive/80">
                          {err}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AutoVerifyButton;
