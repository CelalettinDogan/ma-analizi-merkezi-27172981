import React from 'react';
import { Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBetSlip } from '@/contexts/BetSlipContext';
import BetSlipDrawer from './BetSlipDrawer';

const BetSlipButton: React.FC = () => {
  const { itemCount, setIsOpen, totalOdds } = useBetSlip();

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 px-4 rounded-full shadow-lg bg-primary hover:bg-primary/90 glow-effect"
        size="lg"
      >
        <Receipt className="h-5 w-5 mr-2" />
        <span className="font-semibold">Kupon</span>
        {itemCount > 0 && (
          <span className="ml-2 flex items-center">
            <span className="bg-secondary text-secondary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
              {itemCount}
            </span>
            <span className="ml-2 text-sm opacity-90">
              ({totalOdds.toFixed(2)})
            </span>
          </span>
        )}
      </Button>
      <BetSlipDrawer />
    </>
  );
};

export default BetSlipButton;
