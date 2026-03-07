'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { Phone, MessageSquare, Mail, StickyNote, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { STAGE_LABELS, STAGE_ORDER } from '@/constants/stages'
import { StageBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import AIOutreachModal from '@/components/leads/AIOutreachModal'
import type { Stage, ActivityType, Lead, Activity } from '@/types'

const TABS = ['Info', 'Activity', 'Notes', 'Financial']

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
    call: <Phone size={14} className="text-blue-400" />,
    sms: <MessageSquare size={14} className="text-green-400" />,
    email: <Mail size={14} className="text-indigo-400" />,
    note: <StickyNote size={14} className="text-yellow-400" />,
    stage_change: <ArrowRight size={14} className="text-purple-400" />,
    whatsapp: <MessageSquare size={14} className="text-green-500" />,
    instagram_dm: <MessageSquare size={14} className="text-pink-500" />,
    linkedin_dm: <MessageSquare size={14} className="text-blue-500" />,
    facebook_dm: <MessageSquare size={14} className="text-blue-600" />,
    twitter_dm: <MessageSquare size={14} className="text-sky-500" />,
    tiktok_dm: <MessageSquare size={14} className="text-black" />,
    meeting: <Phone size={14} className="text-purple-500" />,
    demo: <Phone size={14} className="text-rose-500" />,
    voicemail: <Phone size={14} className="text-orange-400" />,
    no_answer: <Phone size={14} className="text-red-500" />,
    follow_up: <ArrowRight size={14} className="text-teal-400" />
}

export default function LeadDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params)
    const router = useRouter()
    const { profile: currentUser } = useCurrentUser()

    const [lead, setLead] = useState<Lead | null>(null)
    const [activities, setActivities] = useState<Activity[]>([])
    const [loading, setLoading] = useState(true)

    const [activeTab, setActiveTab] = useState('Info')
    const [showAI, setShowAI] = useState(false)

    // Activity Log State
    const [logType, setLogType] = useState<ActivityType>('note')
    const [outcome, setOutcome] = useState('')
    const [followUpDate, setFollowUpDate] = useState('')
    const [submitting, setSubmitting] = useState(false)

    // Financial Tab State
    const [probabilityPercent, setProbabilityPercent] = useState(0)
    const [quotedPrice, setQuotedPrice] = useState(0)

    // Notes Tab State
    const [notes, setNotes] = useState('')
    const [savingNotes, setSavingNotes] = useState(false)

    // Edit Activity State
    const [editingActivityId, setEditingActivityId] = useState<string | null>(null)
    const [editLogType, setEditLogType] = useState<ActivityType>('note')
    const [editOutcome, setEditOutcome] = useState('')
    const [updatingActivity, setUpdatingActivity] = useState(false)

    const fetchLead = async () => {
        const { data } = await supabase
            .from('leads')
            .select('*, profiles!assigned_to(full_name)')
            .eq('id', params.id)
            .single()

        if (!data) {
            router.push('/leads')
            return
        }

        setLead(data as unknown as Lead)
        setProbabilityPercent(data.probability_percent || 0)
        setQuotedPrice(data.quoted_price || 0)
        setNotes(data.notes || '')
    }

    const fetchActivities = async () => {
        const { data } = await supabase
            .from('activities')
            .select('*, profiles(full_name)')
            .eq('lead_id', params.id)
            .order('created_at', { ascending: false })

        setActivities(data as unknown as Activity[] ?? [])
    }

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            await Promise.all([fetchLead(), fetchActivities()])
            setLoading(false)
        }
        loadData()
    }, [params.id])

    const handleStageChange = async (newStage: Stage) => {
        if (!lead || !currentUser || newStage === lead.stage) return
        const oldStage = lead.stage

        // Optimistic update
        setLead({ ...lead, stage: newStage })

        const { error } = await supabase
            .from('leads')
            .update({ stage: newStage })
            .eq('id', lead.id)

        if (error) {
            // Revert on error
            setLead({ ...lead, stage: oldStage })
            return
        }

        // ALWAYS log the stage change
        await supabase.from('activities').insert({
            lead_id: lead.id,
            user_id: currentUser.id,
            type: 'stage_change',
            outcome: `Stage changed from "${STAGE_LABELS[oldStage]}" to "${STAGE_LABELS[newStage]}"`,
        })

        await fetchActivities()
    }

    const handleLogActivity = async () => {
        if (!outcome.trim() || !currentUser || !lead) return
        setSubmitting(true)

        const { error } = await supabase.from('activities').insert({
            lead_id: lead.id,
            user_id: currentUser.id,
            type: logType,
            outcome: outcome.trim(),
            follow_up_date: followUpDate || null,
        })

        if (!error) {
            if (followUpDate) {
                await supabase.from('leads')
                    .update({ next_follow_up_at: followUpDate })
                    .eq('id', lead.id)
            }
            setOutcome('')
            setFollowUpDate('')
            await fetchActivities()
            await fetchLead()
        } else {
            console.error('Error logging activity:', error)
            alert('Failed to log activity. Please try again.')
        }
        setSubmitting(false)
    }

    const handleEditClick = (act: Activity) => {
        setEditingActivityId(act.id)
        setEditLogType(act.type)
        setEditOutcome(act.outcome || '')
    }

    const handleCancelEdit = () => {
        setEditingActivityId(null)
    }

    const handleUpdateActivity = async () => {
        if (!editingActivityId || !editOutcome.trim()) return

        setUpdatingActivity(true)
        const { error } = await supabase
            .from('activities')
            .update({
                type: editLogType,
                outcome: editOutcome
            })
            .eq('id', editingActivityId)

        if (error) {
            console.error('Error updating activity:', error)
            alert('Failed to update activity.')
        } else {
            setEditingActivityId(null)
            await fetchActivities()
        }
        setUpdatingActivity(false)
    }

    const handleDeleteActivity = async (id: string) => {
        if (!confirm('Are you sure you want to delete this activity?')) return

        const { error } = await supabase.from('activities').delete().eq('id', id)
        if (error) {
            console.error('Error deleting activity:', error)
            alert('Failed to delete activity.')
        } else {
            await fetchActivities()
        }
    }

    const openLogModal = (type: ActivityType) => {
        setLogType(type)
        setActiveTab('Activity')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSaveNotes = async () => {
        if (!lead) return
        setSavingNotes(true)
        await supabase.from('leads').update({ notes }).eq('id', lead.id)
        setSavingNotes(false)
    }

    const handleUpdateFinancials = async () => {
        if (!lead) return
        const mrr = quotedPrice * (probabilityPercent / 100)
        await supabase.from('leads')
            .update({
                probability_percent: probabilityPercent,
                quoted_price: quotedPrice
            })
            .eq('id', lead.id)
        fetchLead()
    }

    if (loading || !lead) {
        return (
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    const expectedMRR = lead.expected_mrr || (quotedPrice * probabilityPercent / 100).toFixed(2)
    const timeAgo = (d: string) => formatDistanceToNow(new Date(d), { addSuffix: true })

    return (
        <div className="max-w-5xl mx-auto pb-12">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">{lead.business_name}</h1>
                        <div className="flex items-center gap-3 mt-3">
                            <StageBadge stage={lead.stage} />

                            <div className="relative">
                                <select
                                    value={lead.stage}
                                    onChange={e => handleStageChange(e.target.value as Stage)}
                                    className="appearance-none bg-[#1c1c1c] border border-white/10 text-slate-300 text-xs px-3 py-1 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
                                >
                                    {STAGE_ORDER.map(s => (
                                        <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-[14px] pointer-events-none">expand_more</span>
                            </div>

                            <span className="text-slate-600">·</span>
                            <span className="text-slate-400 text-sm">Assigned to: <span className="text-white font-medium">{lead.profiles?.full_name}</span></span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => router.push(`/leads/${lead.id}/edit`)}
                            className="flex items-center gap-2 border border-white/10 bg-[#1c1c1c] text-white hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                            Edit
                        </button>
                        <button
                            onClick={async () => {
                                if (confirm(`Are you sure you want to delete ${lead.business_name}?`)) {
                                    await supabase.from('leads').delete().eq('id', lead.id);
                                    router.push('/leads');
                                }
                            }}
                            className="flex items-center gap-2 border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Delete
                        </button>
                        <button
                            onClick={() => setShowAI(true)}
                            className="flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                        >
                            ✨ AI Outreach
                        </button>
                    </div>
                </div>

                {/* Quick action buttons */}
                <div className="flex flex-wrap gap-2 mb-2">
                    {(['call', 'sms', 'email', 'note'] as ActivityType[]).map(type => (
                        <button key={type}
                            onClick={() => openLogModal(type)}
                            className="text-xs bg-[#111111] border border-white/10 text-slate-300 hover:bg-[#1c1c1c] hover:text-white px-4 py-2 rounded-xl capitalize transition-colors font-medium">
                            Log {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabs Layout */}
            <div className="bg-[#111111] border border-white/5 rounded-[32px] overflow-hidden shadow-[0_4px_24px_-1px_rgba(0,0,0,0.5)] flex flex-col min-h-[500px]">
                {/* Tab Navigation */}
                <div className="flex gap-2 border-b border-white/5 px-6 pt-6">
                    {TABS.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={cn(
                                'px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors border-b-2',
                                activeTab === tab
                                    ? 'text-[#dcfc71] border-[#dcfc71]'
                                    : 'text-zinc-500 hover:text-white border-transparent'
                            )}>
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="p-8 flex-1">
                    {/* TAB 1: INFO */}
                    {activeTab === 'Info' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Contact Info</h3>
                                    <div className="bg-[#181818] border border-white/5 rounded-xl p-4 space-y-3">
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-slate-400">Owner</span>
                                            <span className="text-white font-medium">{lead.owner_name || '—'}</span>
                                        </div>

                                        {/* Phones */}
                                        {(lead.phones || []).length > 0 ? (lead.phones || []).map((p: any, i: number) => (
                                            <div key={p.id || i} className="flex justify-between border-b border-white/5 pb-2">
                                                <span className="text-slate-400">{p.label} Phone</span>
                                                <a href={`tel:${p.value}`} className="text-[#dcfc71] hover:underline font-medium truncate max-w-[150px] text-right">{p.value}</a>
                                            </div>
                                        )) : (
                                            <div className="flex justify-between border-b border-white/5 pb-2">
                                                <span className="text-slate-400">Phone</span>
                                                <span className="text-white font-medium">—</span>
                                            </div>
                                        )}

                                        {/* Emails */}
                                        {(lead.emails || []).length > 0 ? (lead.emails || []).map((e: any, i: number, arr: any[]) => (
                                            <div key={e.id || i} className={`flex justify-between ${i === arr.length - 1 ? '' : 'border-b border-white/5 pb-2'}`}>
                                                <span className="text-slate-400">{e.label}</span>
                                                <a href={`mailto:${e.value}`} className="text-blue-400 hover:underline font-medium truncate max-w-[150px] text-right">{e.value}</a>
                                            </div>
                                        )) : (
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Email</span>
                                                <span className="text-white font-medium">—</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Location</h3>
                                    <div className="bg-[#181818] border border-white/5 rounded-xl p-4 space-y-3">
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-slate-400">Address</span>
                                            <span className="text-white font-medium">{lead.address || '—'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">City/State</span>
                                            <span className="text-white font-medium">{lead.city || '—'}, {lead.state || '—'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Timeline & Tracking</h3>
                                    <div className="bg-[#181818] border border-white/5 rounded-xl p-4 space-y-3">
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-slate-400">Created At</span>
                                            <span className="text-white font-medium">{lead.created_at ? format(new Date(lead.created_at), 'MMM d, yyyy h:mm a') : '—'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-slate-400">Updated At</span>
                                            <span className="text-white font-medium">{lead.updated_at ? format(new Date(lead.updated_at), 'MMM d, yyyy h:mm a') : '—'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-slate-400">Last Activity</span>
                                            <span className="text-white font-medium">{lead.last_activity_at ? format(new Date(lead.last_activity_at), 'MMM d, yyyy h:mm a') : '—'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Next Follow-Up</span>
                                            <span className={cn("font-medium", lead.next_follow_up_at && new Date(lead.next_follow_up_at) < new Date() ? 'text-red-400' : 'text-white')}>
                                                {lead.next_follow_up_at ? format(new Date(lead.next_follow_up_at), 'MMM d, yyyy h:mm a') : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Business Details</h3>
                                    <div className="bg-[#181818] border border-white/5 rounded-xl p-4 space-y-3">
                                        {(lead.social_links || []).length > 0 ? (lead.social_links || []).map((link: any, i: number) => (
                                            <div key={link.id || i} className="flex justify-between border-b border-white/5 pb-2">
                                                <span className="text-slate-400">{link.platform}</span>
                                                <a href={link.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate max-w-[200px] text-right" title={link.url}>{link.url}</a>
                                            </div>
                                        )) : (
                                            <div className="flex justify-between border-b border-white/5 pb-2">
                                                <span className="text-slate-400">Web Links</span>
                                                <span className="text-white font-medium">—</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-slate-400">Rating & Reviews</span>
                                            <span className="text-white font-medium">{lead.rating ? `${lead.rating} ⭐` : '—'} ({lead.total_reviews || 0})</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-slate-400">Lead Source</span>
                                            <span className="text-white font-medium capitalize">{lead.lead_source || '—'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-slate-400">Client Type</span>
                                            <span className="text-white font-medium uppercase">{lead.client_type || '—'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Lead Score</span>
                                            <span className={cn("font-medium", (lead.lead_score || 0) >= 80 ? 'text-green-400' : (lead.lead_score || 0) >= 50 ? 'text-yellow-400' : 'text-white')}>
                                                {lead.lead_score || '0'} / 100
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Firmographics</h3>
                                    <div className="bg-[#181818] border border-white/5 rounded-xl p-4 space-y-3">
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-slate-400">Industry</span>
                                            <span className="text-white font-medium">{lead.industry || '—'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-slate-400">Company Size</span>
                                            <span className="text-white font-medium">{lead.company_size || '—'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Annual Revenue</span>
                                            <span className="text-white font-medium">{lead.annual_revenue || '—'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Qualification & Deal</h3>
                                    <div className="bg-[#181818] border border-white/5 rounded-xl p-4 space-y-3">
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-slate-400">Lead Status</span>
                                            <span className="text-white font-medium">{lead.lead_status || 'New'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-slate-400">Priority</span>
                                            <span className={cn("font-medium", lead.priority === 'High' ? 'text-red-400' : lead.priority === 'Medium' ? 'text-yellow-400' : 'text-white')}>
                                                {lead.priority || 'Medium'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-slate-400">Expected Close</span>
                                            <span className="text-white font-medium">{lead.expected_close_date ? format(new Date(lead.expected_close_date), 'MMM d, yyyy') : '—'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-slate-400">Client Budget</span>
                                            <span className="text-white font-medium">{lead.client_budget ? `$${lead.client_budget.toLocaleString()}` : '—'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Quoted Price</span>
                                            <span className="text-white font-medium">{lead.quoted_price ? `$${lead.quoted_price.toLocaleString()}` : '—'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Challenges & Solutions</h3>
                                    <div className="bg-[#181818] border border-white/5 rounded-xl p-4 space-y-4">
                                        <div>
                                            <h4 className="text-xs font-medium text-slate-400 mb-1">Pain Point</h4>
                                            <p className="text-slate-300 leading-relaxed text-sm">{lead.pain_point || 'No pain points recorded.'}</p>
                                        </div>
                                        <div className="pt-3 border-t border-white/5">
                                            <h4 className="text-xs font-medium text-slate-400 mb-1">Proposed Solution</h4>
                                            <p className="text-slate-300 leading-relaxed text-sm">{lead.proposed_solution || 'No solution recorded.'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: ACTIVITY */}
                    {activeTab === 'Activity' && (
                        <div className="flex flex-col h-full space-y-8">
                            {/* Log Form */}
                            <div className="bg-[#181818] border border-white/5 rounded-2xl p-6">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#dcfc71] mb-4">Log New Activity</h3>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="w-1/3">
                                            <label className="block text-xs font-medium text-slate-400 mb-1">Activity Type</label>
                                            <select
                                                value={logType}
                                                onChange={e => setLogType(e.target.value as ActivityType)}
                                                className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:ring-1 focus:ring-[#dcfc71] outline-none"
                                            >
                                                <option value="call">Call</option>
                                                <option value="sms">SMS</option>
                                                <option value="email">Email</option>
                                                <option value="note">Note</option>
                                                <option value="meeting">Meeting</option>
                                            </select>
                                        </div>
                                        <div className="w-2/3">
                                            <label className="block text-xs font-medium text-slate-400 mb-1">Follow-up Date (Optional)</label>
                                            <input
                                                type="datetime-local"
                                                value={followUpDate}
                                                onChange={e => setFollowUpDate(e.target.value)}
                                                className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:ring-1 focus:ring-[#dcfc71] outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Outcome / Notes</label>
                                        <textarea
                                            value={outcome}
                                            onChange={e => setOutcome(e.target.value)}
                                            placeholder="What happened? What are the next steps?"
                                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-[#dcfc71] outline-none resize-none h-20"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleLogActivity}
                                            disabled={submitting || !outcome.trim()}
                                            className="bg-[#dcfc71] text-black font-bold uppercase tracking-widest text-xs px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                                        >
                                            {submitting ? 'Saving...' : 'Log Activity'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div>
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4 ml-6">Activity History</h3>
                                <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                                    {activities.length === 0 ? (
                                        <p className="text-slate-500 text-sm">No activities logged yet.</p>
                                    ) : activities.map((act) => (
                                        <div key={act.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">

                                            <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white/10 bg-black text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
                                                {ACTIVITY_ICONS[act.type] || <StickyNote size={14} />}
                                            </div>

                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#181818] border border-white/5 p-4 rounded-xl shadow group-hover:border-white/10 transition-colors">
                                                {editingActivityId === act.id ? (
                                                    <div className="space-y-3">
                                                        <div className="flex gap-2">
                                                            <div className="w-1/3">
                                                                <select
                                                                    value={editLogType}
                                                                    onChange={e => setEditLogType(e.target.value as ActivityType)}
                                                                    className="w-full bg-black border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                                                                >
                                                                    <option value="call">Call</option>
                                                                    <option value="sms">SMS</option>
                                                                    <option value="email">Email</option>
                                                                    <option value="note">Note</option>
                                                                    <option value="meeting">Meeting</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <textarea
                                                            value={editOutcome}
                                                            onChange={e => setEditOutcome(e.target.value)}
                                                            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none min-h-[60px] resize-none"
                                                        />
                                                        <div className="flex justify-end gap-2 mt-2">
                                                            <button onClick={handleCancelEdit} className="text-xs px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white transition-colors">Cancel</button>
                                                            <button onClick={handleUpdateActivity} disabled={updatingActivity} className="text-xs px-3 py-1.5 rounded bg-[#dcfc71] text-black hover:opacity-90 font-medium transition-opacity">
                                                                {updatingActivity ? 'Saving...' : 'Save'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-medium text-white text-sm capitalize">{act.type.replace('_', ' ')}</span>
                                                            <div className="flex items-center gap-2">
                                                                <time className="text-[11px] text-slate-500">{format(new Date(act.created_at), 'MMM d, h:mm a')}</time>
                                                                {/* Edit/Delete Actions */}
                                                                <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity gap-1">
                                                                    <button onClick={() => handleEditClick(act)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors" title="Edit">
                                                                        <span className="material-symbols-outlined text-[14px]">edit</span>
                                                                    </button>
                                                                    <button onClick={() => handleDeleteActivity(act.id)} className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-white/5 transition-colors" title="Delete">
                                                                        <span className="material-symbols-outlined text-[14px]">delete</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <p className="text-slate-300 text-sm mb-2 whitespace-pre-wrap">{act.outcome}</p>

                                                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{act.profiles?.full_name}</span>
                                                            <span className="text-[10px] text-slate-600">{timeAgo(act.created_at)}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: NOTES */}
                    {activeTab === 'Notes' && (
                        <div className="h-full flex flex-col">
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full h-64 bg-[#181818] border border-white/5 rounded-2xl p-6 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#dcfc71] resize-none mb-4"
                                placeholder="Use this space for comprehensive account notes, objections, requirements, etc..."
                            />
                            <div className="flex justify-end mt-auto">
                                <button
                                    onClick={handleSaveNotes}
                                    disabled={savingNotes}
                                    className="bg-[#dcfc71] text-black font-bold uppercase tracking-widest text-xs px-8 py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">save</span>
                                    {savingNotes ? 'Saving...' : 'Save Notes'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: FINANCIAL */}
                    {activeTab === 'Financial' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6 bg-[#181818] border border-white/5 rounded-2xl p-6">
                                <div>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Pricing & Probability</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1">Quoted Price ($)</label>
                                            <input
                                                type="number"
                                                value={quotedPrice}
                                                onChange={e => setQuotedPrice(Number(e.target.value))}
                                                onBlur={handleUpdateFinancials}
                                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-[#dcfc71] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-xs font-medium text-slate-400">Probability to Close</label>
                                                <span className="text-[#dcfc71] text-xs font-bold">{probabilityPercent}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={0} max={100} step={5}
                                                value={probabilityPercent}
                                                onChange={e => setProbabilityPercent(Number(e.target.value))}
                                                onMouseUp={handleUpdateFinancials}
                                                className="w-full accent-[#dcfc71] h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-900/20 to-black border border-blue-500/20 rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full"></div>

                                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 relative z-10">Expected MRR</h3>
                                <div className="text-5xl font-bold tracking-tight text-white mb-2 relative z-10">
                                    ${Number(expectedMRR).toLocaleString()}
                                </div>
                                <p className="text-sm text-slate-400 relative z-10">
                                    Based on ${Number(quotedPrice).toLocaleString()} × {probabilityPercent}% win rate
                                </p>

                                <span className="material-symbols-outlined text-blue-500/10 text-[120px] absolute -bottom-6 -left-6 pointer-events-none">
                                    monitoring
                                </span>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* AI Outreach Modal */}
            {showAI && (
                <AIOutreachModal leadId={lead.id} onClose={() => setShowAI(false)} />
            )}
        </div>
    )
}
