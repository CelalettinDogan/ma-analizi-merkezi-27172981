import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

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
}

// Product IDs - these should match your Play Store/App Store products
export const PRODUCTS = {
  PREMIUM_MONTHLY: 'premium_monthly',
  PREMIUM_YEARLY: 'premium_yearly',
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
   * Get available products
   */
  async getProducts(): Promise<ProductInfo[]> {
    if (!this.isNative) {
      // Return web pricing info
      return [
        {
          productId: PRODUCTS.PREMIUM_MONTHLY,
          title: 'Premium Aylık',
          description: 'Tüm premium özelliklere erişim',
          price: '₺99/ay',
          priceAmount: 99,
          currency: 'TRY',
        },
        {
          productId: PRODUCTS.PREMIUM_YEARLY,
          title: 'Premium Yıllık',
          description: 'Tüm premium özellikler - 2 ay bedava',
          price: '₺799/yıl',
          priceAmount: 799,
          currency: 'TRY',
        },
      ];
    }

    // For native, query products from the store
    // This requires native plugin implementation
    return [];
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
        error: 'Web purchases are handled separately',
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
        error: 'Native purchase plugin not installed. Install @capawesome/capacitor-purchases',
      };
    } catch (error) {
      console.error('Purchase error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
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
          error: error.message || 'Verification failed',
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
        error: error instanceof Error ? error.message : 'Verification failed',
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
        error: 'Restore not available on web',
      };
    }

    try {
      // Native restore flow
      // This requires native plugin implementation
      console.log('Restoring purchases...');
      
      return {
        success: false,
        error: 'Native restore not implemented',
      };
    } catch (error) {
      console.error('Restore error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Restore failed',
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
