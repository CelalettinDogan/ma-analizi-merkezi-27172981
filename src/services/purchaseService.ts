import { Capacitor } from '@capacitor/core';
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

// Product IDs - Play Store'da oluşturulacak ürünlerle eşleşmeli
export const PRODUCTS = {
  // Basic Plan
  PREMIUM_BASIC_MONTHLY: 'premium_basic_monthly',
  PREMIUM_BASIC_YEARLY: 'premium_basic_yearly',
  // Plus Plan
  PREMIUM_PLUS_MONTHLY: 'premium_plus_monthly',
  PREMIUM_PLUS_YEARLY: 'premium_plus_yearly',
  // Pro Plan
  PREMIUM_PRO_MONTHLY: 'premium_pro_monthly',
  PREMIUM_PRO_YEARLY: 'premium_pro_yearly',
} as const;

// Plan bilgileri - merkezi yönetim
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

class PurchaseService {
  private isNative: boolean;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  /**
   * Initialize the purchase service
   * Call this when the app starts
   */
  async initialize(): Promise<void> {
    if (!this.isNative) {
      console.log('PurchaseService: Running on web, native purchases not available');
      return;
    }

    // For native, you would initialize the billing library here
    // This requires @capawesome/capacitor-purchases or similar plugin
    console.log('PurchaseService: Initializing native purchases');
  }

  /**
   * Get available products with plan-specific info
   */
  async getProducts(): Promise<ProductInfo[]> {
    if (!this.isNative) {
      // Return web pricing info (for display purposes only)
      return this.getWebProducts();
    }

    // For native, query products from the store
    // This requires native plugin implementation
    // Fallback to web products for now
    return this.getWebProducts();
  }

  /**
   * Get products with prices from accessLevels
   */
  private getWebProducts(): ProductInfo[] {
    return [
      // Basic Plan
      {
        productId: PRODUCTS.PREMIUM_BASIC_MONTHLY,
        title: 'Premium Basic Aylık',
        description: 'Sınırsız analiz + 3 AI mesajı/gün',
        price: `₺${PLAN_PRICES.premium_basic.monthly}/ay`,
        priceAmount: PLAN_PRICES.premium_basic.monthly,
        currency: 'TRY',
        planType: 'premium_basic',
        period: 'monthly',
      },
      {
        productId: PRODUCTS.PREMIUM_BASIC_YEARLY,
        title: 'Premium Basic Yıllık',
        description: 'Sınırsız analiz + 3 AI mesajı/gün (2 ay bedava)',
        price: `₺${PLAN_PRICES.premium_basic.yearly}/yıl`,
        priceAmount: PLAN_PRICES.premium_basic.yearly,
        currency: 'TRY',
        planType: 'premium_basic',
        period: 'yearly',
      },
      // Plus Plan
      {
        productId: PRODUCTS.PREMIUM_PLUS_MONTHLY,
        title: 'Premium Plus Aylık',
        description: 'Sınırsız analiz + 5 AI mesajı/gün',
        price: `₺${PLAN_PRICES.premium_plus.monthly}/ay`,
        priceAmount: PLAN_PRICES.premium_plus.monthly,
        currency: 'TRY',
        planType: 'premium_plus',
        period: 'monthly',
      },
      {
        productId: PRODUCTS.PREMIUM_PLUS_YEARLY,
        title: 'Premium Plus Yıllık',
        description: 'Sınırsız analiz + 5 AI mesajı/gün (2 ay bedava)',
        price: `₺${PLAN_PRICES.premium_plus.yearly}/yıl`,
        priceAmount: PLAN_PRICES.premium_plus.yearly,
        currency: 'TRY',
        planType: 'premium_plus',
        period: 'yearly',
      },
      // Pro Plan
      {
        productId: PRODUCTS.PREMIUM_PRO_MONTHLY,
        title: 'Premium Pro Aylık',
        description: 'Sınırsız analiz + 10 AI mesajı/gün',
        price: `₺${PLAN_PRICES.premium_pro.monthly}/ay`,
        priceAmount: PLAN_PRICES.premium_pro.monthly,
        currency: 'TRY',
        planType: 'premium_pro',
        period: 'monthly',
      },
      {
        productId: PRODUCTS.PREMIUM_PRO_YEARLY,
        title: 'Premium Pro Yıllık',
        description: 'Sınırsız analiz + 10 AI mesajı/gün (2 ay bedava)',
        price: `₺${PLAN_PRICES.premium_pro.yearly}/yıl`,
        priceAmount: PLAN_PRICES.premium_pro.yearly,
        currency: 'TRY',
        planType: 'premium_pro',
        period: 'yearly',
      },
    ];
  }

  /**
   * Get plan name from product ID
   */
  getPlanNameFromProductId(productId: string): string {
    if (productId.includes('premium_pro')) return 'Premium Pro';
    if (productId.includes('premium_plus')) return 'Premium Plus';
    if (productId.includes('premium_basic')) return 'Premium Basic';
    return 'Premium';
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(productId: string): Promise<PurchaseResult> {
    if (!this.isNative) {
      // Web purchases should redirect to a payment page
      console.log('Web purchase requested for:', productId);
      return {
        success: false,
        error: 'Web üzerinden satın alma desteklenmiyor. Mobil uygulamayı kullanın.',
      };
    }

    try {
      // Native purchase flow
      // This requires @capawesome/capacitor-purchases or similar
      console.log('Starting native purchase for:', productId);

      // Placeholder for native purchase implementation
      // const result = await NativePurchases.purchase({ productId });
      
      // After successful native purchase, verify with backend
      // const verifyResult = await this.verifyPurchase(
      //   result.purchaseToken,
      //   productId,
      //   result.orderId
      // );
      
      return {
        success: false,
        error: 'Native satın alma eklentisi kurulu değil. @capawesome/capacitor-purchases kurun.',
      };
    } catch (error) {
      console.error('Purchase error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Satın alma başarısız',
      };
    }
  }

  /**
   * Verify a purchase with the backend
   */
  async verifyPurchase(
    purchaseToken: string,
    productId: string,
    orderId?: string
  ): Promise<PurchaseResult> {
    try {
      const platform = Capacitor.getPlatform();
      
      const { data, error } = await supabase.functions.invoke('verify-purchase', {
        body: {
          purchaseToken,
          productId,
          orderId,
          platform: platform === 'android' ? 'android' : 'ios',
        },
      });

      if (error) {
        console.error('Verification error:', error);
        return {
          success: false,
          error: error.message || 'Doğrulama başarısız',
        };
      }

      return {
        success: data.success,
        subscription: data.subscription,
        error: data.error,
      };
    } catch (error) {
      console.error('Verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Doğrulama başarısız',
      };
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<PurchaseResult> {
    if (!this.isNative) {
      return {
        success: false,
        error: 'Web üzerinden geri yükleme yapılamaz',
      };
    }

    try {
      // Native restore flow
      // This requires native plugin implementation
      console.log('Restoring purchases...');
      
      return {
        success: false,
        error: 'Native geri yükleme henüz uygulanmadı',
      };
    } catch (error) {
      console.error('Restore error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Geri yükleme başarısız',
      };
    }
  }

  /**
   * Check if running on native platform
   */
  isNativePlatform(): boolean {
    return this.isNative;
  }

  /**
   * Get current platform
   */
  getPlatform(): 'android' | 'ios' | 'web' {
    return Capacitor.getPlatform() as 'android' | 'ios' | 'web';
  }
}

export const purchaseService = new PurchaseService();
