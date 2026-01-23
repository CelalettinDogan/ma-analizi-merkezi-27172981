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

interface GooglePlaySubscription {
  kind: string;
  startTimeMillis: string;
  expiryTimeMillis: string;
  autoRenewing: boolean;
  priceCurrencyCode: string;
  priceAmountMicros: string;
  countryCode: string;
  developerPayload: string;
  paymentState: number;
  cancelReason?: number;
  userCancellationTimeMillis?: string;
  orderId: string;
  acknowledgementState: number;
}

// Get Google Play access token using service account
async function getGoogleAccessToken(serviceAccountKey: string): Promise<string> {
  const serviceAccount = JSON.parse(serviceAccountKey);
  
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;
  
  // Create JWT header
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  
  // Create JWT claims
  const claims = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: expiry,
  };
  
  // Encode header and claims
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const encodedClaims = btoa(JSON.stringify(claims)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  
  const signatureInput = `${encodedHeader}.${encodedClaims}`;
  
  // Import private key and sign
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
  
  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  
  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error("Token exchange failed:", error);
    throw new Error("Failed to get Google access token");
  }
  
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Verify subscription with Google Play
async function verifyGooglePlaySubscription(
  packageName: string,
  productId: string,
  purchaseToken: string,
  accessToken: string
): Promise<GooglePlaySubscription> {
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error("Google Play verification failed:", error);
    throw new Error(`Google Play verification failed: ${response.status}`);
  }
  
  return response.json();
}

// Acknowledge the subscription purchase
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
    console.error("Acknowledge failed:", error);
    throw new Error(`Failed to acknowledge subscription: ${response.status}`);
  }
}

// Map product ID to plan type
function getPlanType(productId: string): string {
  const planMap: Record<string, string> = {
    premium_monthly: "monthly",
    premium_yearly: "yearly",
    premium_weekly: "weekly",
  };
  return planMap[productId] || "monthly";
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Client with user's auth for getting user ID
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    // Admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user ID
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Parse request body
    const body: PurchaseVerificationRequest = await req.json();
    const { purchaseToken, productId, orderId, platform } = body;
    
    console.log("Verifying purchase:", { userId: user.id, productId, platform, orderId });
    
    if (!purchaseToken || !productId || !platform) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: purchaseToken, productId, platform" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get Google Play credentials
    const serviceAccountKey = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_KEY");
    const packageName = Deno.env.get("GOOGLE_PLAY_PACKAGE_NAME");
    
    if (!serviceAccountKey || !packageName) {
      console.error("Missing Google Play configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get access token
    console.log("Getting Google access token...");
    const accessToken = await getGoogleAccessToken(serviceAccountKey);
    
    // Verify subscription with Google Play
    console.log("Verifying with Google Play...");
    const subscription = await verifyGooglePlaySubscription(
      packageName,
      productId,
      purchaseToken,
      accessToken
    );
    
    console.log("Google Play response:", {
      orderId: subscription.orderId,
      expiryTime: new Date(parseInt(subscription.expiryTimeMillis)).toISOString(),
      autoRenewing: subscription.autoRenewing,
      acknowledgementState: subscription.acknowledgementState,
    });
    
    // Check if subscription is valid
    const expiryTime = new Date(parseInt(subscription.expiryTimeMillis));
    if (expiryTime < new Date()) {
      return new Response(
        JSON.stringify({ error: "Subscription has expired", valid: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Acknowledge if not already acknowledged
    if (subscription.acknowledgementState === 0) {
      console.log("Acknowledging subscription...");
      await acknowledgeSubscription(packageName, productId, purchaseToken, accessToken);
    }
    
    // Calculate subscription period
    const startTime = new Date(parseInt(subscription.startTimeMillis));
    const planType = getPlanType(productId);
    
    // Upsert subscription record
    const { data: subscriptionData, error: upsertError } = await supabaseAdmin
      .from("premium_subscriptions")
      .upsert(
        {
          user_id: user.id,
          plan_type: planType,
          platform: platform,
          purchase_token: purchaseToken,
          order_id: subscription.orderId,
          product_id: productId,
          starts_at: startTime.toISOString(),
          expires_at: expiryTime.toISOString(),
          is_active: true,
          auto_renewing: subscription.autoRenewing,
          purchase_state: subscription.paymentState,
          acknowledged: true,
        },
        {
          onConflict: "order_id",
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();
    
    if (upsertError) {
      console.error("Database error:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to save subscription" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Subscription saved successfully:", subscriptionData.id);
    
    return new Response(
      JSON.stringify({
        success: true,
        valid: true,
        subscription: {
          id: subscriptionData.id,
          planType: planType,
          expiresAt: expiryTime.toISOString(),
          autoRenewing: subscription.autoRenewing,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Verification error:", error);
    const errorMessage = error instanceof Error ? error.message : "Verification failed";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
