'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
import { STAGE_ORDER, STAGE_LABELS } from '@/constants/stages'
import type { Stage, Activity } from '@/types'
import { Skeleton } from '@/components/ui/Skeleton'

// Add custom CSS exactly from prototype
const customStyles = `
  .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #555;
      border-radius: 10px;
  }
`

const safePct = (num: number, denom: number): string => {
    if (!denom || denom === 0 || isNaN(denom) || isNaN(num)) return '0.0%'
    return `${((num / denom) * 100).toFixed(1)}%`
}

export default function DashboardPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)

    // Data State
    const [kpis, setKpis] = useState({
        totalLeads: 0, newToday: 0, callsToday: 0,
        demosScheduled: 0, dealsWon: 0, expectedMRR: 0
    })
    const [stageMap, setStageMap] = useState<Record<Stage, number>>(
        STAGE_ORDER.reduce((acc, s) => { acc[s] = 0; return acc }, {} as Record<Stage, number>)
    )
    const [recentActivity, setRecentActivity] = useState<any[]>([])

    const fetchDashboardData = async () => {
        try {
            const today = new Date().toISOString().split('T')[0]

            const [
                { count: totalLeads },
                { count: newToday },
                { count: callsToday },
                { count: demosScheduled },
                { count: dealsWon },
                { data: mrrData },
                { data: stageCounts },
                { data: recentActivity },
            ] = await Promise.all([
                supabase.from('leads').select('*', { count: 'exact', head: true }),
                supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', today),
                supabase.from('activities').select('*', { count: 'exact', head: true }).eq('type', 'call').gte('created_at', today),
                supabase.from('leads').select('*', { count: 'exact', head: true }).eq('stage', 'demo_scheduled'),
                supabase.from('leads').select('*', { count: 'exact', head: true }).eq('stage', 'closed_won'),
                supabase.from('leads').select('expected_mrr').not('stage', 'eq', 'closed_lost'),
                supabase.from('leads').select('stage'),
                supabase.from('activities')
                    .select('id, type, outcome, created_at, profiles(full_name), leads(business_name)')
                    .order('created_at', { ascending: false })
                    .limit(20),
            ])

            const expectedMRR = mrrData?.reduce((sum, l) => sum + (l.expected_mrr ?? 0), 0) ?? 0

            const newStageMap = STAGE_ORDER.reduce((acc, s) => { acc[s] = 0; return acc }, {} as Record<Stage, number>)
            stageCounts?.forEach(l => {
                if (newStageMap[l.stage as Stage] !== undefined) {
                    newStageMap[l.stage as Stage]++
                }
            })

            setKpis({
                totalLeads: totalLeads ?? 0,
                newToday: newToday ?? 0,
                callsToday: callsToday ?? 0,
                demosScheduled: demosScheduled ?? 0,
                dealsWon: dealsWon ?? 0,
                expectedMRR
            })
            setStageMap(newStageMap)
            setRecentActivity(recentActivity ?? [])
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
        const interval = setInterval(fetchDashboardData, 60_000)
        return () => clearInterval(interval)
    }, [])

    // Funnel calculations for prototype metrics
    const contactedCount = STAGE_ORDER.slice(1).reduce((s, st) => s + stageMap[st], 0)
    const dmCount = ['decision_maker', 'interested', 'demo_scheduled', 'proposal_sent', 'closed_won'].reduce((s, st) => s + stageMap[st as Stage], 0)
    const demoCount = ['demo_scheduled', 'proposal_sent', 'closed_won'].reduce((s, st) => s + stageMap[st as Stage], 0)

    const metrics = {
        contactRate: safePct(contactedCount, kpis.totalLeads),
        decisionRate: safePct(dmCount, contactedCount),
        demoRate: safePct(demoCount, dmCount),
        closeRate: safePct(kpis.dealsWon, demoCount),
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <style>{customStyles}</style>
                {/* KPI row skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-[90px] rounded-2xl" />
                    ))}
                </div>
                {/* Charts row skeleton */}
                <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-[280px] col-span-2 rounded-2xl" />
                    <Skeleton className="h-[280px] rounded-2xl" />
                </div>
                {/* Lower row skeleton */}
                <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-[220px] rounded-2xl" />
                    <Skeleton className="h-[220px] col-span-2 rounded-2xl" />
                </div>
            </div>
        )
    }

    // Mapping prototype active leads total
    const activeLeads = kpis.totalLeads;

    // Mapping prototype Stage Distribution bars
    // The prototype has 5 specific bars: Discovery Phase, Technical Demo, Proposal Pending, Negotiation, Closed Won.
    // We will map our dynamic stages to these 5 custom bars.

    // 1. Discovery Phase (new, contacted, decision_maker, interested)
    const discoveryCount = stageMap.new + stageMap.contacted + stageMap.decision_maker + stageMap.interested;
    const discoveryPct = safePct(discoveryCount, activeLeads);
    // 2. Technical Demo (demo_scheduled)
    const techDemoCount = stageMap.demo_scheduled;
    const techDemoPct = safePct(techDemoCount, activeLeads);
    // 3. Proposal Pending (proposal_sent)
    const proposalCount = stageMap.proposal_sent;
    const proposalPct = safePct(proposalCount, activeLeads);
    // 4. Negotiation (None specified in our DB stages, maybe just fake it or omit)
    // we will combine proposal_sent conceptually if needed, or just let Negotiation be 0 if we don't have it.
    // 5. Closed Won (closed_won)
    const closedWonCount = stageMap.closed_won;
    const closedWonPct = safePct(closedWonCount, activeLeads);

    return (
        <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)] text-[13px] bg-black text-white">
            <style>{customStyles}</style>

            <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-6xl mx-auto space-y-8">

                    {/* Header is handled by the root layout, so we just render the content grids */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Dashboard Overview</h1>
                            <p className="text-zinc-500 text-sm">Real-time overview of your sales pipeline and activity.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* Box 1: Total Revenue (Expected MRR in our case) */}
                        <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-zinc-500 font-medium uppercase tracking-wider text-[10px]">Expected MRR</span>
                                <span className="text-green-500 text-[10px] font-bold">Total</span>
                            </div>
                            <div className="flex items-end justify-between">
                                <h3 className="text-2xl font-bold tracking-tight">${kpis.expectedMRR.toLocaleString()}</h3>
                                <div className="w-16 h-8 flex items-end gap-1">
                                    <div className="w-1 bg-white/10 h-3 rounded-full"></div>
                                    <div className="w-1 bg-white/10 h-5 rounded-full"></div>
                                    <div className="w-1 bg-green-500 h-8 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)]"></div>
                                    <div className="w-1 bg-white/10 h-6 rounded-full"></div>
                                </div>
                            </div>
                        </div>

                        {/* Box 2: Active Leads */}
                        <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-zinc-500 font-medium uppercase tracking-wider text-[10px]">Active Leads</span>
                                <span className="text-yellow-500 text-[10px] font-bold">Total</span>
                            </div>
                            <div className="flex items-end justify-between">
                                <h3 className="text-2xl font-bold tracking-tight">{activeLeads.toLocaleString()}</h3>
                                <div className="w-16 h-8 flex items-end gap-1">
                                    <div className="w-1 bg-white/10 h-6 rounded-full"></div>
                                    <div className="w-1 bg-yellow-500 h-8 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.4)]"></div>
                                    <div className="w-1 bg-white/10 h-4 rounded-full"></div>
                                    <div className="w-1 bg-white/10 h-5 rounded-full"></div>
                                </div>
                            </div>
                        </div>

                        {/* Box 3: Conversion */}
                        <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-zinc-500 font-medium uppercase tracking-wider text-[10px]">Close Rate</span>
                                <span className="text-white/40 text-[10px] font-bold tracking-wider">Demo / Won</span>
                            </div>
                            <div className="flex items-end justify-between">
                                <h3 className="text-2xl font-bold tracking-tight">{metrics.closeRate}</h3>
                                <div className="w-16 h-8 flex items-end gap-1">
                                    <div className="w-1 bg-white/10 h-4 rounded-full"></div>
                                    <div className="w-1 bg-white/40 h-8 rounded-full"></div>
                                    <div className="w-1 bg-white/10 h-6 rounded-full"></div>
                                    <div className="w-1 bg-white/10 h-3 rounded-full"></div>
                                </div>
                            </div>
                        </div>

                        {/* Box 4: Avg Deal Size -> Demos Scheduled fallback */}
                        <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-zinc-500 font-medium uppercase tracking-wider text-[10px]">Demos Scheduled</span>
                                <span className="text-green-500 text-[10px] font-bold">Hot</span>
                            </div>
                            <div className="flex items-end justify-between">
                                <h3 className="text-2xl font-bold tracking-tight">{kpis.demosScheduled}</h3>
                                <div className="w-16 h-8 flex items-end gap-1">
                                    <div className="w-1 bg-white/10 h-2 rounded-full"></div>
                                    <div className="w-1 bg-white/10 h-4 rounded-full"></div>
                                    <div className="w-1 bg-white/10 h-5 rounded-full"></div>
                                    <div className="w-1 bg-green-500 h-8 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stage Distribution Section */}
                    <div className="bg-[#111111] border border-white/5 rounded-2xl p-8">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h2 className="text-lg font-bold tracking-tight">Stage Distribution</h2>
                                <p className="text-zinc-500 text-xs mt-1">Lead progression across all active pipelines</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-bold uppercase tracking-widest text-zinc-400">All Time</button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Discovery Phase */}
                            <div className="group">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-semibold text-zinc-300">Discovery Phase (New / Contacted / DM / Interested)</span>
                                    <span className="text-xs font-mono text-zinc-500">{discoveryCount} Leads <span className="text-zinc-700 mx-2">|</span> {discoveryPct}</span>
                                </div>
                                <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-500 rounded-full transition-all duration-1000" style={{ width: discoveryPct, boxShadow: '0 0 15px rgba(234,179,8,0.3)' }}></div>
                                </div>
                            </div>

                            {/* Technical Demo */}
                            <div className="group">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-semibold text-zinc-300">Technical Demo (Demo Scheduled)</span>
                                    <span className="text-xs font-mono text-zinc-500">{techDemoCount} Leads <span className="text-zinc-700 mx-2">|</span> {techDemoPct}</span>
                                </div>
                                <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: techDemoPct, boxShadow: '0 0 15px rgba(16,185,129,0.3)' }}></div>
                                </div>
                            </div>

                            {/* Proposal Pending */}
                            <div className="group">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-semibold text-zinc-300">Proposal Pending</span>
                                    <span className="text-xs font-mono text-zinc-500">{proposalCount} Leads <span className="text-zinc-700 mx-2">|</span> {proposalPct}</span>
                                </div>
                                <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: proposalPct, boxShadow: '0 0 15px rgba(59,130,246,0.3)' }}></div>
                                </div>
                            </div>

                            {/* Closed Won */}
                            <div className="group">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-semibold text-zinc-300">Closed Won</span>
                                    <span className="text-xs font-mono text-zinc-500">{closedWonCount} Leads <span className="text-zinc-700 mx-2">|</span> {closedWonPct}</span>
                                </div>
                                <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: closedWonPct, boxShadow: '0 0 15px rgba(99,102,241,0.3)' }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Extra Stat Bar */}
                        <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Total Pipeline</p>
                                <p className="text-lg font-bold">${kpis.expectedMRR.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Total Leads</p>
                                <p className="text-lg font-bold">{activeLeads}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Deals Won</p>
                                <p className="text-lg font-bold text-green-500">{kpis.dealsWon}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Contact Rate</p>
                                <p className="text-lg font-bold text-blue-500">{metrics.contactRate}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Right Sidebar - Recent Activity */}
            <aside className="w-[320px] bg-black border-l border-white/5 flex flex-col shrink-0 hidden lg:flex">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-bold tracking-tight">Recent Activity</h3>
                        <span className="text-[10px] text-zinc-500 px-2 py-0.5 bg-zinc-900 rounded-full border border-white/5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            Live
                        </span>
                    </div>
                    <p className="text-xs text-zinc-500">Real-time update stream</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {recentActivity.length === 0 ? (
                        <p className="text-xs text-zinc-500 text-center py-8">No recent activity.</p>
                    ) : (
                        recentActivity.map((activity, i) => {
                            // Assign a random dot color based on activity type for visual variety
                            let dotColorClass = "bg-zinc-700";
                            let shadowClass = "";
                            let actionText = "interacted with";
                            let highlightClass = "text-white";

                            switch (activity.type) {
                                case 'call':
                                    dotColorClass = "bg-yellow-500";
                                    shadowClass = "shadow-[0_0_8px_rgba(234,179,8,0.5)]";
                                    actionText = "contacted";
                                    highlightClass = "text-yellow-500";
                                    break;
                                case 'stage_change':
                                    dotColorClass = "bg-blue-500";
                                    shadowClass = "shadow-[0_0_8px_rgba(59,130,246,0.5)]";
                                    actionText = "moved";
                                    highlightClass = "text-blue-400";
                                    break;
                                case 'note':
                                    dotColorClass = "bg-emerald-500";
                                    shadowClass = "shadow-[0_0_8px_rgba(16,185,129,0.5)]";
                                    actionText = "added a note to";
                                    highlightClass = "text-emerald-500";
                                    break;
                            }

                            const isLast = i === recentActivity.length - 1;

                            return (
                                <div key={activity.id || i} className={`relative pl-6 ${!isLast ? 'border-l border-white/10 pb-2' : ''}`}>
                                    <div className={`absolute -left-[5px] top-0 w-[9px] h-[9px] rounded-full ${dotColorClass} ${shadowClass}`}></div>
                                    <div className="flex gap-3 items-start">
                                        <div className="w-7 h-7 rounded-full bg-zinc-800 shrink-0 flex items-center justify-center font-bold text-xs text-white uppercase border border-white/10">
                                            {activity.profiles?.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-300 leading-snug">
                                                <span className="font-bold text-white">{activity.profiles?.full_name || 'Someone'}</span>
                                                {' '} {actionText} {' '}
                                                <span className={`font-medium ${highlightClass}`}>{activity.leads?.business_name || 'a lead'}</span>
                                            </p>
                                            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-tighter">
                                                {formatDistanceToNow(new Date(activity.created_at || new Date()), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                <div className="p-6 border-t border-white/5 bg-zinc-950/50">
                    <button className="w-full py-2 rounded-lg bg-zinc-900 border border-white/5 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors text-white">
                        View Full Audit Log
                    </button>
                </div>
            </aside>
        </div>
    )
}
