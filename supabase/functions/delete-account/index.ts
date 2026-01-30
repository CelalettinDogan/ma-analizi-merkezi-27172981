import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Yetkilendirme gerekli" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // User client for auth verification
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user from token
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      console.error("User verification failed:", userError);
      return new Response(
        JSON.stringify({ error: "Geçersiz oturum" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Deleting account for user: ${user.id}`);

    // Admin client for data deletion
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Delete user data from all tables (GDPR compliant)
    // First get prediction IDs for cascade delete
    const { data: userPredictions } = await supabaseAdmin
      .from('predictions')
      .select('id')
      .eq('user_id', user.id);
    
    const predictionIds = userPredictions?.map(p => p.id) || [];

    // Delete prediction features first (foreign key constraint)
    if (predictionIds.length > 0) {
      await supabaseAdmin
        .from('prediction_features')
        .delete()
        .in('prediction_id', predictionIds);
    }

    const deletionResults = await Promise.allSettled([
      // Delete predictions
      supabaseAdmin.from('predictions').delete().eq('user_id', user.id),
      // Delete chat history
      supabaseAdmin.from('chat_history').delete().eq('user_id', user.id),
      // Delete chatbot usage
      supabaseAdmin.from('chatbot_usage').delete().eq('user_id', user.id),
      // Delete analysis usage
      supabaseAdmin.from('analysis_usage').delete().eq('user_id', user.id),
      // Delete favorites
      supabaseAdmin.from('user_favorites').delete().eq('user_id', user.id),
      // Delete premium subscriptions
      supabaseAdmin.from('premium_subscriptions').delete().eq('user_id', user.id),
      // Delete profiles
      supabaseAdmin.from('profiles').delete().eq('user_id', user.id),
      // Delete user roles
      supabaseAdmin.from('user_roles').delete().eq('user_id', user.id),
      // Delete bet slips
      supabaseAdmin.from('bet_slips').delete().eq('user_id', user.id),
    ]);

    // Log any deletion errors
    deletionResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Deletion ${index} failed:`, result.reason);
      }
    });

    // Finally, delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Hesap silinemedi: " + deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully deleted account for user: ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Hesabınız ve tüm verileriniz başarıyla silindi" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Delete account error:", error);
    return new Response(
      JSON.stringify({ error: "Beklenmeyen bir hata oluştu" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
