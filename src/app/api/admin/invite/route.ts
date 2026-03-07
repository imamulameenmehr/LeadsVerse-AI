import { createClient } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { email, full_name, role } = await req.json()

        if (!email || !full_name || !role) {
            return NextResponse.json({ error: 'email, full_name and role are required' }, { status: 400 })
        }

        // Verify the calling user is admin
        const supabase = await createServerSupabase()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
        }

        // Use service role key for admin operations
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

        const { data: inviteData, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${siteUrl}/login`,
            data: { full_name, role }
        })

        if (error) {
            console.error('Supabase invite error:', {
                message: error.message,
                status: (error as any).status,
                name: error.name,
            })
            // Provide a friendlier message for common errors
            let msg = error.message
            if (msg?.toLowerCase().includes('already been invited') || msg?.toLowerCase().includes('already registered')) {
                msg = 'This email has already been invited or registered. Ask the user to check their inbox or log in.'
            }
            return NextResponse.json({ error: msg }, { status: 400 })
        }

        console.log('Invite sent to:', email, 'user id:', inviteData?.user?.id)
        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Invite error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
