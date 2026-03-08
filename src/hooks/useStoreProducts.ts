import { useState, useEffect, useCallback, useRef } from 'react';
import { purchaseService, ProductInfo, PRODUCTS } from '@/services/purchaseService';
import { PLAN_PRICES } from '@/constants/accessLevels';

interface StoreProducts {
  /** All products from the store */
  products: ProductInfo[];
  /** Whether products are still loading */
  isLoading: boolean;
  /** Get localized price string for a product ID (e.g. "₺52,99") */
  getPrice: (productId: string) => string;
  /** Get numeric price amount for a product ID */
  getPriceAmount: (productId: string) => number;
  /** Get the cheapest monthly price string for promotion text */
  cheapestMonthlyPrice: string;
}

// Module-level cache so multiple components share the same data
let cachedProducts: ProductInfo[] | null = null;
let fetchPromise: Promise<ProductInfo[]> | null = null;

export const useStoreProducts = (): StoreProducts => {
  const [products, setProducts] = useState<ProductInfo[]>(cachedProducts || []);
  const [isLoading, setIsLoading] = useState(!cachedProducts);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    if (cachedProducts) {
      setProducts(cachedProducts);
      setIsLoading(false);
      return;
    }

    const load = async () => {
      // Deduplicate concurrent calls
      if (!fetchPromise) {
        fetchPromise = (async () => {
          try {
            await purchaseService.initialize();
            return await purchaseService.getProducts();
          } catch (e) {
            console.error('useStoreProducts: failed to load', e);
            return [];
          } finally {
            fetchPromise = null;
          }
        })();
      }

      const result = await fetchPromise;
      if (result.length > 0) {
        cachedProducts = result;
      }
      if (mounted.current) {
        setProducts(result);
        setIsLoading(false);
      }
    };

    load();

    return () => {
      mounted.current = false;
    };
  }, []);

  const productMap = useRef<Map<string, ProductInfo>>(new Map());

  // Keep map in sync
  useEffect(() => {
    const map = new Map<string, ProductInfo>();
    products.forEach(p => map.set(p.productId, p));
    productMap.current = map;
  }, [products]);

  const getPrice = useCallback((productId: string): string => {
    const p = productMap.current.get(productId);
    if (p) return p.price;
    // Fallback to hardcoded
    return `₺${getFallbackPrice(productId)}`;
  }, []);

  const getPriceAmount = useCallback((productId: string): number => {
    const p = productMap.current.get(productId);
    if (p) return p.priceAmount;
    return getFallbackPrice(productId);
  }, []);

  // Cheapest monthly price for promo text (e.g. AnalysisLimitSheet)
  const cheapestMonthlyPrice = (() => {
    const basicMonthly = productMap.current.get(PRODUCTS.PREMIUM_BASIC_MONTHLY);
    if (basicMonthly) return basicMonthly.price;
    return `₺${PLAN_PRICES.premium_basic.monthly}`;
  })();

  return { products, isLoading, getPrice, getPriceAmount, cheapestMonthlyPrice };
};

function getFallbackPrice(productId: string): number {
  const isYearly = productId.includes('yearly');
  if (productId.includes('premium_pro')) return isYearly ? PLAN_PRICES.premium_pro.yearly : PLAN_PRICES.premium_pro.monthly;
  if (productId.includes('premium_plus')) return isYearly ? PLAN_PRICES.premium_plus.yearly : PLAN_PRICES.premium_plus.monthly;
  if (productId.includes('premium_basic')) return isYearly ? PLAN_PRICES.premium_basic.yearly : PLAN_PRICES.premium_basic.monthly;
  return 0;
}
