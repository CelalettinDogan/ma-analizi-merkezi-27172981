import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GooglePlayNotification {
  version: string;
  packageName: string;
  eventTimeMillis: string;
  subscriptionNotification?: {
    version: string;
    notificationType: number;
    purchaseToken: string;
    subscriptionId: string;
  };
  oneTimeProductNotification?: {
    version: string;
    notificationType: number;
    purchaseToken: string;
    sku: string;
  };
  testNotification?: {
    version: string;
  };
}

const NOTIFICATION_TYPES: Record<number, string> = {
  1: "SUBSCRIPTION_RECOVERED",
  2: "SUBSCRIPTION_RENEWED",
  3: "SUBSCRIPTION_CANCELED",
  4: "SUBSCRIPTION_PURCHASED",
  5: "SUBSCRIPTION_ON_HOLD",
  6: "SUBSCRIPTION_IN_GRACE_PERIOD",
  7: "SUBSCRIPTION_RESTARTED",
  8: "SUBSCRIPTION_PRICE_CHANGE_CONFIRMED",
  9: "SUBSCRIPTION_DEFERRED",
  10: "SUBSCRIPTION_PAUSED",
  11: "SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED",
  12: "SUBSCRIPTION_REVOKED",
  13: "SUBSCRIPTION_EXPIRED",
};

// Get Google Play access token
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
    throw new Error("Failed to get Google access token");
  }
  
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Get subscription details via Subscriptions v2 API
async function getSubscriptionDetailsV2(
  packageName: string,
  purchaseToken: string,
  accessToken: string
) {
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptionsv2/tokens/${purchaseToken}`;
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get subscription details: ${response.status}`);
  }
  
  return response.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceAccountKey = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_KEY");
    const packageName = Deno.env.get("GOOGLE_PLAY_PACKAGE_NAME");
    
    if (!serviceAccountKey || !packageName) {
      console.error("Missing Google Play configuration");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await req.json();
    console.log("Received webhook:", JSON.stringify(body));
    
    let notification: GooglePlayNotification;
    if (body.message?.data) {
      const decoded = atob(body.message.data);
      notification = JSON.parse(decoded);
    } else {
      notification = body;
    }
    
    console.log("Parsed notification:", JSON.stringify(notification));
    
    if (notification.testNotification) {
      console.log("Test notification received");
      return new Response(JSON.stringify({ success: true, type: "test" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (notification.subscriptionNotification) {
      const { notificationType, purchaseToken } = notification.subscriptionNotification;
      const notificationName = NOTIFICATION_TYPES[notificationType] || "UNKNOWN";
      
      console.log(`Processing ${notificationName}`);
      
      // Get full subscription details via v2 API
      const accessToken = await getGoogleAccessToken(serviceAccountKey);
      const subDetails = await getSubscriptionDetailsV2(packageName, purchaseToken, accessToken);
      
      console.log("Subscription v2 details:", JSON.stringify(subDetails));
      
      // Extract data from v2 response
      const lineItem = subDetails.lineItems?.[0];
      const expiryTime = lineItem?.expiryTime ? new Date(lineItem.expiryTime) : new Date();
      const autoRenewing = lineItem?.autoRenewingPlan?.autoRenewEnabled ?? false;
      const now = new Date();
      
      // Determine status from subscriptionState
      const state = subDetails.subscriptionState || "";
      let isActive = true;
      let purchaseState = 0;
      
      switch (state) {
        case "SUBSCRIPTION_STATE_CANCELED":
          isActive = expiryTime > now; // still active until expiry
          purchaseState = 1;
          break;
        case "SUBSCRIPTION_STATE_EXPIRED":
          isActive = false;
          purchaseState = 1;
          break;
        case "SUBSCRIPTION_STATE_ON_HOLD":
        case "SUBSCRIPTION_STATE_PAUSED":
          isActive = false;
          purchaseState = 2;
          break;
        case "SUBSCRIPTION_STATE_ACTIVE":
        case "SUBSCRIPTION_STATE_IN_GRACE_PERIOD":
        case "SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED":
        default:
          isActive = expiryTime > now;
          purchaseState = 0;
          break;
      }
      
      // Find existing subscription by purchase_token
      const { data: existingSub, error: findError } = await supabase
        .from("premium_subscriptions")
        .select("*")
        .eq("purchase_token", purchaseToken)
        .single();
      
      if (findError && findError.code !== "PGRST116") {
        console.error("Error finding subscription:", findError);
      }
      
      if (existingSub) {
        const { error: updateError } = await supabase
          .from("premium_subscriptions")
          .update({
            expires_at: expiryTime.toISOString(),
            is_active: isActive,
            auto_renewing: autoRenewing,
            purchase_state: purchaseState,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSub.id);
        
        if (updateError) {
          console.error("Error updating subscription:", updateError);
        } else {
          console.log(`Updated subscription ${existingSub.id}: ${notificationName}, active=${isActive}`);
        }
      } else {
        // Fallback: try finding by linkedPurchaseToken or product_id
        console.log("Subscription not found for token, trying fallback lookup...");
        
        let fallbackSub = null;
        
        // Try linkedPurchaseToken if available
        if (subDetails.linkedPurchaseToken) {
          const { data: linkedSub } = await supabase
            .from("premium_subscriptions")
            .select("*")
            .eq("purchase_token", subDetails.linkedPurchaseToken)
            .maybeSingle();
          fallbackSub = linkedSub;
        }
        
        // Try finding by product_id + most recent active subscription
        if (!fallbackSub && lineItem?.productId) {
          const { data: productSub } = await supabase
            .from("premium_subscriptions")
            .select("*")
            .eq("product_id", lineItem.productId)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          fallbackSub = productSub;
        }
        
        if (fallbackSub) {
          const { error: fallbackUpdateError } = await supabase
            .from("premium_subscriptions")
            .update({
              purchase_token: purchaseToken, // Update to new token
              expires_at: expiryTime.toISOString(),
              is_active: isActive,
              auto_renewing: autoRenewing,
              purchase_state: purchaseState,
              updated_at: new Date().toISOString(),
            })
            .eq("id", fallbackSub.id);
          
          if (fallbackUpdateError) {
            console.error("Fallback update error:", fallbackUpdateError);
          } else {
            console.log(`Updated subscription ${fallbackSub.id} via fallback lookup: ${notificationName}, active=${isActive}`);
          }
        } else {
          console.warn("No subscription found via any lookup method for token:", purchaseToken);
        }
      }
      
      return new Response(
        JSON.stringify({ success: true, type: notificationName }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Unhandled notification type");
    return new Response(
      JSON.stringify({ success: true, type: "unhandled" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Webhook processing failed";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
