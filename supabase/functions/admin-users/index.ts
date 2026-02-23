import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
    const search = url.searchParams.get('search') || ''

    // Fetch auth users with pagination using admin API
    const { data: authData, error: listError } = await supabase.auth.admin.listUsers({
      page,
      perPage: pageSize,
    })

    if (listError) {
      console.error('List users error:', listError)
      return new Response(JSON.stringify({ error: 'Failed to list users' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const allUsers = authData.users || []
    const totalCount = (authData as any).total || allUsers.length

    // If search, filter by email/display_name
    let filteredUsers = allUsers
    if (search) {
      const q = search.toLowerCase()
      filteredUsers = allUsers.filter(u => 
        u.email?.toLowerCase().includes(q) ||
        (u.user_metadata?.display_name || '').toLowerCase().includes(q)
      )
    }

    const userIds = filteredUsers.map(u => u.id)
    const today = new Date().toISOString().split('T')[0]

    // Fetch related data in parallel
    const [profilesRes, rolesRes, premiumRes, chatRes, analysisRes] = await Promise.all([
      supabase.from('profiles').select('user_id, display_name, is_banned, ban_reason').in('user_id', userIds),
      supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
      supabase.from('premium_subscriptions').select('user_id, plan_type, is_active, expires_at').in('user_id', userIds).eq('is_active', true),
      supabase.from('chatbot_usage').select('user_id, usage_count').in('user_id', userIds).eq('usage_date', today),
      supabase.from('analysis_usage').select('user_id, usage_count').in('user_id', userIds).eq('usage_date', today),
    ])

    const profiles = profilesRes.data || []
    const roles = rolesRes.data || []
    const premiums = premiumRes.data || []
    const chats = chatRes.data || []
    const analyses = analysisRes.data || []

    const users = filteredUsers.map(authUser => {
      const profile = profiles.find(p => p.user_id === authUser.id)
      const userRoles = roles.filter(r => r.user_id === authUser.id).map(r => r.role)
      const premium = premiums.find(p => p.user_id === authUser.id && new Date(p.expires_at) > new Date())
      const chat = chats.find(c => c.user_id === authUser.id)
      const analysis = analyses.find(a => a.user_id === authUser.id)

      return {
        id: authUser.id,
        email: authUser.email || '',
        displayName: profile?.display_name || authUser.user_metadata?.display_name || '',
        createdAt: authUser.created_at,
        lastSignIn: authUser.last_sign_in_at || null,
        isPremium: !!premium,
        planType: premium?.plan_type || null,
        roles: userRoles,
        chatUsageToday: chat?.usage_count || 0,
        analysisUsageToday: analysis?.usage_count || 0,
        isBanned: profile?.is_banned || false,
      }
    })

    return new Response(JSON.stringify({ users, totalCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    console.error('Admin users error:', e)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
