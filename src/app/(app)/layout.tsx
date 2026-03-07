import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { Toaster } from 'react-hot-toast'

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) redirect('/login')

    return (
        <div className="flex h-screen overflow-hidden text-[13px] bg-black text-white">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Navbar userName={profile.full_name} userRole={profile.role} />
                <div className="flex flex-1 overflow-hidden">
                    <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
                        <ErrorBoundary>
                            {children}
                        </ErrorBoundary>
                    </main>
                </div>
            </div>
            <Toaster
                position="bottom-right"
                toastOptions={{
                    style: {
                        background: '#181818',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '13px',
                        borderRadius: '16px',
                    },
                    success: {
                        iconTheme: {
                            primary: '#d9ff54',
                            secondary: '#000',
                        },
                    },
                }}
            />
        </div>
    )
}
