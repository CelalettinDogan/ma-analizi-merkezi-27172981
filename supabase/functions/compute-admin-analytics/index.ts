import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const today = new Date().toISOString().split('T')[0]
    const yesterday24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // 1. Total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // 2. Premium users + plan breakdown
    const { data: premiumData } = await supabase
      .from('premium_subscriptions')
      .select('plan_type, user_id')
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())

    const premiumUsers = premiumData?.length || 0
    const premiumByPlan: Record<string, number> = {}
    premiumData?.forEach(sub => {
      premiumByPlan[sub.plan_type] = (premiumByPlan[sub.plan_type] || 0) + 1
    })

    // Revenue calculation
    const PLAN_PRICES: Record<string, number> = {
      premium_basic: 49,
      premium_plus: 79,
      premium_pro: 99,
    }
    let premiumRevenue = 0
    Object.entries(premiumByPlan).forEach(([plan, count]) => {
      premiumRevenue += count * (PLAN_PRICES[plan] || 0)
    })

    // 3. Today's chat usage
    const { data: chatData } = await supabase
      .from('chatbot_usage')
      .select('usage_count')
      .eq('usage_date', today)

    const todayChats = chatData?.reduce((sum: number, r: any) => sum + r.usage_count, 0) || 0

    // 4. Today's analysis usage
    const { data: analysisData } = await supabase
      .from('analysis_usage')
      .select('usage_count')
      .eq('usage_date', today)

    const todayAnalysis = analysisData?.reduce((sum: number, r: any) => sum + r.usage_count, 0) || 0

    // 5. AI accuracy
    const { data: mlStats } = await supabase
      .from('ml_model_stats')
      .select('accuracy_percentage')
      .order('last_updated', { ascending: false })
      .limit(1)
      .single()

    const aiAccuracy = mlStats?.accuracy_percentage || 0

    // 6. Live matches
    const { count: liveMatches } = await supabase
      .from('cached_live_matches')
      .select('*', { count: 'exact', head: true })

    // 7. Active users 24h
    const { data: activeData } = await supabase
      .from('chatbot_usage')
      .select('user_id')
      .gte('last_used_at', yesterday24h)

    const activeUsers24h = new Set(activeData?.map((r: any) => r.user_id)).size

    // 8. Prediction stats by type
    const { data: predStatsData } = await supabase
      .from('prediction_stats')
      .select('*')

    const predictionStats = (predStatsData || []).map((row: any) => ({
      type: row.prediction_type || 'Unknown',
      total: row.total_predictions || 0,
      correct: row.correct_predictions || 0,
      accuracy: row.accuracy_percentage || 0,
    }))

    // 9. League stats
    const { data: leagueData } = await supabase
      .from('predictions')
      .select('league, is_correct')
      .eq('is_primary', true)
      .not('is_correct', 'is', null)

    const leagueGrouped: Record<string, { total: number; correct: number }> = {}
    leagueData?.forEach((row: any) => {
      if (!leagueGrouped[row.league]) leagueGrouped[row.league] = { total: 0, correct: 0 }
      leagueGrouped[row.league].total++
      if (row.is_correct) leagueGrouped[row.league].correct++
    })

    const leagueStats = Object.entries(leagueGrouped)
      .map(([league, { total, correct }]) => ({
        league,
        total,
        correct,
        accuracy: total > 0 ? (correct / total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)

    // Premium rate
    const total = totalUsers || 0
    const premiumRate = total > 0 ? (premiumUsers / total) * 100 : 0

    // Upsert into admin_daily_analytics
    const { error } = await supabase
      .from('admin_daily_analytics')
      .upsert({
        report_date: today,
        total_users: total,
        premium_users: premiumUsers,
        premium_rate: premiumRate,
        today_chats: todayChats,
        today_analysis: todayAnalysis,
        ai_accuracy: aiAccuracy,
        live_matches: liveMatches || 0,
        active_users_24h: activeUsers24h,
        premium_by_plan: premiumByPlan,
        premium_revenue: premiumRevenue,
        prediction_stats: predictionStats,
        league_stats: leagueStats,
        created_at: new Date().toISOString(),
      }, { onConflict: 'report_date' })

    if (error) {
      console.error('Upsert error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      success: true,
      report_date: today,
      total_users: total,
      premium_users: premiumUsers,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Compute analytics error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
