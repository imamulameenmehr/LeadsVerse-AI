'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { Users, MoreHorizontal, Search, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { STAGE_ORDER } from '@/constants/stages'
import { StageBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

interface Lead {
    id: string
    business_name: string
    owner_name: string | null
    city: string | null
    stage: any
    lead_score: number | null
    last_activity_at: string | null
    next_follow_up_at: string | null
    assigned_to: string
    profiles: { full_name: string } | null
}

interface Profile {
    id: string
    full_name: string
}

function LeadsPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { profile: currentUser, loading: userLoading } = useCurrentUser()

    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [closers, setClosers] = useState<Profile[]>([])
    const [totalLeads, setTotalLeads] = useState(0)

    // Filters
    const searchQueryParam = searchParams.get('search') || ''
    const [search, setSearch] = useState(searchQueryParam)
    const [debouncedSearch, setDebouncedSearch] = useState(searchQueryParam)
    const [stageFilter, setStageFilter] = useState('all')
    const [closerFilter, setCloserFilter] = useState('all')

    // Pagination
    const [page, setPage] = useState(0)
    const PAGE_SIZE = 25

    // Sync URL search params to local state if they change
    useEffect(() => {
        const query = searchParams.get('search')
        if (query !== null) {
            setSearch(query)
            setDebouncedSearch(query)
        }
    }, [searchParams])

    // Debounce search input by 300ms
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300)
        return () => clearTimeout(timer)
    }, [search])

    // Handle Dropdown close on outside click
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
    useEffect(() => {
        const handleClickOutside = () => setOpenDropdownId(null)
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    // Refetch when filters change — reset to page 0
    useEffect(() => {
        setPage(0)
    }, [debouncedSearch, stageFilter, closerFilter])

    // Fetch admin dropdown data
    useEffect(() => {
        supabase.from('profiles').select('id, full_name').eq('role', 'closer')
            .then(({ data }) => setClosers(data || []))
    }, [currentUser])

    // Fetch Leads
    useEffect(() => {
        if (userLoading || !currentUser) return

        const fetchLeads = async () => {
            setLoading(true)

            let query = supabase
                .from('leads')
                .select(`
          id, business_name, owner_name, city, stage,
          lead_score, last_activity_at, next_follow_up_at, assigned_to,
          profiles!assigned_to ( full_name )
        `, { count: 'exact' })

            if (debouncedSearch) {
                query = query.ilike('business_name', `%${debouncedSearch}%`)
            }
            if (stageFilter !== 'all') {
                query = query.eq('stage', stageFilter)
            }
            if (closerFilter !== 'all') {
                query = query.eq('assigned_to', closerFilter)
            }

            // Pagination
            query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

            // Order by urgent follow ups first (nulls last)
            query = query.order('next_follow_up_at', { ascending: true, nullsFirst: false })

            const { data, count } = await query
            setLeads(data as unknown as Lead[] || [])
            setTotalLeads(count ?? 0)
            setLoading(false)
        }

        fetchLeads()
    }, [debouncedSearch, stageFilter, closerFilter, page, currentUser, userLoading])

    const handleDeleteLead = async (id: string, businessName: string) => {
        if (!confirm(`Are you sure you want to delete the lead "${businessName}"? This action cannot be undone.`)) return

        // Optimistic UI update
        setLeads(prev => prev.filter(l => l.id !== id))
        setTotalLeads(prev => prev - 1)

        const { error } = await supabase.from('leads').delete().eq('id', id)

        if (error) {
            console.error('Error deleting lead:', error)
            alert('Failed to delete lead. Please try again.')
            // Ideally we'd rollback the optimistic update here, but a refresh handles it for now
        }
    }

    const isOverdue = (dateStr: string | null) => {
        if (!dateStr) return false
        return new Date(dateStr) < new Date()
    }

    const timeAgo = (d: string | null) => d ? formatDistanceToNow(new Date(d), { addSuffix: true }) : '—'
    const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col pt-2 pb-8">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white uppercase mb-1">Leads Management</h1>
                    <p className="text-[#888888] text-sm">Managing {totalLeads} potential opportunities</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-[#1c1c1c] p-1 rounded-2xl border border-white/5">
                        <button className="px-6 py-2.5 rounded-xl bg-black text-white text-sm font-medium shadow-sm">All Leads</button>
                        <button className="px-6 py-2.5 rounded-xl text-[#888888] hover:text-white text-sm font-medium transition-colors">My Leads</button>
                    </div>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6 shrink-0 justify-between items-center w-full">
                <div className="flex items-center gap-3 flex-wrap flex-1">
                    {/* Search */}
                    <div className="flex items-center gap-2 bg-[#111113] border border-white/10 rounded-lg px-3 py-1.5 flex-1 min-w-[200px] max-w-[300px]">
                        <Search size={13} className="text-slate-500 shrink-0" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by business name..."
                            className="bg-transparent text-sm text-white outline-none placeholder:text-slate-600 w-full"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-slate-500 hover:text-white">
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* Stage filter */}
                    <div className="relative min-w-[160px]">
                        <select
                            value={stageFilter}
                            onChange={e => setStageFilter(e.target.value)}
                            className="w-full bg-[#111113] border border-white/10 text-slate-300 rounded-lg px-3 py-1.5 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 appearance-none"
                        >
                            <option value="all">All Stages</option>
                            {STAGE_ORDER.map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-[18px] pointer-events-none">expand_more</span>
                    </div>

                    {/* Closer filter — Available to everyone now */}
                    <div className="relative min-w-[160px]">
                        <select
                            value={closerFilter}
                            onChange={e => setCloserFilter(e.target.value)}
                            className="w-full bg-[#111113] border border-white/10 text-slate-300 rounded-lg px-3 py-1.5 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 appearance-none"
                        >
                            <option value="all">All Closers</option>
                            {closers.map(c => (
                                <option key={c.id} value={c.id}>{c.full_name}</option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-[18px] pointer-events-none">expand_more</span>
                    </div>

                    {/* Active filter count badge */}
                    {(stageFilter !== 'all' || closerFilter !== 'all' || search) && (
                        <button
                            onClick={() => { setSearch(''); setStageFilter('all'); setCloserFilter('all') }}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                            <X size={12} /> Clear filters
                        </button>
                    )}
                </div>

                <button
                    onClick={() => router.push('/leads/new')}
                    className="bg-white hover:bg-slate-200 text-black font-bold rounded-xl px-6 py-2.5 text-sm transition-all flex items-center justify-center gap-2 flex-shrink-0 shadow-sm"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    ADD LEAD
                </button>
            </div>

            {/* Leads Table Card */}
            <div className="flex-1 bg-[#1c1c1c] rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col shadow-2xl relative min-h-[400px]">

                {loading ? (
                    <div className="p-8 space-y-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex gap-4 items-center">
                                {['w-36', 'w-24', 'w-20', 'w-28', 'w-24', 'w-10', 'w-24', 'w-8'].map((w, j) => (
                                    <div key={j} className="flex-1"><Skeleton className={`h-8 ${w}`} /></div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : leads.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="No leads found"
                        description="Add your first lead to get started"
                        action={
                            <button
                                onClick={() => router.push('/leads/new')}
                                className="bg-white hover:bg-slate-200 text-black font-bold uppercase tracking-widest text-xs px-6 py-2 rounded-xl mt-2 transition-colors"
                            >
                                Add Lead
                            </button>
                        }
                    />
                ) : (
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="border-b border-white/10 sticky top-0 bg-[#1c1c1c] z-10">
                                    <th className="px-8 py-6 text-[11px] font-bold text-[#888888] uppercase tracking-[0.1em]">Business Name</th>
                                    <th className="px-8 py-6 text-[11px] font-bold text-[#888888] uppercase tracking-[0.1em]">Owner</th>
                                    <th className="px-8 py-6 text-[11px] font-bold text-[#888888] uppercase tracking-[0.1em]">City</th>
                                    <th className="px-8 py-6 text-[11px] font-bold text-[#888888] uppercase tracking-[0.1em]">Stage</th>
                                    <th className="px-8 py-6 text-[11px] font-bold text-[#888888] uppercase tracking-[0.1em]">Assigned To</th>
                                    <th className="px-8 py-6 text-[11px] font-bold text-[#888888] uppercase tracking-[0.1em] text-center">Score</th>
                                    <th className="px-8 py-6 text-[11px] font-bold text-[#888888] uppercase tracking-[0.1em]">Next Follow-Up</th>
                                    <th className="px-8 py-6 text-[11px] font-bold text-[#888888] uppercase tracking-[0.1em]">Last Act.</th>
                                    <th className="px-8 py-6 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-[13px]">
                                {leads.map(lead => (
                                    <tr key={lead.id} className="hover:bg-white/[0.03] transition-colors group">
                                        <td className="px-8 py-5">
                                            <Link href={`/leads/${lead.id}`} className="text-white hover:text-blue-400 font-bold transition-colors">
                                                {lead.business_name}
                                            </Link>
                                        </td>
                                        <td className="px-8 py-5 text-slate-400">{lead.owner_name || '—'}</td>
                                        <td className="px-8 py-5 text-slate-400">{lead.city || '—'}</td>
                                        <td className="px-8 py-5">
                                            <StageBadge stage={lead.stage} />
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white">
                                                    {initials(lead.profiles?.full_name || 'U')}
                                                </div>
                                                <span className="text-slate-400">{lead.profiles?.full_name || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="text-[#a3e635] font-bold">{lead.lead_score || '—'}</span>
                                        </td>
                                        <td className={`px-8 py-5 font-bold uppercase text-[11px] ${isOverdue(lead.next_follow_up_at) ? 'text-red-500' : 'text-slate-400'}`}>
                                            {lead.next_follow_up_at ? format(new Date(lead.next_follow_up_at), "MMM d, h:mm a") : '—'}
                                        </td>
                                        <td className="px-8 py-5 text-slate-500 text-[11px] uppercase">
                                            {timeAgo(lead.last_activity_at)}
                                        </td>
                                        <td className="px-8 py-5 text-right relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setOpenDropdownId(openDropdownId === lead.id ? null : lead.id)
                                                }}
                                                className="opacity-0 group-hover:opacity-100 text-[#888888] hover:text-white transition-all p-2"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>

                                            {openDropdownId === lead.id && (
                                                <div className="absolute right-8 top-12 mt-1 w-32 bg-[#1c1c1c] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                                                    <button
                                                        onClick={() => router.push(`/leads/${lead.id}/edit`)}
                                                        className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteLead(lead.id, lead.business_name)}
                                                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors flex items-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                <div className="flex items-center justify-between px-8 py-4 border-t border-white/10 bg-[#111111] text-sm text-slate-400 mt-auto rounded-b-[2.5rem]">
                    <span>
                        Showing {totalLeads === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalLeads)} of {totalLeads} leads
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => p - 1)}
                            disabled={page === 0}
                            className="px-3 py-1 border border-white/10 rounded-lg disabled:opacity-30 hover:bg-white/5 transition-colors text-white text-xs font-semibold"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={(page + 1) * PAGE_SIZE >= totalLeads}
                            className="px-3 py-1 border border-white/10 rounded-lg disabled:opacity-30 hover:bg-white/5 transition-colors text-white text-xs font-semibold"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function LeadsPage() {
    return (
        <Suspense fallback={<div className="p-8"><Skeleton className="h-64 rounded-3xl" /></div>}>
            <LeadsPageContent />
        </Suspense>
    )
}
