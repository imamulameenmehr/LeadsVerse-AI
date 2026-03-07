import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createServerSupabase()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        return NextResponse.json({
            ...profile,
            email: user.email // Merge auth email for display
        })
    } catch (err) {
        console.error('Profile fetch error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { full_name, city, phone } = await req.json()

        const supabase = await createServerSupabase()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { error } = await supabase
            .from('profiles')
            .update({ full_name, city, phone })
            .eq('id', user.id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Profile update error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
