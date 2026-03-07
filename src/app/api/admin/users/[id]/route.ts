import { createClient } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: userId } = await params
        const { role } = await req.json()

        if (!role || !['admin', 'closer', 'extractor'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
        }

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

        // Prevent admin from downgrading themselves
        if (userId === user.id && role !== 'admin') {
            return NextResponse.json({ error: 'Cannot downgrade yourself' }, { status: 400 })
        }

        // Use service role to update the profile
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ role })
            .eq('id', userId)

        if (updateError) throw updateError

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Update role error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: userId } = await params

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

        // Prevent admin from deleting themselves
        if (userId === user.id) {
            return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
        }

        // Use service role to detach records and delete the user
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // Detach leads
        await supabaseAdmin.from('leads').update({ assigned_to: null }).eq('assigned_to', userId)

        // Detach activities
        // If user_id cannot be null in your DB, this might fail, but it's the safest non-destructive path.
        await supabaseAdmin.from('activities').update({ user_id: null }).eq('user_id', userId)

        // Delete from auth.users
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (authError) throw authError

        // Delete from profiles just in case cascade is not set up
        await supabaseAdmin.from('profiles').delete().eq('id', userId)

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Delete user error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
