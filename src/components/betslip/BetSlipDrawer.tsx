import React, { useState } from 'react';
import { Trash2, Save, Receipt } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBetSlip } from '@/contexts/BetSlipContext';
import { formatOdds, formatCurrency } from '@/utils/oddsCalculator';
import BetSlipItemComponent from './BetSlipItem';

const BetSlipDrawer: React.FC = () => {
  const {
    items,
    stake,
    totalOdds,
    potentialWin,
    isOpen,
    setIsOpen,
    removeFromSlip,
    clearSlip,
    updateStake,
    saveSlip,
  } = useBetSlip();

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const success = await saveSlip();
    setIsSaving(false);
    if (success) {
      setIsOpen(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-card border-border">
        <SheetHeader className="space-y-1">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Receipt className="h-5 w-5 text-primary" />
            Kuponum
            {items.length > 0 && (
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {items.length} maç
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Kuponunuz boş</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tahminleri kupona eklemek için "Kupona Ekle" butonuna tıklayın.
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-3 py-4">
                {items.map((item) => (
                  <BetSlipItemComponent
                    key={item.id}
                    item={item}
                    onRemove={removeFromSlip}
                  />
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <Label htmlFor="stake" className="text-muted-foreground">
                  Yatırım Miktarı (₺)
                </Label>
                <Input
                  id="stake"
                  type="number"
                  min="1"
                  value={stake}
                  onChange={(e) => updateStake(Number(e.target.value))}
                  className="bg-muted/50 border-border"
                />
              </div>

              <Separator className="bg-border" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Toplam Oran</span>
                  <span className="font-bold text-secondary">{formatOdds(totalOdds)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Yatırım</span>
                  <span className="font-medium text-foreground">{formatCurrency(stake)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-foreground">Potansiyel Kazanç</span>
                  <span className="font-bold gradient-text">{formatCurrency(potentialWin)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                  onClick={clearSlip}
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

export default BetSlipDrawer;
