'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

const PAGE_TITLES: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/leads': 'Leads',
    '/pipeline': 'Pipelines',
    '/analytics': 'Analytics',
    '/settings': 'Settings',
}

interface NavbarProps {
    userName: string
    userRole: string
}

export default function Navbar({ userName, userRole }: NavbarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [searchQuery, setSearchQuery] = useState('')

    const title = Object.entries(PAGE_TITLES).find(
        ([key]) => pathname === key || pathname.startsWith(key + '/')
    )?.[1] ?? 'Dashboard'

    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U'

    // Logout mapped to clicking the profile area
    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <header className="h-[64px] border-b border-[var(--border-color)] flex items-center justify-between px-8 bg-black shrink-0">
            <div className="flex items-center gap-4">
                <div className="flex items-center text-zinc-500 gap-2">
                    <span className="text-xs uppercase tracking-widest font-medium">Pages</span>
                    <span className="text-zinc-700">/</span>
                    <span className="text-white font-medium">{title}</span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px]">search</span>
                    <input
                        className="bg-[#111] border border-white/5 rounded-full pl-10 pr-4 py-1.5 text-xs w-64 focus:outline-none focus:ring-1 focus:ring-[#d9ff54]/50 transition-all text-white placeholder:text-zinc-500"
                        placeholder="Global Search..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && searchQuery.trim()) {
                                router.push(`/leads?search=${encodeURIComponent(searchQuery.trim())}`)
                            }
                        }}
                    />
                </div>
                <button
                    onClick={() => router.push('/leads/new')}
                    className="bg-white text-black font-bold px-4 py-1.5 rounded-md text-xs hover:bg-zinc-200 transition-colors"
                >
                    + NEW LEAD
                </button>
                <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                    <Link
                        href="/profile"
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                        title="Edit Profile"
                    >
                        <div className="text-right">
                            <p className="text-[11px] font-bold text-white leading-none uppercase">{userName}</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">{userRole}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#d9ff54] to-white p-[1px]">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white">{initials}</span>
                            </div>
                        </div>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="p-2 border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 transition-all"
                        title="Logout"
                    >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                    </button>
                </div>
            </div>
        </header>
    )
}
