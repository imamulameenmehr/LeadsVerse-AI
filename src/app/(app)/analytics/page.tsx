'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { STAGE_ORDER } from '@/constants/stages'
import type { Stage } from '@/types'
import { Skeleton } from '@/components/ui/Skeleton'

const customStyles = `
  .card-shadow {
    box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.5);
  }
  .stepped-chart-bar {
    border-radius: 9999px;
    width: 48px;
  }
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

interface CloserStat {
    id: string
    full_name: string
    leadsAssigned: number
    contactsMade: number
    dmRate: string
    demoRate: string
    closeRate: string
    revenueGenerated: number
}

const safePct = (num: number, denom: number): string => {
    if (!denom || denom === 0 || isNaN(denom) || isNaN(num)) return '0.0%'
    return `${((num / denom) * 100).toFixed(1)}%`
}

export default function AnalyticsPage() {
    const [stats, setStats] = useState<CloserStat[]>([])
    const [stageMap, setStageMap] = useState<Record<Stage, number>>(
        STAGE_ORDER.reduce((acc, s) => { acc[s] = 0; return acc }, {} as Record<Stage, number>)
    )
    const [loading, setLoading] = useState(true)

    const fetchAnalytics = async () => {
        try {
            // Fetch closer stats
            const { data: closerStats, error } = await supabase
                .from('profiles')
                .select(`
                    id, full_name,
                    leads!leads_assigned_to_fkey (
                        id, stage, expected_mrr
                    )
                `)
                .eq('role', 'closer')

            if (error) throw error

            const processedStats: CloserStat[] = (closerStats || []).map(closer => {
                const leads = closer.leads as any[] || []

                const leadsAssigned = leads.length
                const contactsMade = leads.filter(l => l.stage !== 'new').length

                const dmCount = leads.filter(l =>
                    ['decision_maker', 'interested', 'demo_scheduled', 'proposal_sent', 'closed_won'].includes(l.stage)
                ).length

                const demoCount = leads.filter(l =>
                    ['demo_scheduled', 'proposal_sent', 'closed_won'].includes(l.stage)
                ).length

                const wonCount = leads.filter(l => l.stage === 'closed_won').length

                const revenueGenerated = leads
                    .filter(l => l.stage === 'closed_won')
                    .reduce((sum, l) => sum + (Number(l.expected_mrr) || 0), 0)

                return {
                    id: closer.id,
                    full_name: closer.full_name,
                    leadsAssigned,
                    contactsMade,
                    dmRate: safePct(dmCount, contactsMade),
                    demoRate: safePct(demoCount, dmCount),
                    closeRate: safePct(wonCount, demoCount),
                    revenueGenerated
                }
            })

            // Sort by revenue generated descending
            setStats(processedStats.sort((a, b) => b.revenueGenerated - a.revenueGenerated))

            // Fetch generic pipeline stages for the Funnel UI
            const { data: stageCounts } = await supabase.from('leads').select('stage')
            const newStageMap = STAGE_ORDER.reduce((acc, s) => { acc[s] = 0; return acc }, {} as Record<Stage, number>)
            stageCounts?.forEach(l => {
                if (newStageMap[l.stage as Stage] !== undefined) {
                    newStageMap[l.stage as Stage]++
                }
            })
            setStageMap(newStageMap)

        } catch (error) {
            console.error('Error fetching analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAnalytics()
    }, [])

    if (loading) {
        return (
            <div className="space-y-6">
                <style>{customStyles}</style>
                {/* Header skeleton */}
                <div className="flex justify-between items-end">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-5 w-32" />
                </div>
                {/* Stats table skeleton */}
                <div className="bg-[#1c1c1c] rounded-[2rem] border border-white/10 p-6 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-24 ml-auto" />
                        </div>
                    ))}
                </div>
                {/* Funnel + stage chart skeleton */}
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-[260px] rounded-2xl" />
                    <Skeleton className="h-[260px] rounded-2xl" />
                </div>
            </div>
        )
    }

    const totalLeads = Object.values(stageMap).reduce((a, b) => a + b, 0)

    // Funnel Chart Mapping (from STAGE_ORDER to prototype funnel steps)
    const funnelData = [
        { label: 'New', count: stageMap.new, color: 'bg-white', height: '100%' },
        { label: 'Contact', count: stageMap.contacted, color: 'bg-[#dcfc71]', height: '80%' }, // var(--accent)
        { label: 'Decision', count: stageMap.decision_maker, color: 'bg-[#dcfc71]', height: '65%' },
        { label: 'Interst', count: stageMap.interested, color: 'bg-[#ff9d42]', height: '50%' }, // var(--accent-orange)
        { label: 'Demo', count: stageMap.demo_scheduled, color: 'bg-[#ff9d42]', height: '35%' },
        { label: 'Prop', count: stageMap.proposal_sent, color: 'bg-white', height: '20%' },
        { label: 'Won', count: stageMap.closed_won, color: 'bg-[#dcfc71]', height: '12%' },
    ]

    // Summary Totals
    const sumLeads = stats.reduce((sum, s) => sum + s.leadsAssigned, 0)
    const sumContacts = stats.reduce((sum, s) => sum + s.contactsMade, 0)
    const sumRev = stats.reduce((sum, s) => sum + s.revenueGenerated, 0)

    // Using global stats for Key Metrics panel
    const contactedCount = STAGE_ORDER.slice(1).reduce((s, st) => s + stageMap[st], 0)
    const dmCount = ['decision_maker', 'interested', 'demo_scheduled', 'proposal_sent', 'closed_won'].reduce((s, st) => s + stageMap[st as Stage], 0)
    const demoCount = ['demo_scheduled', 'proposal_sent', 'closed_won'].reduce((s, st) => s + stageMap[st as Stage], 0)

    const globalContactRate = safePct(contactedCount, totalLeads)
    const globalDmRate = safePct(dmCount, contactedCount)
    const globalCloseRate = safePct(stageMap.closed_won, demoCount)

    return (
        <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)] text-[13px] bg-black text-white">
            <style>{customStyles}</style>

            <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Header Filters are simulated per prototype */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold tracking-tight uppercase">Analytics</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center bg-zinc-900 border border-white/5 rounded-full px-4 py-2 gap-2">
                                <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Date:</span>
                                <select className="bg-transparent border-none text-xs text-white focus:ring-0 p-0 pr-4 outline-none">
                                    <option>This Month</option>
                                    <option>Custom Range</option>
                                </select>
                            </div>
                            <div className="flex items-center bg-zinc-900 border border-white/5 rounded-full px-4 py-2 gap-2">
                                <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Closer:</span>
                                <select className="bg-transparent border-none text-xs text-white focus:ring-0 p-0 pr-4 outline-none">
                                    <option>All Closers</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Pipeline Funnel */}
                        <div className="lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-[32px] p-8 card-shadow relative overflow-hidden">
                            <div className="flex justify-between items-center mb-12">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Pipeline Funnel</h2>
                            </div>

                            <div className="relative h-64 flex items-end justify-between px-4">
                                {/* Grid lines */}
                                <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-10">
                                    <div className="border-b border-white w-full"></div>
                                    <div className="border-b border-white w-full"></div>
                                    <div className="border-b border-white w-full"></div>
                                    <div className="border-b border-white w-full"></div>
                                    <div className="border-b border-white w-full"></div>
                                </div>

                                {/* Bars */}
                                {funnelData.map((stage, idx) => (
                                    <div key={idx} className="relative z-10 flex flex-col items-center gap-4 group">
                                        <div className={`${stage.color} stepped-chart-bar group-hover:opacity-80 transition-all flex flex-col items-center justify-center`} style={{ height: stage.height }}>
                                            <span className="text-[10px] font-bold text-black mt-2">{stage.count}</span>
                                        </div>
                                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter transform -rotate-45 mt-4">{stage.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-16 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white"></div> Resources</div>
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#dcfc71]"></div> Valid</div>
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ff9d42]"></div> Invalid</div>
                                <div>Total: {totalLeads}</div>
                            </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-[32px] p-8 card-shadow flex flex-col justify-between">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Key Metrics</h2>
                            <div className="space-y-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Contact Rate</div>
                                        <div className="text-2xl font-bold text-white">{globalContactRate}</div>
                                    </div>
                                    <span className="text-[#dcfc71] text-xs font-bold uppercase tracking-wider">Overall</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">DM Rate</div>
                                        <div className="text-2xl font-bold text-white">{globalDmRate}</div>
                                    </div>
                                    <span className="text-[#ff9d42] text-xs font-bold uppercase tracking-wider">Overall</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Close Rate</div>
                                        <div className="text-2xl font-bold text-white">{globalCloseRate}</div>
                                    </div>
                                    <span className="text-[#dcfc71] text-xs font-bold uppercase tracking-wider">Overall</span>
                                </div>
                            </div>
                            <button className="w-full py-3 bg-zinc-800 rounded-2xl text-xs font-bold uppercase tracking-widest text-white hover:bg-zinc-700 transition-colors">
                                Download Report
                            </button>
                        </div>
                    </div>

                    {/* Closer Performance Table */}
                    <div className="bg-zinc-900/50 border border-white/5 rounded-[32px] overflow-hidden card-shadow">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Closer Performance</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-black/20">
                                        <th className="px-8 py-4">Closer</th>
                                        <th className="px-6 py-4 text-right">Leads</th>
                                        <th className="px-6 py-4 text-right">Contacts</th>
                                        <th className="px-6 py-4 text-right">DM Rate</th>
                                        <th className="px-6 py-4 text-right">Demo Rate</th>
                                        <th className="px-6 py-4 text-right">Close Rate</th>
                                        <th className="px-8 py-4 text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {stats.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-8 py-12 text-center text-slate-500">
                                                No closer data available.
                                            </td>
                                        </tr>
                                    ) : stats.map(stat => (
                                        <tr key={stat.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3 text-sm font-bold text-white">
                                                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
                                                        {stat.full_name.charAt(0)}
                                                    </div>
                                                    {stat.full_name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right text-sm font-medium text-zinc-300">{stat.leadsAssigned}</td>
                                            <td className="px-6 py-5 text-right text-sm font-medium text-zinc-300">{stat.contactsMade}</td>
                                            <td className="px-6 py-5 text-right text-sm font-bold text-[#dcfc71]">{stat.dmRate}</td>
                                            <td className="px-6 py-5 text-right text-sm font-medium text-zinc-300">{stat.demoRate}</td>
                                            <td className="px-6 py-5 text-right text-sm font-medium text-zinc-300">{stat.closeRate}</td>
                                            <td className="px-8 py-5 text-right text-sm font-bold text-white">${stat.revenueGenerated.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-black/40">
                                        <td className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-zinc-500">Totals</td>
                                        <td className="px-6 py-6 text-right text-sm font-bold text-white">{sumLeads}</td>
                                        <td className="px-6 py-6 text-right text-sm font-bold text-white">{sumContacts}</td>
                                        <td className="px-6 py-6 text-right text-sm font-bold text-[#dcfc71]">-</td>
                                        <td className="px-6 py-6 text-right text-sm font-bold text-[#dcfc71]">-</td>
                                        <td className="px-6 py-6 text-right text-sm font-bold text-[#dcfc71]">-</td>
                                        <td className="px-8 py-6 text-right text-sm font-bold text-[#dcfc71]">${sumRev.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
