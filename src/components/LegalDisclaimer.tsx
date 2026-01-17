import React, { forwardRef, useState } from 'react';
import { AlertTriangle, Shield, Info, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LegalDisclaimerProps {
  className?: string;
}

const LegalDisclaimer = forwardRef<HTMLDivElement, LegalDisclaimerProps>(
  ({ className }, ref) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
      <div 
        ref={ref}
        className={cn(
          'glass-card border-muted/30 animate-fade-in overflow-hidden',
          className
        )}
      >
        {/* Collapsible Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-secondary" />
            </div>
            <span className="text-sm font-medium text-foreground">Yasal Uyarı ve Sorumluluk Reddi</span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </button>

        {/* Collapsible Content */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="px-4 pb-4 space-y-4">
                {/* 18 Yaş Uyarısı */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-loss/10 border border-loss/20">
                  <AlertTriangle className="w-5 h-5 text-loss shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">18 Yaş Uyarısı</h4>
                    <p className="text-xs text-muted-foreground">
                      Bu içerik yalnızca 18 yaş ve üzeri bireyler içindir. Yasal bahis oynama yaşının altındaysanız bu sayfayı terk ediniz.
                    </p>
                  </div>
                </div>

                {/* Yatırım Tavsiyesi Değildir */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                  <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">Yatırım Tavsiyesi Değildir</h4>
                    <p className="text-xs text-muted-foreground">
                      Bu sayfada sunulan analizler ve tahminler yalnızca bilgilendirme amaçlıdır ve yatırım, bahis veya finansal tavsiye niteliği taşımaz.
                    </p>
                  </div>
                </div>

                {/* Sorumlu Bahis */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">Sorumlu Bahis</h4>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Kaybetmeyi göze alabileceğiniz miktarlarla oynayın</li>
                      <li>Bahisi borç para ile oynamayın</li>
                      <li>Kayıplarınızı kovalamayın</li>
                    </ul>
                  </div>
                </div>

                {/* Yasal Uyumluluk */}
                <p className="text-xs text-muted-foreground border-t border-border/30 pt-3">
                  Bu platform, T.C. yasalarına uygun şekilde faaliyet göstermekte olup, yasadışı bahis faaliyetlerini desteklememektedir.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

LegalDisclaimer.displayName = 'LegalDisclaimer';

export default LegalDisclaimer;
