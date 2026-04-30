import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { encode as base64url } from "https://deno.land/std@0.224.0/encoding/base64url.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --- FCM HTTP v1 Auth via Service Account JWT ---

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function createJWT(
  serviceAccount: { client_email: string; private_key: string; project_id: string }
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  const encodedHeader = base64url(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64url(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await importPrivateKey(serviceAccount.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput)
  );

  const encodedSignature = base64url(new Uint8Array(signature));
  return `${signingInput}.${encodedSignature}`;
}

async function getAccessToken(
  serviceAccount: { client_email: string; private_key: string; project_id: string }
): Promise<string> {
  const jwt = await createJWT(serviceAccount);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OAuth token exchange failed: ${response.status} ${errBody}`);
  }

  const data = await response.json();
  return data.access_token;
}

// --- Main Handler ---

interface NotificationPayload {
  title: string;
  body: string;
  target_audience?: "all" | "premium" | "free";
  data?: Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const fcmServiceAccountJson = Deno.env.get("FCM_SERVICE_ACCOUNT_KEY");

    if (!fcmServiceAccountJson) {
      return new Response(
        JSON.stringify({ error: "FCM_SERVICE_ACCOUNT_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let serviceAccount: { client_email: string; private_key: string; project_id: string };
    try {
      serviceAccount = JSON.parse(fcmServiceAccountJson);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid FCM_SERVICE_ACCOUNT_KEY JSON" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auth check - must be admin
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const anonClient = createClient(supabaseUrl, anonKey);
      const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        return new Response(
          JSON.stringify({ error: "Admin access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const payload: NotificationPayload = await req.json();

    if (!payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: "title and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get target tokens
    let query = supabase.from("push_tokens").select("token, user_id");

    if (payload.target_audience === "premium") {
      const { data: premiumUsers } = await supabase
        .from("premium_subscriptions")
        .select("user_id")
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString());

      const premiumIds = premiumUsers?.map((u) => u.user_id) || [];
      if (premiumIds.length > 0) {
        query = query.in("user_id", premiumIds);
      } else {
        return new Response(
          JSON.stringify({ sent: 0, message: "No premium users with tokens" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (payload.target_audience === "free") {
      const { data: premiumUsers } = await supabase
        .from("premium_subscriptions")
        .select("user_id")
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString());

      const premiumIds = premiumUsers?.map((u) => u.user_id) || [];
      if (premiumIds.length > 0) {
        query = query.not("user_id", "in", `(${premiumIds.join(",")})`);
      }
    }

    const { data: tokens, error: tokensError } = await query;

    if (tokensError || !tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No tokens found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get OAuth2 access token for FCM v1
    const accessToken = await getAccessToken(serviceAccount);
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;

    // Send individually (FCM v1 doesn't support batch registration_ids)
    let sentCount = 0;
    const invalidTokens: string[] = [];

    // Process in parallel batches of 50
    const batchSize = 50;
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map(async (t) => {
          const fcmResponse = await fetch(fcmUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              message: {
                token: t.token,
                notification: {
                  title: payload.title,
                  body: payload.body,
                },
                android: {
                  priority: "high",
                  notification: {
                    icon: "ic_launcher",
                    sound: "default",
                    channel_id: "golmetrik_default",
                  },
                },
                data: payload.data || {},
              },
            }),
          });

          if (fcmResponse.ok) {
            await fcmResponse.json(); // consume body
            return { success: true, token: t.token };
          }

          const errBody = await fcmResponse.json();
          const errCode = errBody?.error?.details?.[0]?.errorCode || errBody?.error?.code;

          // Mark invalid tokens for cleanup
          if (
            errCode === "UNREGISTERED" ||
            errCode === "INVALID_ARGUMENT" ||
            fcmResponse.status === 404
          ) {
            invalidTokens.push(t.token);
          }

          return { success: false, token: t.token, error: errCode };
        })
      );

      sentCount += results.filter(
        (r) => r.status === "fulfilled" && r.value.success
      ).length;
    }

    // Clean up invalid tokens
    if (invalidTokens.length > 0) {
      await supabase.from("push_tokens").delete().in("token", invalidTokens);
      console.log(`Cleaned ${invalidTokens.length} invalid tokens`);
    }

    // Log the notification
    await supabase.from("push_notifications").insert({
      title: payload.title,
      body: payload.body,
      target_audience: payload.target_audience || "all",
      data: payload.data || {},
      sent_at: new Date().toISOString(),
      delivered_count: sentCount,
    });

    const summary = {
      sent: sentCount,
      total: tokens.length,
      invalid_cleaned: invalidTokens.length,
    };

    console.log("Push notification result:", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Send notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
