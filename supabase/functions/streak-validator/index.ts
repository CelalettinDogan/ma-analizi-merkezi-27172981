import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Use UTC date for consistency across timezones
    const now = new Date();
    const todayUTC = now.toISOString().split("T")[0];

    // Yesterday in UTC
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayUTC = yesterday.toISOString().split("T")[0];

    // Two days ago (for freeze window)
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);
    const twoDaysAgoUTC = twoDaysAgo.toISOString().split("T")[0];

    // 1. Reset streaks where last_activity_date is older than freeze window (>2 days ago)
    // These users missed more than 1 day AND didn't have freeze protection
    const { data: brokenStreaks, error: resetError } = await supabase
      .from("user_streaks")
      .update({
        current_streak: 0,
        streak_freeze_used: false,
        updated_at: now.toISOString(),
      })
      .lt("last_activity_date", twoDaysAgoUTC)
      .gt("current_streak", 0)
      .select("user_id");

    if (resetError) {
      console.error("Error resetting broken streaks:", resetError);
    }

    // 2. For users who missed exactly 1 day (last_activity = 2 days ago)
    //    and already used their freeze → reset them too
    const { data: freezeExpired, error: freezeError } = await supabase
      .from("user_streaks")
      .update({
        current_streak: 0,
        streak_freeze_used: false,
        updated_at: now.toISOString(),
      })
      .eq("last_activity_date", twoDaysAgoUTC)
      .eq("streak_freeze_used", true)
      .gt("current_streak", 0)
      .select("user_id");

    if (freezeError) {
      console.error("Error resetting freeze-expired streaks:", freezeError);
    }

    // 3. Expire old unused streak rewards (>7 days old)
    const { error: rewardError } = await supabase
      .from("streak_rewards")
      .update({ used: true, used_at: now.toISOString() })
      .eq("used", false)
      .lt("expires_at", now.toISOString());

    if (rewardError) {
      console.error("Error expiring rewards:", rewardError);
    }

    const brokenCount = brokenStreaks?.length ?? 0;
    const freezeExpiredCount = freezeExpired?.length ?? 0;

    const summary = {
      success: true,
      timestamp: now.toISOString(),
      today_utc: todayUTC,
      streaks_reset: brokenCount,
      freeze_expired_reset: freezeExpiredCount,
    };

    console.log("Streak validation complete:", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Streak validator error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
