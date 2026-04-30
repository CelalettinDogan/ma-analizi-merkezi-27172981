import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  title: string;
  body: string;
  target_audience?: 'all' | 'premium' | 'free';
  data?: Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');

    if (!fcmServerKey) {
      return new Response(
        JSON.stringify({ error: 'FCM_SERVER_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Auth check - must be admin
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
      const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const payload: NotificationPayload = await req.json();

    if (!payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get target tokens
    let query = supabase.from('push_tokens').select('token, user_id');

    if (payload.target_audience === 'premium') {
      const { data: premiumUsers } = await supabase
        .from('premium_subscriptions')
        .select('user_id')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      const premiumIds = premiumUsers?.map(u => u.user_id) || [];
      if (premiumIds.length > 0) {
        query = query.in('user_id', premiumIds);
      } else {
        return new Response(
          JSON.stringify({ sent: 0, message: 'No premium users with tokens' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (payload.target_audience === 'free') {
      const { data: premiumUsers } = await supabase
        .from('premium_subscriptions')
        .select('user_id')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      const premiumIds = premiumUsers?.map(u => u.user_id) || [];
      if (premiumIds.length > 0) {
        query = query.not('user_id', 'in', `(${premiumIds.join(',')})`);
      }
    }

    const { data: tokens, error: tokensError } = await query;

    if (tokensError || !tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: 'No tokens found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send via FCM legacy API (batch)
    let sentCount = 0;
    const batchSize = 500;

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      const registrationIds = batch.map(t => t.token);

      const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${fcmServerKey}`,
        },
        body: JSON.stringify({
          registration_ids: registrationIds,
          notification: {
            title: payload.title,
            body: payload.body,
            icon: 'ic_launcher',
            sound: 'default',
          },
          data: payload.data || {},
        }),
      });

      if (fcmResponse.ok) {
        const result = await fcmResponse.json();
        sentCount += result.success || 0;

        // Clean up invalid tokens
        if (result.results) {
          const invalidIndices: number[] = [];
          result.results.forEach((r: any, idx: number) => {
            if (r.error === 'NotRegistered' || r.error === 'InvalidRegistration') {
              invalidIndices.push(idx);
            }
          });

          if (invalidIndices.length > 0) {
            const invalidTokens = invalidIndices.map(idx => registrationIds[idx]);
            await supabase
              .from('push_tokens')
              .delete()
              .in('token', invalidTokens);
          }
        }
      }
    }

    // Log the notification
    await supabase.from('push_notifications').insert({
      title: payload.title,
      body: payload.body,
      target_audience: payload.target_audience || 'all',
      data: payload.data || {},
      sent_at: new Date().toISOString(),
      delivered_count: sentCount,
    });

    return new Response(
      JSON.stringify({ sent: sentCount, total: tokens.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Send notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
