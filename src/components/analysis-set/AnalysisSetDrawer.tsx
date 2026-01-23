import React, { useState } from 'react';
import { Trash2, Save, FileText, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAnalysisSet } from '@/contexts/AnalysisSetContext';
import AnalysisSetItem from './AnalysisSetItem';

const AnalysisSetDrawer: React.FC = () => {
  const {
    items,
    isOpen,
    setIsOpen,
    removeFromSet,
    clearSet,
    saveSet,
    addSmartPicks,
    isLoadingSmart,
  } = useAnalysisSet();

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const success = await saveSet();
    setIsSaving(false);
    if (success) {
      setIsOpen(false);
    }
  };

  const handleSmartPicks = async () => {
    await addSmartPicks();
  };

  const confidenceCounts = items.reduce(
    (acc, item) => {
      acc[item.confidence]++;
      return acc;
    },
    { düşük: 0, orta: 0, yüksek: 0 }
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-card border-border">
        <SheetHeader className="space-y-1">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-primary" />
            Analiz Setim
            {items.length > 0 && (
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {items.length} analiz
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Analiz setiniz boş</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Maç analizlerini sete eklemek için "Analize Ekle" butonuna tıklayın.
            </p>
            
            <Button
              variant="outline"
              className="gap-2 border-primary/50 text-primary hover:bg-primary/10 hover:border-primary min-w-[220px]"
              onClick={handleSmartPicks}
              disabled={isLoadingSmart}
            >
              {isLoadingSmart ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span className="truncate">
                {isLoadingSmart ? 'Analizler Yükleniyor...' : '🎯 Akıllı Seçim'}
              </span>
            </Button>
          </div>
        ) : (
          <>
            <Alert className="bg-muted/30 border-border">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <AlertDescription className="text-xs text-muted-foreground">
                Bu analizler istatistiksel verilere dayanmaktadır. Kesin sonuç garantisi yoktur.
              </AlertDescription>
            </Alert>

            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 border-primary/50 text-primary hover:bg-primary/10 hover:border-primary mt-2 min-h-[36px]"
              onClick={handleSmartPicks}
              disabled={isLoadingSmart}
            >
              {isLoadingSmart ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span className="truncate">
                {isLoadingSmart ? 'Analizler Yükleniyor...' : '🎯 Akıllı Seçim'}
              </span>
            </Button>

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-3 py-4">
                {items.map((item) => (
                  <AnalysisSetItem
                    key={item.id}
                    item={item}
                    onRemove={removeFromSet}
                  />
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-4 pt-4 border-t border-border">
              <Separator className="bg-border" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Toplam Analiz</span>
                  <span className="font-bold text-foreground">{items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Yüksek Güven</span>
                  <span className="font-medium text-win">{confidenceCounts.yüksek}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Orta Güven</span>
                  <span className="font-medium text-draw">{confidenceCounts.orta}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Düşük Güven</span>
                  <span className="font-medium text-loss">{confidenceCounts.düşük}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                  onClick={clearSet}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Temizle
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default AnalysisSetDrawer;
