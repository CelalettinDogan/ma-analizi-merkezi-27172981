import React, { forwardRef } from 'react';
import { AlertTriangle, Shield, Info } from 'lucide-react';

interface LegalDisclaimerProps {
  className?: string;
}

const LegalDisclaimer = forwardRef<HTMLDivElement, LegalDisclaimerProps>(
  ({ className }, ref) => {
    return (
      <div 
        ref={ref}
        className={`glass-card p-6 md:p-8 border-secondary/30 animate-fade-in ${className || ''}`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-secondary" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground">Yasal Uyarı ve Sorumluluk Reddi</h3>
        </div>

        <div className="space-y-6">
          {/* 18 Yaş Uyarısı */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-loss/10 border border-loss/20">
            <AlertTriangle className="w-6 h-6 text-loss shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">18 Yaş Uyarısı</h4>
              <p className="text-sm text-muted-foreground">
                Bu içerik yalnızca 18 yaş ve üzeri bireyler içindir. Yasal bahis oynama yaşının altındaysanız bu sayfayı terk ediniz.
              </p>
            </div>
          </div>

          {/* Yatırım Tavsiyesi Değildir */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border border-border">
            <Info className="w-6 h-6 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">Yatırım Tavsiyesi Değildir</h4>
              <p className="text-sm text-muted-foreground">
                Bu sayfada sunulan analizler ve tahminler yalnızca bilgilendirme amaçlıdır ve yatırım, bahis veya finansal tavsiye niteliği taşımaz. 
                Herhangi bir bahis veya yatırım kararı tamamen sizin sorumluluğunuzdadır.
              </p>
            </div>
          </div>

          {/* Sorumlu Bahis */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <Shield className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">Sorumlu Bahis</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Bahis bir eğlence aracıdır, gelir kaynağı değildir. Lütfen:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Kaybetmeyi göze alabileceğiniz miktarlarla oynayın</li>
                <li>Bahisi borç para ile oynamayın</li>
                <li>Kayıplarınızı kovalamayın</li>
                <li>Bahis alışkanlığınızın kontrolden çıktığını düşünüyorsanız profesyonel yardım alın</li>
              </ul>
            </div>
          </div>

          {/* Yasal Uyumluluk */}
          <div className="text-xs text-muted-foreground border-t border-border pt-4">
            <p>
              Bu platform, T.C. yasalarına uygun şekilde faaliyet göstermekte olup, yasadışı bahis faaliyetlerini desteklememekte 
              veya teşvik etmemektedir. İçeriklerimiz yalnızca eğitim ve bilgilendirme amaçlıdır.
            </p>
          </div>
        </div>
      </div>
    );
  }
);

LegalDisclaimer.displayName = 'LegalDisclaimer';

export default LegalDisclaimer;
