import { createClient } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        // Verify caller is admin
        const supabase = await createServerSupabase()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Use service role to fetch all users (includes emails from auth.users)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // Get profiles
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, role, created_at')
            .order('created_at', { ascending: false })

        // Get emails from auth.users
        const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers({
            perPage: 1000,
        })

        // Merge email into profile data
        const emailMap = new Map(authUsers.map(u => [u.id, u.email]))
        const team = (profiles || []).map(p => ({
            ...p,
            email: emailMap.get(p.id) ?? null,
        }))

        return NextResponse.json(team)
    } catch (err) {
        console.error('Team fetch error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
