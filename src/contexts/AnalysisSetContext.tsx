import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { AnalysisSetItem } from '@/types/analysisSet';
import { saveBetSlip } from '@/services/betSlipService';
import { getLuckyPicks, luckyPickToBetSlipItem } from '@/services/luckyPicksService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AnalysisSetContextType {
  items: AnalysisSetItem[];
  itemCount: number;
  isOpen: boolean;
  addToSet: (item: Omit<AnalysisSetItem, 'id'>) => void;
  removeFromSet: (id: string) => void;
  clearSet: () => void;
  saveSet: (name?: string) => Promise<boolean>;
  isInSet: (homeTeam: string, awayTeam: string, predictionType: string) => boolean;
  setIsOpen: (open: boolean) => void;
  addSmartPicks: () => Promise<number>;
  isLoadingSmart: boolean;
}

const AnalysisSetContext = createContext<AnalysisSetContextType | undefined>(undefined);

export function AnalysisSetProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<AnalysisSetItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingSmart, setIsLoadingSmart] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const itemCount = items.length;

  const addToSet = useCallback((item: Omit<AnalysisSetItem, 'id'>) => {
    if (!user) {
      toast({
        title: 'Giriş Gerekli',
        description: 'Analiz setine eklemek için lütfen giriş yapın.',
        variant: 'destructive',
      });
      return;
    }
    
    const id = `${item.homeTeam}-${item.awayTeam}-${item.predictionType}-${Date.now()}`;
    setItems((prev) => [...prev, { ...item, id }]);
    toast({
      title: 'Analize Eklendi',
      description: `${item.homeTeam} vs ${item.awayTeam} - ${item.predictionType}`,
    });
  }, [toast, user]);

  const removeFromSet = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearSet = useCallback(() => {
    setItems([]);
  }, []);

  const saveSet = useCallback(async (name?: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Giriş Gerekli',
        description: 'Analiz seti kaydetmek için lütfen giriş yapın.',
        variant: 'destructive',
      });
      return false;
    }

    if (items.length === 0) {
      toast({
        title: 'Hata',
        description: 'Analiz seti boş. Lütfen en az bir analiz ekleyin.',
        variant: 'destructive',
      });
      return false;
    }

    // Map to betslip format for DB compatibility
    const slipItems = items.map(item => ({
      league: item.league,
      homeTeam: item.homeTeam,
      awayTeam: item.awayTeam,
      matchDate: item.matchDate,
      predictionType: item.predictionType,
      predictionValue: item.predictionValue,
      confidence: item.confidence,
      odds: item.odds,
    }));

    const slipId = await saveBetSlip(slipItems as any, user.id, name);
    
    if (slipId) {
      toast({
        title: 'Analiz Seti Kaydedildi',
        description: `${items.length} analiz kaydedildi`,
      });
      clearSet();
      return true;
    } else {
      toast({
        title: 'Hata',
        description: 'Analiz seti kaydedilemedi. Lütfen tekrar deneyin.',
        variant: 'destructive',
      });
      return false;
    }
  }, [items, user, toast, clearSet]);

  const isInSet = useCallback((homeTeam: string, awayTeam: string, predictionType: string): boolean => {
    return items.some(
      (item) =>
        item.homeTeam === homeTeam &&
        item.awayTeam === awayTeam &&
        item.predictionType === predictionType
    );
  }, [items]);

  const addSmartPicks = useCallback(async (): Promise<number> => {
    if (!user) {
      toast({
        title: 'Giriş Gerekli',
        description: 'Akıllı seçim için lütfen giriş yapın.',
        variant: 'destructive',
      });
      return 0;
    }

    setIsLoadingSmart(true);
    try {
      const luckyPicks = await getLuckyPicks(3);
      
      if (luckyPicks.length === 0) {
        toast({
          title: 'Analiz Bulunamadı',
          description: 'Şu an için yeterli analiz mevcut değil. Önce maç analizi yapın.',
          variant: 'destructive',
        });
        return 0;
      }

      let addedCount = 0;
      const newItems: AnalysisSetItem[] = [];

      for (const pick of luckyPicks) {
        if (isInSet(pick.homeTeam, pick.awayTeam, pick.predictionType)) {
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
          ? ` (${skippedCount} analiz zaten sette)`
          : '';
        toast({
          title: '🎯 Akıllı Seçim!',
          description: `${newItems.length} yüksek güvenli analiz eklendi${skippedMessage}`,
        });
      } else {
        toast({
          title: 'Analizler Zaten Sette',
          description: `${luckyPicks.length} seçili analiz de zaten setinizde mevcut.`,
        });
      }

      return addedCount;
    } catch (error) {
      console.error('Smart picks error:', error);
      toast({
        title: 'Hata',
        description: 'Akıllı seçim yüklenemedi.',
        variant: 'destructive',
      });
      return 0;
    } finally {
      setIsLoadingSmart(false);
    }
  }, [user, toast, isInSet]);

  const value = useMemo(
    () => ({
      items,
      itemCount,
      isOpen,
      addToSet,
      removeFromSet,
      clearSet,
      saveSet,
      isInSet,
      setIsOpen,
      addSmartPicks,
      isLoadingSmart,
    }),
    [items, itemCount, isOpen, addToSet, removeFromSet, clearSet, saveSet, isInSet, addSmartPicks, isLoadingSmart]
  );

  return <AnalysisSetContext.Provider value={value}>{children}</AnalysisSetContext.Provider>;
}

export function useAnalysisSet() {
  const context = useContext(AnalysisSetContext);
  if (context === undefined) {
    throw new Error('useAnalysisSet must be used within an AnalysisSetProvider');
  }
  return context;
}

// Backward compatibility alias
export const useBetSlip = useAnalysisSet;
export const BetSlipProvider = AnalysisSetProvider;
