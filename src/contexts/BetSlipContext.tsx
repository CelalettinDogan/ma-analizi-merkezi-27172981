import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { BetSlipItem } from '@/types/betslip';
import { saveBetSlip } from '@/services/betSlipService';
import { getLuckyPicks, luckyPickToBetSlipItem } from '@/services/luckyPicksService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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
  addLuckyPicks: () => Promise<number>;
  isLoadingLucky: boolean;
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined);

export function BetSlipProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BetSlipItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingLucky, setIsLoadingLucky] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const itemCount = items.length;

  const addToSlip = useCallback((item: Omit<BetSlipItem, 'id'>) => {
    if (!user) {
      toast({
        title: 'Giriş Gerekli',
        description: 'Kupona eklemek için lütfen giriş yapın.',
        variant: 'destructive',
      });
      return;
    }
    
    const id = `${item.homeTeam}-${item.awayTeam}-${item.predictionType}-${Date.now()}`;
    setItems((prev) => [...prev, { ...item, id }]);
    toast({
      title: 'Kupona Eklendi',
      description: `${item.homeTeam} vs ${item.awayTeam} - ${item.predictionType}`,
    });
  }, [toast, user]);

  const removeFromSlip = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearSlip = useCallback(() => {
    setItems([]);
  }, []);

  const saveSlip = useCallback(async (name?: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Giriş Gerekli',
        description: 'Kupon kaydetmek için lütfen giriş yapın.',
        variant: 'destructive',
      });
      return false;
    }

    if (items.length === 0) {
      toast({
        title: 'Hata',
        description: 'Kupon boş. Lütfen en az bir tahmin ekleyin.',
        variant: 'destructive',
      });
      return false;
    }

    const slipId = await saveBetSlip(items, user.id, name);
    
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
  }, [items, user, toast, clearSlip]);

  const isInSlip = useCallback((homeTeam: string, awayTeam: string, predictionType: string): boolean => {
    return items.some(
      (item) =>
        item.homeTeam === homeTeam &&
        item.awayTeam === awayTeam &&
        item.predictionType === predictionType
    );
  }, [items]);

  const addLuckyPicks = useCallback(async (): Promise<number> => {
    if (!user) {
      toast({
        title: 'Giriş Gerekli',
        description: 'Şanslı kupon için lütfen giriş yapın.',
        variant: 'destructive',
      });
      return 0;
    }

    setIsLoadingLucky(true);
    try {
      const luckyPicks = await getLuckyPicks(3);
      
      if (luckyPicks.length === 0) {
        toast({
          title: 'Tahmin Bulunamadı',
          description: 'Şu an için yeterli tahmin mevcut değil. Önce maç analizi yapın.',
          variant: 'destructive',
        });
        return 0;
      }

      let addedCount = 0;
      const newItems: BetSlipItem[] = [];

      for (const pick of luckyPicks) {
        // Skip if already in slip
        if (isInSlip(pick.homeTeam, pick.awayTeam, pick.predictionType)) {
          continue;
        }

        const slipItem = luckyPickToBetSlipItem(pick);
        const id = `${slipItem.homeTeam}-${slipItem.awayTeam}-${slipItem.predictionType}-${Date.now()}-${addedCount}`;
        newItems.push({ ...slipItem, id });
        addedCount++;
      }

      const skippedCount = luckyPicks.length - newItems.length;
      
      if (newItems.length > 0) {
        setItems((prev) => [...prev, ...newItems]);
        const skippedMessage = skippedCount > 0 
          ? ` (${skippedCount} tahmin zaten kuponda)`
          : '';
        toast({
          title: '🍀 Şanslı Kupon!',
          description: `${newItems.length} yüksek güvenli tahmin eklendi${skippedMessage}`,
        });
      } else {
        toast({
          title: 'Tahminler Zaten Kuponda',
          description: `${luckyPicks.length} seçili tahmin de zaten kuponunuzda mevcut.`,
        });
      }

      return addedCount;
    } catch (error) {
      console.error('Lucky picks error:', error);
      toast({
        title: 'Hata',
        description: 'Şanslı tahminler yüklenemedi.',
        variant: 'destructive',
      });
      return 0;
    } finally {
      setIsLoadingLucky(false);
    }
  }, [user, toast, isInSlip]);

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
      addLuckyPicks,
      isLoadingLucky,
    }),
    [items, itemCount, isOpen, addToSlip, removeFromSlip, clearSlip, saveSlip, isInSlip, addLuckyPicks, isLoadingLucky]
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
