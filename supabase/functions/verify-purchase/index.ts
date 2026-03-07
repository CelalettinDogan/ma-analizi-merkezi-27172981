import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurchaseVerificationRequest {
  purchaseToken: string;
  productId: string;
  orderId?: string;
  platform: "android" | "ios";
}

// Subscriptions v2 API response types
interface SubscriptionV2Response {
  kind: string;
  regionCode: string;
  startTime: string;
  subscriptionState: string; // e.g. "SUBSCRIPTION_STATE_ACTIVE"
  latestOrderId: string;
  acknowledgementState: string; // "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED" or "ACKNOWLEDGEMENT_STATE_PENDING"
  lineItems: Array<{
    productId: string;
    expiryTime: string;
    autoRenewingPlan?: {
      autoRenewEnabled: boolean;
    };
    offerDetails?: {
      basePlanId: string;
      offerId?: string;
    };
  }>;
  linkedPurchaseToken?: string;
}

// Get Google Play access token using service account
async function getGoogleAccessToken(serviceAccountKey: string): Promise<string> {
  const serviceAccount = JSON.parse(serviceAccountKey);
  
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;
  
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: expiry,
  };
  
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const encodedClaims = btoa(JSON.stringify(claims)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const signatureInput = `${encodedHeader}.${encodedClaims}`;
  
  const privateKeyPem = serviceAccount.private_key;
  const pemContents = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");
  
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );
  
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  
  const jwt = `${signatureInput}.${encodedSignature}`;
  
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  
  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error("Token exchange failed:", error);
    throw new Error("GOOGLE_AUTH_FAILED");
  }
  
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Verify subscription with Google Play Subscriptions v2 API
async function verifyGooglePlaySubscription(
  packageName: string,
  purchaseToken: string,
  accessToken: string
): Promise<SubscriptionV2Response> {
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptionsv2/tokens/${purchaseToken}`;
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error("Google Play verification failed:", response.status, error);
    
    if (response.status === 401 || response.status === 403) {
      throw new Error("PERMISSION_DENIED");
    }
    if (response.status === 404) {
      throw new Error("PURCHASE_NOT_FOUND");
    }
    throw new Error(`VERIFICATION_FAILED_${response.status}`);
  }
  
  return response.json();
}

// Acknowledge the subscription (v1 acknowledge endpoint still works for v2 purchases)
async function acknowledgeSubscription(
  packageName: string,
  productId: string,
  purchaseToken: string,
  accessToken: string
): Promise<void> {
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}:acknowledge`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error("Acknowledge failed:", response.status, error);
    // Non-fatal — log but don't throw
  }
}

/**
 * Product ID'den plan tipini çıkar
 */
function getPlanType(productId: string): string {
  const lower = productId.toLowerCase();
  if (lower.includes('premium_pro')) return 'premium_pro';
  if (lower.includes('premium_plus')) return 'premium_plus';
  if (lower.includes('premium_basic')) return 'premium_basic';
  if (lower.includes('pro') || lower.includes('ultra')) return 'premium_pro';
  if (lower.includes('plus')) return 'premium_plus';
  return 'premium_basic';
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Yetkilendirme gerekli", code: "AUTH_REQUIRED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Geçersiz oturum", code: "INVALID_AUTH" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const body: PurchaseVerificationRequest = await req.json();
    const { purchaseToken, productId, orderId, platform } = body;
    
    console.log("Verifying purchase:", { userId: user.id, productId, platform, orderId });
    
    if (!purchaseToken || !productId || !platform) {
      return new Response(
        JSON.stringify({ error: "Eksik bilgi", code: "MISSING_FIELDS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const serviceAccountKey = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_KEY");
    const packageName = Deno.env.get("GOOGLE_PLAY_PACKAGE_NAME");
    
    if (!serviceAccountKey || !packageName) {
      return new Response(
        JSON.stringify({ error: "Sunucu yapılandırma hatası", code: "CONFIG_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get access token
    const accessToken = await getGoogleAccessToken(serviceAccountKey);
    
    // Verify with Subscriptions v2 API
    console.log("Verifying with Google Play v2 API...");
    const subscription = await verifyGooglePlaySubscription(packageName, purchaseToken, accessToken);
    
    console.log("Google Play v2 response:", JSON.stringify({
      state: subscription.subscriptionState,
      orderId: subscription.latestOrderId,
      lineItems: subscription.lineItems?.length,
      ackState: subscription.acknowledgementState,
    }));
    
    // Extract data from v2 response
    const lineItem = subscription.lineItems?.[0];
    if (!lineItem) {
      return new Response(
        JSON.stringify({ error: "Abonelik bilgisi bulunamadı", code: "NO_LINE_ITEMS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const expiryTime = new Date(lineItem.expiryTime);
    const startTime = new Date(subscription.startTime);
    const isActive = subscription.subscriptionState === "SUBSCRIPTION_STATE_ACTIVE" 
                  || subscription.subscriptionState === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD";
    const autoRenewing = lineItem.autoRenewingPlan?.autoRenewEnabled ?? false;
    const resolvedProductId = lineItem.productId || productId;
    
    if (expiryTime < new Date() && !isActive) {
      return new Response(
        JSON.stringify({ error: "Abonelik süresi dolmuş", code: "EXPIRED", valid: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Acknowledge if pending
    if (subscription.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING") {
      console.log("Acknowledging subscription...");
      await acknowledgeSubscription(packageName, resolvedProductId, purchaseToken, accessToken);
    }
    
    const planType = getPlanType(resolvedProductId);
    console.log("Resolved plan type:", { resolvedProductId, planType });
    
    // Deactivate any existing active subscriptions for this user
    const { error: deactivateError } = await supabaseAdmin
      .from("premium_subscriptions")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .eq("is_active", true);
    
    if (deactivateError) {
      console.warn("Failed to deactivate old subscriptions:", deactivateError);
    }
    
    // Upsert subscription
    const { data: subscriptionData, error: upsertError } = await supabaseAdmin
      .from("premium_subscriptions")
      .upsert(
        {
          user_id: user.id,
          plan_type: planType,
          platform: platform,
          purchase_token: purchaseToken,
          order_id: subscription.latestOrderId || orderId,
          product_id: resolvedProductId,
          starts_at: startTime.toISOString(),
          expires_at: expiryTime.toISOString(),
          is_active: true,
          auto_renewing: autoRenewing,
          purchase_state: 0,
          acknowledged: true,
        },
        { onConflict: "order_id", ignoreDuplicates: false }
      )
      .select()
      .single();
    
    if (upsertError) {
      console.error("Database error:", upsertError);
      
      // Fallback: try insert without onConflict (order_id might not exist yet)
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from("premium_subscriptions")
        .insert({
          user_id: user.id,
          plan_type: planType,
          platform: platform,
          purchase_token: purchaseToken,
          order_id: subscription.latestOrderId || orderId,
          product_id: resolvedProductId,
          starts_at: startTime.toISOString(),
          expires_at: expiryTime.toISOString(),
          is_active: true,
          auto_renewing: autoRenewing,
          purchase_state: 0,
          acknowledged: true,
        })
        .select()
        .single();
      
      if (insertError) {
        console.error("Insert fallback also failed:", insertError);
        return new Response(
          JSON.stringify({ error: "Abonelik kaydedilemedi", code: "DB_ERROR" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log("Subscription saved via fallback insert:", insertData?.id);
      return new Response(
        JSON.stringify({
          success: true,
          valid: true,
          subscription: {
            id: insertData.id,
            planType,
            expiresAt: expiryTime.toISOString(),
            autoRenewing,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Subscription saved:", subscriptionData.id);
    
    return new Response(
      JSON.stringify({
        success: true,
        valid: true,
        subscription: {
          id: subscriptionData.id,
          planType,
          expiresAt: expiryTime.toISOString(),
          autoRenewing,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Verification error:", error);
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    
    // Map error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      GOOGLE_AUTH_FAILED: "Google Play bağlantı hatası. Lütfen tekrar deneyin.",
      PERMISSION_DENIED: "Sunucu izin hatası. Lütfen destek ile iletişime geçin.",
      PURCHASE_NOT_FOUND: "Satın alma bulunamadı. Lütfen tekrar deneyin.",
    };
    
    const userMessage = errorMessages[message] || "Doğrulama başarısız oldu. Lütfen tekrar deneyin.";
    
    return new Response(
      JSON.stringify({ error: userMessage, code: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
