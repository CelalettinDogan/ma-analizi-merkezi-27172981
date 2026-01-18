import React, { forwardRef, useState } from 'react';
import { Info, FileText, TrendingUp, Database, ChevronDown } from 'lucide-react';
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
            <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
              <Info className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">Sorumluluk Reddi</span>
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
                {/* Bilgilendirme Amaçlı İçerik */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                  <FileText className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">Bilgilendirme Amaçlı İçerik</h4>
                    <p className="text-xs text-muted-foreground">
                      Bu platformda sunulan tüm analizler, istatistikler ve tahminler yalnızca bilgilendirme amaçlıdır.
                    </p>
                  </div>
                </div>

                {/* Finansal Tavsiye Değildir */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                  <TrendingUp className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">Finansal Tavsiye Değildir</h4>
                    <p className="text-xs text-muted-foreground">
                      İçeriklerimiz herhangi bir yatırım veya finansal tavsiye niteliği taşımaz. Kararlarınızdan yalnızca siz sorumlusunuz.
                    </p>
                  </div>
                </div>

                {/* Veri Kaynakları */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                  <Database className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">Veri Kaynakları</h4>
                    <p className="text-xs text-muted-foreground">
                      Maç verileri ve istatistikler üçüncü parti kaynaklardan alınmaktadır. Verilerin doğruluğu garanti edilmez.
                    </p>
                  </div>
                </div>

                {/* Tahmin Sonuçları */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">Tahmin Sonuçları</h4>
                    <p className="text-xs text-muted-foreground">
                      Tahminlerin doğru çıkacağına dair herhangi bir garanti verilmez. Platform, tahmin sonuçlarından dolayı sorumluluk kabul etmez.
                    </p>
                  </div>
                </div>
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
