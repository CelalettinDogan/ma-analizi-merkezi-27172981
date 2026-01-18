import React from 'react';
import { Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBetSlip } from '@/contexts/BetSlipContext';
import BetSlipDrawer from './BetSlipDrawer';
import { useIsMobile } from '@/hooks/use-mobile';

const BetSlipButton: React.FC = () => {
  const { itemCount, setIsOpen } = useBetSlip();
  const isMobile = useIsMobile();

  // Mobile: position above BottomNav (bottom-20 = 80px)
  // Desktop: normal position (bottom-6 = 24px)
  const positionClass = isMobile 
    ? "fixed bottom-20 right-4 z-50" 
    : "fixed bottom-6 right-6 z-50";

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={`${positionClass} h-12 px-4 rounded-full shadow-lg bg-primary hover:bg-primary/90 glow-effect`}
        size="lg"
      >
        <Receipt className="h-5 w-5 mr-2" />
        <span className="font-semibold">Kupon</span>
        {itemCount > 0 && (
          <span className="ml-2 bg-secondary text-secondary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
            {itemCount}
          </span>
        )}
      </Button>
      <BetSlipDrawer />
    </>
  );
};

export default BetSlipButton;
