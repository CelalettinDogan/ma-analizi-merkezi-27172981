-- Add Google Play Store fields to premium_subscriptions table
ALTER TABLE public.premium_subscriptions 
ADD COLUMN IF NOT EXISTS platform text DEFAULT 'web' CHECK (platform IN ('web', 'android', 'ios'));

ALTER TABLE public.premium_subscriptions 
ADD COLUMN IF NOT EXISTS purchase_token text;

ALTER TABLE public.premium_subscriptions 
ADD COLUMN IF NOT EXISTS order_id text;

ALTER TABLE public.premium_subscriptions 
ADD COLUMN IF NOT EXISTS product_id text;

ALTER TABLE public.premium_subscriptions 
ADD COLUMN IF NOT EXISTS auto_renewing boolean DEFAULT false;

ALTER TABLE public.premium_subscriptions 
ADD COLUMN IF NOT EXISTS purchase_state integer DEFAULT 0;

ALTER TABLE public.premium_subscriptions 
ADD COLUMN IF NOT EXISTS acknowledged boolean DEFAULT false;

-- Create unique index on order_id for Google Play purchases (only when not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_premium_subscriptions_order_id 
ON public.premium_subscriptions (order_id) 
WHERE order_id IS NOT NULL;

-- Create index for faster lookups by purchase_token
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_purchase_token 
ON public.premium_subscriptions (purchase_token) 
WHERE purchase_token IS NOT NULL;

-- Create index for platform-based queries
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_platform 
ON public.premium_subscriptions (platform);

-- Add comment for documentation
COMMENT ON COLUMN public.premium_subscriptions.platform IS 'Purchase platform: web, android, or ios';
COMMENT ON COLUMN public.premium_subscriptions.purchase_token IS 'Google Play purchase token for verification';
COMMENT ON COLUMN public.premium_subscriptions.order_id IS 'Google Play order ID (unique per transaction)';
COMMENT ON COLUMN public.premium_subscriptions.product_id IS 'Store product ID (e.g., premium_monthly)';
COMMENT ON COLUMN public.premium_subscriptions.auto_renewing IS 'Whether subscription auto-renews';
COMMENT ON COLUMN public.premium_subscriptions.purchase_state IS '0=Purchased, 1=Canceled, 2=Pending';
COMMENT ON COLUMN public.premium_subscriptions.acknowledged IS 'Whether purchase was acknowledged to Google';