'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const NAV_ITEMS = [
    { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { href: '/leads', icon: 'group', label: 'Leads' },
    { href: '/pipeline', icon: 'view_kanban', label: 'Pipeline' },
    { href: '/analytics', icon: 'bar_chart', label: 'Analytics' },
]

export default function Sidebar() {
    const pathname = usePathname()
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <aside className={cn(
            "bg-black border-r border-[var(--border-color)] flex flex-col py-6 shrink-0 z-20 transition-all duration-300 ease-in-out",
            isExpanded ? "w-[240px] px-4" : "w-[72px] items-center px-0"
        )}>
            <div className={cn("mb-10 flex", isExpanded ? "px-2" : "justify-center")}>
                <div className="w-10 h-10 bg-white/5 rounded-xl flex shrink-0 items-center justify-center border border-white/10">
                    <span className="material-symbols-outlined text-white text-[24px]">all_inclusive</span>
                </div>
                {isExpanded && (
                    <div className="ml-3 flex items-center overflow-hidden whitespace-nowrap">
                        <span className="text-white font-bold tracking-tight text-lg">Leadsverse AI</span>
                    </div>
                )}
            </div>

            <nav className="flex flex-col gap-4 flex-1 overflow-x-hidden">
                {NAV_ITEMS.map(({ href, icon, label }) => {
                    const isActive = pathname === href || pathname.startsWith(href + '/')

                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "relative flex items-center group rounded-lg h-12 transition-all duration-300",
                                isExpanded ? (isActive ? "bg-[#d9ff54]/10 border border-[#d9ff54]/20 px-3" : "px-3 hover:bg-white/5") : "justify-center"
                            )}
                            title={!isExpanded ? label : undefined}
                        >
                            {!isExpanded && isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#d9ff54] rounded-r-md shadow-[0_0_10px_#d9ff54]"></div>}
                            <span className={cn(
                                "material-symbols-outlined shrink-0 transition-all duration-300",
                                isActive ? "text-[#d9ff54] drop-shadow-[0_0_8px_rgba(217,255,84,0.6)]" : "text-zinc-500 group-hover:text-white"
                            )}>
                                {icon}
                            </span>
                            {isExpanded && (
                                <span className={cn(
                                    "ml-3 font-medium truncate transition-all duration-300",
                                    isActive ? "text-[#d9ff54]" : "text-zinc-400 group-hover:text-white"
                                )}>
                                    {label}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            <div className="mt-auto flex flex-col gap-2 overflow-x-hidden pt-4 border-t border-white/5">
                <Link
                    href="/settings"
                    className={cn(
                        "flex items-center group rounded-lg h-12 transition-colors",
                        isExpanded ? "px-3 hover:bg-white/5" : "justify-center"
                    )}
                    title={!isExpanded ? "Settings" : undefined}
                >
                    <span className="material-symbols-outlined shrink-0 text-zinc-500 group-hover:text-white transition-colors">settings</span>
                    {isExpanded && (
                        <span className="ml-3 font-medium text-zinc-400 group-hover:text-white truncate transition-colors">
                            Settings
                        </span>
                    )}
                </Link>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                        "flex items-center group rounded-lg h-12 transition-colors",
                        isExpanded ? "px-3 hover:bg-white/5" : "justify-center hover:bg-white/5"
                    )}
                    aria-label={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
                    title={!isExpanded ? "Expand Sidebar" : undefined}
                >
                    <span className="material-symbols-outlined shrink-0 text-zinc-500 group-hover:text-white transition-colors">
                        {isExpanded ? 'keyboard_double_arrow_left' : 'keyboard_double_arrow_right'}
                    </span>
                    {isExpanded && (
                        <span className="ml-3 font-medium text-zinc-400 group-hover:text-white truncate transition-colors">
                            Collapse
                        </span>
                    )}
                </button>
            </div>
        </aside>
    )
}
