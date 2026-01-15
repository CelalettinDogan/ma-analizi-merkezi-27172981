import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { BetSlipItem } from '@/types/betslip';
import { saveBetSlip } from '@/services/betSlipService';
import { useToast } from '@/hooks/use-toast';

interface BetSlipContextType {
  items: BetSlipItem[];
  itemCount: number;
  isOpen: boolean;
  addToSlip: (item: Omit<BetSlipItem, 'id'>) => void;
  removeFromSlip: (id: string) => void;
  clearSlip: () => void;
  saveSlip: (name?: string) => Promise<boolean>;
  isInSlip: (homeTeam: string, awayTeam: string, predictionType: string) => boolean;
  setIsOpen: (open: boolean) => void;
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined);

export function BetSlipProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BetSlipItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const itemCount = items.length;

  const addToSlip = useCallback((item: Omit<BetSlipItem, 'id'>) => {
    const id = `${item.homeTeam}-${item.awayTeam}-${item.predictionType}-${Date.now()}`;
    setItems((prev) => [...prev, { ...item, id }]);
    toast({
      title: 'Kupona Eklendi',
      description: `${item.homeTeam} vs ${item.awayTeam} - ${item.predictionType}`,
    });
  }, [toast]);

  const removeFromSlip = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearSlip = useCallback(() => {
    setItems([]);
  }, []);

  const saveSlip = useCallback(async (name?: string): Promise<boolean> => {
    if (items.length === 0) {
      toast({
        title: 'Hata',
        description: 'Kupon boş. Lütfen en az bir tahmin ekleyin.',
        variant: 'destructive',
      });
      return false;
    }

    const slipId = await saveBetSlip(items, name);
    
    if (slipId) {
      toast({
        title: 'Kupon Kaydedildi',
        description: `${items.length} tahmin kaydedildi`,
      });
      clearSlip();
      return true;
    } else {
      toast({
        title: 'Hata',
        description: 'Kupon kaydedilemedi. Lütfen tekrar deneyin.',
        variant: 'destructive',
      });
      return false;
    }
  }, [items, toast, clearSlip]);

  const isInSlip = useCallback((homeTeam: string, awayTeam: string, predictionType: string): boolean => {
    return items.some(
      (item) =>
        item.homeTeam === homeTeam &&
        item.awayTeam === awayTeam &&
        item.predictionType === predictionType
    );
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      itemCount,
      isOpen,
      addToSlip,
      removeFromSlip,
      clearSlip,
      saveSlip,
      isInSlip,
      setIsOpen,
    }),
    [items, itemCount, isOpen, addToSlip, removeFromSlip, clearSlip, saveSlip, isInSlip]
  );

  return <BetSlipContext.Provider value={value}>{children}</BetSlipContext.Provider>;
}

export function useBetSlip() {
  const context = useContext(BetSlipContext);
  if (context === undefined) {
    throw new Error('useBetSlip must be used within a BetSlipProvider');
  }
  return context;
}
