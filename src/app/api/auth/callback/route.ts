import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // Get the next param, which tells us where to redirect after exchanging the code
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createServerSupabase()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Successful code exchange — redirect to the specified 'next' path
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Return the user to an error page with some instructions
    return NextResponse.redirect(`${origin}/login?error=Invalid or expired recovery link`)
}
