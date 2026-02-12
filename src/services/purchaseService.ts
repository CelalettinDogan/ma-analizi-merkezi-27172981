import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import { supabase } from '@/integrations/supabase/client';
import { PLAN_PRICES, type PlanType } from '@/constants/accessLevels';

export interface PurchaseResult {
  success: boolean;
  error?: string;
  subscription?: {
    id: string;
    planType: string;
    expiresAt: string;
    autoRenewing: boolean;
  };
}

export interface ProductInfo {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
  planType: PlanType;
  period: 'monthly' | 'yearly';
}

// Product IDs - Play Store'daki abonelik ID'leriyle eşleşmeli
export const PRODUCTS = {
  PREMIUM_BASIC_MONTHLY: 'premium_basic_monthly',
  PREMIUM_BASIC_YEARLY: 'premium_basic_yearly',
  PREMIUM_PLUS_MONTHLY: 'premium_plus_monthly',
  PREMIUM_PLUS_YEARLY: 'premium_plus_yearly',
  PREMIUM_PRO_MONTHLY: 'premium_pro_monthly',
  PREMIUM_PRO_YEARLY: 'premium_pro_yearly',
} as const;

export const PLAN_PRODUCTS = {
  premium_basic: {
    monthly: PRODUCTS.PREMIUM_BASIC_MONTHLY,
    yearly: PRODUCTS.PREMIUM_BASIC_YEARLY,
    name: 'Premium Basic',
    chatLimit: 3,
  },
  premium_plus: {
    monthly: PRODUCTS.PREMIUM_PLUS_MONTHLY,
    yearly: PRODUCTS.PREMIUM_PLUS_YEARLY,
    name: 'Premium Plus',
    chatLimit: 5,
  },
  premium_pro: {
    monthly: PRODUCTS.PREMIUM_PRO_MONTHLY,
    yearly: PRODUCTS.PREMIUM_PRO_YEARLY,
    name: 'Premium Pro',
    chatLimit: 10,
  },
} as const;

const ALL_PRODUCT_IDS = Object.values(PRODUCTS);

class PurchaseService {
  private isNative: boolean;
  private initialized = false;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  /**
   * Initialize billing - call once on app start
   */
  async initialize(): Promise<void> {
    if (!this.isNative || this.initialized) return;

    try {
      const { isBillingSupported } = await NativePurchases.isBillingSupported();
      if (!isBillingSupported) {
        console.warn('PurchaseService: Billing not supported on this device');
        return;
      }
      this.initialized = true;
      console.log('PurchaseService: Initialized successfully');
    } catch (error) {
      console.error('PurchaseService: Init failed', error);
    }
  }

  /**
   * Get products from Google Play with real localized prices
   */
  async getProducts(): Promise<ProductInfo[]> {
    if (!this.isNative || !this.initialized) {
      return this.getWebProducts();
    }

    try {
      const { products } = await NativePurchases.getProducts({
        productIdentifiers: [...ALL_PRODUCT_IDS],
        productType: PURCHASE_TYPE.SUBS,
      });

      if (!products || products.length === 0) {
        console.warn('PurchaseService: No products returned from store');
        return this.getWebProducts();
      }

      return products.map((p: any) => ({
        productId: p.productIdentifier || p.id,
        title: p.title || p.localizedTitle || '',
        description: p.description || p.localizedDescription || '',
        price: p.priceString || p.localizedPrice || `₺${this.getFallbackPrice(p.productIdentifier || p.id)}`,
        priceAmount: p.price || this.getFallbackPrice(p.productIdentifier || p.id),
        currency: p.currencyCode || 'TRY',
        planType: this.getPlanTypeFromProductId(p.productIdentifier || p.id),
        period: (p.productIdentifier || p.id || '').includes('yearly') ? 'yearly' : 'monthly',
      }));
    } catch (error) {
      console.error('PurchaseService: getProducts failed', error);
      return this.getWebProducts();
    }
  }

  /**
   * Start a real native subscription purchase
   */
  async purchaseSubscription(productId: string): Promise<PurchaseResult> {
    if (!this.isNative) {
      return { success: false, error: 'Satın alma için mobil uygulama gerekli.' };
    }

    if (!this.initialized) {
      await this.initialize();
      if (!this.initialized) {
        return { success: false, error: 'Faturalandırma servisi kullanılamıyor.' };
      }
    }

    try {
      // Open native Google Play purchase sheet
      const transaction = await NativePurchases.purchaseProduct({
        productIdentifier: productId,
        productType: PURCHASE_TYPE.SUBS,
      });

      const purchaseToken = transaction?.purchaseToken || transaction?.transactionId;
      const orderId = transaction?.orderId;

      if (!purchaseToken) {
        return { success: false, error: 'Satın alma token\'ı alınamadı.' };
      }

      // Verify with backend
      return await this.verifyPurchase(purchaseToken, productId, orderId);
    } catch (error: any) {
      // User cancelled
      if (error?.code === 'USER_CANCELLED' || error?.message?.includes('cancel')) {
        return { success: false, error: 'Satın alma iptal edildi.' };
      }
      console.error('PurchaseService: purchase failed', error);
      return {
        success: false,
        error: error?.message || 'Satın alma başarısız oldu.',
      };
    }
  }

  /**
   * Verify purchase token with backend edge function
   */
  async verifyPurchase(
    purchaseToken: string,
    productId: string,
    orderId?: string
  ): Promise<PurchaseResult> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-purchase', {
        body: { purchaseToken, productId, orderId, platform: 'android' },
      });

      if (error) {
        return { success: false, error: error.message || 'Doğrulama başarısız.' };
      }

      return {
        success: data?.success ?? false,
        subscription: data?.subscription,
        error: data?.error,
      };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Doğrulama başarısız.' };
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<PurchaseResult> {
    if (!this.isNative) {
      return { success: false, error: 'Geri yükleme için mobil uygulama gerekli.' };
    }

    try {
      // restorePurchases triggers re-verification on the store side
      await NativePurchases.restorePurchases();

      // After restore, get current purchases
      const { purchases: transactions } = await NativePurchases.getPurchases({
        productType: PURCHASE_TYPE.SUBS,
      });

      if (!transactions || transactions.length === 0) {
        return { success: false, error: 'Geri yüklenecek satın alma bulunamadı.' };
      }

      // Verify the most recent valid transaction
      const latest = transactions[transactions.length - 1];
      const token = latest?.purchaseToken || latest?.transactionId;
      const productId = latest?.productIdentifier || '';

      if (token) {
        return await this.verifyPurchase(token, productId);
      }

      return { success: false, error: 'Geçerli satın alma bulunamadı.' };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Geri yükleme başarısız.' };
    }
  }

  // ─── Helpers ────────────────────────────────────────

  getPlanNameFromProductId(productId: string): string {
    if (productId.includes('premium_pro')) return 'Premium Pro';
    if (productId.includes('premium_plus')) return 'Premium Plus';
    if (productId.includes('premium_basic')) return 'Premium Basic';
    return 'Premium';
  }

  private getPlanTypeFromProductId(productId: string): PlanType {
    if (productId.includes('premium_pro')) return 'premium_pro';
    if (productId.includes('premium_plus')) return 'premium_plus';
    if (productId.includes('premium_basic')) return 'premium_basic';
    return 'free';
  }

  private getFallbackPrice(productId: string): number {
    const isYearly = productId.includes('yearly');
    if (productId.includes('premium_pro')) return isYearly ? PLAN_PRICES.premium_pro.yearly : PLAN_PRICES.premium_pro.monthly;
    if (productId.includes('premium_plus')) return isYearly ? PLAN_PRICES.premium_plus.yearly : PLAN_PRICES.premium_plus.monthly;
    if (productId.includes('premium_basic')) return isYearly ? PLAN_PRICES.premium_basic.yearly : PLAN_PRICES.premium_basic.monthly;
    return 0;
  }

  private getWebProducts(): ProductInfo[] {
    return [
      { productId: PRODUCTS.PREMIUM_BASIC_MONTHLY, title: 'Premium Basic Aylık', description: 'Sınırsız analiz + 3 AI mesajı/gün', price: `₺${PLAN_PRICES.premium_basic.monthly}/ay`, priceAmount: PLAN_PRICES.premium_basic.monthly, currency: 'TRY', planType: 'premium_basic', period: 'monthly' },
      { productId: PRODUCTS.PREMIUM_BASIC_YEARLY, title: 'Premium Basic Yıllık', description: 'Sınırsız analiz + 3 AI mesajı/gün', price: `₺${PLAN_PRICES.premium_basic.yearly}/yıl`, priceAmount: PLAN_PRICES.premium_basic.yearly, currency: 'TRY', planType: 'premium_basic', period: 'yearly' },
      { productId: PRODUCTS.PREMIUM_PLUS_MONTHLY, title: 'Premium Plus Aylık', description: 'Sınırsız analiz + 5 AI mesajı/gün', price: `₺${PLAN_PRICES.premium_plus.monthly}/ay`, priceAmount: PLAN_PRICES.premium_plus.monthly, currency: 'TRY', planType: 'premium_plus', period: 'monthly' },
      { productId: PRODUCTS.PREMIUM_PLUS_YEARLY, title: 'Premium Plus Yıllık', description: 'Sınırsız analiz + 5 AI mesajı/gün', price: `₺${PLAN_PRICES.premium_plus.yearly}/yıl`, priceAmount: PLAN_PRICES.premium_plus.yearly, currency: 'TRY', planType: 'premium_plus', period: 'yearly' },
      { productId: PRODUCTS.PREMIUM_PRO_MONTHLY, title: 'Premium Pro Aylık', description: 'Sınırsız analiz + 10 AI mesajı/gün', price: `₺${PLAN_PRICES.premium_pro.monthly}/ay`, priceAmount: PLAN_PRICES.premium_pro.monthly, currency: 'TRY', planType: 'premium_pro', period: 'monthly' },
      { productId: PRODUCTS.PREMIUM_PRO_YEARLY, title: 'Premium Pro Yıllık', description: 'Sınırsız analiz + 10 AI mesajı/gün', price: `₺${PLAN_PRICES.premium_pro.yearly}/yıl`, priceAmount: PLAN_PRICES.premium_pro.yearly, currency: 'TRY', planType: 'premium_pro', period: 'yearly' },
    ];
  }

  isNativePlatform(): boolean { return this.isNative; }
  getPlatform(): 'android' | 'ios' | 'web' { return Capacitor.getPlatform() as any; }
}

export const purchaseService = new PurchaseService();
