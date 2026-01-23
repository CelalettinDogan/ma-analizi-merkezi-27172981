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

// Notification types for subscriptions
const NOTIFICATION_TYPES = {
  1: "SUBSCRIPTION_RECOVERED", // Subscription recovered from account hold
  2: "SUBSCRIPTION_RENEWED", // Active subscription renewed
  3: "SUBSCRIPTION_CANCELED", // Subscription canceled (voluntary or involuntary)
  4: "SUBSCRIPTION_PURCHASED", // New subscription purchased
  5: "SUBSCRIPTION_ON_HOLD", // Subscription entered account hold
  6: "SUBSCRIPTION_IN_GRACE_PERIOD", // Subscription entered grace period
  7: "SUBSCRIPTION_RESTARTED", // User restarted subscription
  8: "SUBSCRIPTION_PRICE_CHANGE_CONFIRMED", // User confirmed price change
  9: "SUBSCRIPTION_DEFERRED", // Subscription deferred
  10: "SUBSCRIPTION_PAUSED", // Subscription paused
  11: "SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED", // Pause schedule changed
  12: "SUBSCRIPTION_REVOKED", // Subscription revoked
  13: "SUBSCRIPTION_EXPIRED", // Subscription expired
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

// Get subscription details from Google Play
async function getSubscriptionDetails(
  packageName: string,
  subscriptionId: string,
  purchaseToken: string,
  accessToken: string
) {
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${subscriptionId}/tokens/${purchaseToken}`;
  
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
    
    // Parse the notification (comes as base64 encoded message from Pub/Sub)
    const body = await req.json();
    console.log("Received webhook:", JSON.stringify(body));
    
    // Google Pub/Sub wraps the message
    let notification: GooglePlayNotification;
    if (body.message?.data) {
      const decoded = atob(body.message.data);
      notification = JSON.parse(decoded);
    } else {
      notification = body;
    }
    
    console.log("Parsed notification:", JSON.stringify(notification));
    
    // Handle test notification
    if (notification.testNotification) {
      console.log("Test notification received");
      return new Response(JSON.stringify({ success: true, type: "test" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Handle subscription notification
    if (notification.subscriptionNotification) {
      const { notificationType, purchaseToken, subscriptionId } = notification.subscriptionNotification;
      const notificationName = NOTIFICATION_TYPES[notificationType as keyof typeof NOTIFICATION_TYPES] || "UNKNOWN";
      
      console.log(`Processing ${notificationName} for subscription ${subscriptionId}`);
      
      // Get full subscription details from Google Play
      const accessToken = await getGoogleAccessToken(serviceAccountKey);
      const subscriptionDetails = await getSubscriptionDetails(
        packageName,
        subscriptionId,
        purchaseToken,
        accessToken
      );
      
      console.log("Subscription details:", JSON.stringify(subscriptionDetails));
      
      // Find existing subscription by purchase_token
      const { data: existingSub, error: findError } = await supabase
        .from("premium_subscriptions")
        .select("*")
        .eq("purchase_token", purchaseToken)
        .single();
      
      if (findError && findError.code !== "PGRST116") {
        console.error("Error finding subscription:", findError);
      }
      
      const expiryTime = new Date(parseInt(subscriptionDetails.expiryTimeMillis));
      const now = new Date();
      
      // Determine new status based on notification type
      let isActive = true;
      let purchaseState = 0;
      
      switch (notificationType) {
        case 3: // CANCELED
        case 12: // REVOKED
        case 13: // EXPIRED
          isActive = expiryTime > now; // Still active until expiry
          purchaseState = 1;
          break;
        case 5: // ON_HOLD
        case 10: // PAUSED
          isActive = false;
          purchaseState = 2;
          break;
        case 1: // RECOVERED
        case 2: // RENEWED
        case 4: // PURCHASED
        case 7: // RESTARTED
          isActive = true;
          purchaseState = 0;
          break;
      }
      
      if (existingSub) {
        // Update existing subscription
        const { error: updateError } = await supabase
          .from("premium_subscriptions")
          .update({
            expires_at: expiryTime.toISOString(),
            is_active: isActive,
            auto_renewing: subscriptionDetails.autoRenewing,
            purchase_state: purchaseState,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSub.id);
        
        if (updateError) {
          console.error("Error updating subscription:", updateError);
        } else {
          console.log(`Updated subscription ${existingSub.id}: ${notificationName}`);
        }
      } else {
        console.log("Subscription not found for token, may need manual resolution");
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          type: notificationName,
          subscriptionId,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Unhandled notification type
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
