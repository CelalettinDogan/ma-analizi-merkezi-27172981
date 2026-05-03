import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Twitter, MessageCircle, Copy, Download, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatPredictionValue, formatConfidenceLabel } from '@/utils/predictionLabels';

interface ShareCardProps {
  homeTeam: string;
  awayTeam: string;
  prediction: string;
  confidence: string;
  league: string;
  matchDate: string;
  homeCrest?: string;
  awayCrest?: string;
}

const ShareCard: React.FC<ShareCardProps> = ({
  homeTeam,
  awayTeam,
  prediction,
  confidence,
  league,
  matchDate,
  homeCrest,
  awayCrest,
}) => {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const copiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const getConfidenceColor = (conf: string) => {
    const c = conf.toLowerCase();
    if (c.includes('yüksek') || c.includes('high') || c.includes('hoch') || c.includes('alto') || c.includes('مرتفع')) return 'from-primary to-emerald-500';
    if (c.includes('orta') || c.includes('medium') || c.includes('mittel') || c.includes('medio') || c.includes('متوسط')) return 'from-secondary to-amber-500';
    return 'from-muted-foreground to-slate-500';
  };

  const shareText = t('share.shareText', { home: homeTeam, away: awayTeam, prediction, confidence, league });
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareText + '\n' + shareUrl);
      setCopied(true);
      toast({ title: t('share.toasts.copied'), description: t('share.toasts.copiedDesc') });
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ title: t('share.toasts.errorTitle'), description: t('share.toasts.copyError'), variant: 'destructive' });
    }
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#0a0f1a', scale: 2 });
      const link = document.createElement('a');
      link.download = `golmetrik-${homeTeam}-vs-${awayTeam}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast({ title: t('share.toasts.downloaded'), description: t('share.toasts.downloadedDesc') });
    } catch (err) {
      toast({ title: t('share.toasts.errorTitle'), description: t('share.toasts.downloadError'), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">{t('share.button')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            {t('share.dialogTitle')}
          </DialogTitle>
        </DialogHeader>

        <div ref={cardRef} className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-card via-background to-muted">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <div className="relative flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-muted-foreground">{league}</span>
            <span className="text-xs text-muted-foreground">{matchDate}</span>
          </div>

          <div className="relative flex items-center justify-between gap-4 mb-6">
            <div className="flex flex-col items-center gap-2 flex-1">
              {homeCrest ? (
                <img src={homeCrest} alt={homeTeam} className="w-12 h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold">{homeTeam.charAt(0)}</div>
              )}
              <span className="text-sm font-semibold text-center">{homeTeam}</span>
            </div>
            <span className="text-2xl font-bold text-muted-foreground">vs</span>
            <div className="flex flex-col items-center gap-2 flex-1">
              {awayCrest ? (
                <img src={awayCrest} alt={awayTeam} className="w-12 h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold">{awayTeam.charAt(0)}</div>
              )}
              <span className="text-sm font-semibold text-center">{awayTeam}</span>
            </div>
          </div>

          <div className="relative space-y-3">
            <div className={cn("px-4 py-3 rounded-lg bg-gradient-to-r text-white font-semibold text-center", getConfidenceColor(confidence))}>
              {formatPredictionValue(t, prediction)}
            </div>
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">{t('share.confidence')}</span>
              <span className="font-semibold">{formatConfidenceLabel(t, confidence)}</span>
            </div>
          </div>

          <div className="relative mt-6 pt-4 border-t border-border/30 flex items-center justify-center gap-2">
            <span className="text-xs font-bold gradient-text">⚽ {t('share.watermark')}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <Button variant="outline" className="flex flex-col items-center gap-1 h-auto py-3" onClick={handleTwitterShare} aria-label={t('share.ariaTwitter')}>
            <Twitter className="w-5 h-5 text-[#1DA1F2]" />
            <span className="text-xs">{t('share.twitter')}</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center gap-1 h-auto py-3" onClick={handleWhatsAppShare} aria-label={t('share.ariaWhatsapp')}>
            <MessageCircle className="w-5 h-5 text-[#25D366]" />
            <span className="text-xs">{t('share.whatsapp')}</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center gap-1 h-auto py-3" onClick={handleCopyLink} aria-label={t('share.ariaCopy')}>
            {copied ? <Check className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5" />}
            <span className="text-xs">{copied ? t('share.copied') : t('share.copy')}</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center gap-1 h-auto py-3" onClick={handleDownload} aria-label={t('share.ariaDownload')}>
            <Download className="w-5 h-5" />
            <span className="text-xs">{t('share.download')}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareCard;
