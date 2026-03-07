'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { supabase } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { STAGE_ORDER, STAGE_LABELS } from '@/constants/stages'
import type { Lead, Stage } from '@/types'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/Skeleton'

type BoardData = Record<Stage, Lead[]>

const buildBoard = (leads: Lead[]): BoardData => {
    const board = STAGE_ORDER.reduce((acc, stage) => {
        acc[stage] = []
        return acc
    }, {} as BoardData)

    leads.forEach(lead => {
        if (board[lead.stage]) {
            board[lead.stage].push(lead)
        }
    })
    return board
}

const isOverdue = (dateStr: string) => new Date(dateStr) < new Date()

export default function PipelinePage() {
    const router = useRouter()
    const { profile: currentUser, loading: userLoading } = useCurrentUser()
    const [board, setBoard] = useState<BoardData | null>(null)
    const [loading, setLoading] = useState(true)

    // For strict mode / SSR drag and drop hydration fixes
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const fetchLeads = async () => {
        if (!currentUser) return

        let query = supabase
            .from('leads')
            .select('id, business_name, owner_name, stage, lead_score, next_follow_up_at, assigned_to, profiles!assigned_to(full_name)')
            .order('created_at', { ascending: false })

        // Closer sees only their leads
        if (currentUser.role === 'closer') {
            query = query.eq('assigned_to', currentUser.id)
        }

        const { data, error } = await query

        if (!error && data) {
            setBoard(buildBoard(data as unknown as Lead[]))
        } else {
            setBoard(buildBoard([]))
        }
        setLoading(false)
    }

    useEffect(() => {
        if (!userLoading) {
            fetchLeads()
        }
    }, [currentUser, userLoading])

    const onDragEnd = async (result: DropResult) => {
        if (!board || !currentUser) return

        const { draggableId, destination, source } = result
        if (!destination) return
        if (destination.droppableId === source.droppableId &&
            destination.index === source.index) return

        const leadId = draggableId
        const oldStage = source.droppableId as Stage
        const newStage = destination.droppableId as Stage

        // 1. Optimistic UI update — move card immediately
        setBoard(prev => {
            if (!prev) return prev
            const updated = { ...prev }
            const lead = updated[oldStage].find(l => l.id === leadId)!
            updated[oldStage] = updated[oldStage].filter(l => l.id !== leadId)
            const updatedLead = { ...lead, stage: newStage }
            updated[newStage] = [
                ...updated[newStage].slice(0, destination.index),
                updatedLead,
                ...updated[newStage].slice(destination.index),
            ]
            return updated
        })

        // 2. Persist stage change
        const { error } = await supabase
            .from('leads')
            .update({ stage: newStage })
            .eq('id', leadId)

        if (error) {
            // Revert on failure — refetch fresh data
            console.error('Failed to update stage', error)
            await fetchLeads()
            return
        }

        // 3. Log activity — ALWAYS
        await supabase.from('activities').insert({
            lead_id: leadId,
            user_id: currentUser.id,
            type: 'stage_change',
            outcome: `Stage moved from "${STAGE_LABELS[oldStage]}" to "${STAGE_LABELS[newStage]}"`,
        })
    }

    // Prevents SSR mismatch with DND
    if (!isMounted) return null

    if (loading || !board) {
        return (
            <div className="p-6">
                <div className="mb-6">
                    <Skeleton className="h-9 w-52 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="w-[270px] flex-shrink-0 space-y-3">
                            {/* Column header */}
                            <div className="flex items-center justify-between px-2">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-5 w-8 rounded" />
                            </div>
                            {/* Cards */}
                            {Array.from({ length: Math.floor(Math.random() * 3) + 2 }).map((_, j) => (
                                <Skeleton key={j} className="h-[90px] rounded-xl" />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
            <div className="mb-6 flex justify-between items-end flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold uppercase tracking-tight">Pipeline Board</h1>
                    <p className="text-sm text-slate-500 mt-2">Drag and drop leads to change stages</p>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-start min-h-0 scrollbar-pipeline">
                    {STAGE_ORDER.map(stage => (
                        <div key={stage} className="flex-shrink-0 w-[280px] flex flex-col max-h-full">
                            {/* Column Header */}
                            <div className="flex items-center justify-between mb-3 px-2 flex-shrink-0">
                                <span className="text-xs font-bold tracking-widest uppercase text-slate-400">
                                    {STAGE_LABELS[stage]}
                                </span>
                                <span className="text-[10px] font-bold bg-[#dcfc71] text-black rounded px-2 py-0.5">
                                    {board[stage].length}
                                </span>
                            </div>

                            {/* Droppable Column */}
                            <Droppable droppableId={stage}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={cn(
                                            'rounded-2xl px-3 pt-3 pb-6 transition-colors overflow-y-auto overflow-x-hidden border scrollbar-pipeline-col',
                                            snapshot.isDraggingOver
                                                ? 'bg-blue-600/5 border-blue-500/20'
                                                : 'bg-[#111111] border-white/5 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.5)]'
                                        )}
                                        style={{ minHeight: '150px' }}
                                    >
                                        {board[stage].map((lead, index) => (
                                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={cn(
                                                            'bg-[#181818] border border-white/5 rounded-xl p-4 mb-3',
                                                            'cursor-grab active:cursor-grabbing transition-shadow hover:border-white/10 relative group',
                                                            snapshot.isDragging && 'shadow-2xl shadow-black rotate-2 border-[#dcfc71]/30 z-50'
                                                        )}
                                                        onClick={(e) => {
                                                            // Prevents click when just dragging
                                                            if (e.defaultPrevented) return;
                                                            router.push(`/leads/${lead.id}`)
                                                        }}
                                                    >
                                                        <p className="text-white text-sm font-bold mb-1 truncate pr-6">
                                                            {lead.business_name}
                                                        </p>

                                                        {/* Optional hover open icon */}
                                                        <span className="material-symbols-outlined text-[16px] absolute top-4 right-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>

                                                        <p className="text-slate-500 text-xs mb-4 truncate flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-[14px]">person</span>
                                                            {lead.owner_name ?? 'Unknown owner'}
                                                        </p>

                                                        <div className="flex flex-wrap items-center justify-between gap-y-2 mt-auto pt-4 border-t border-white/5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center text-[10px] font-bold text-blue-400 border border-blue-500/30 shrink-0">
                                                                    {lead.profiles?.full_name?.charAt(0) || '?'}
                                                                </div>
                                                                <span className="text-slate-400 text-[10px] font-medium truncate max-w-[80px]">
                                                                    {lead.profiles?.full_name?.split(' ')[0]}
                                                                </span>
                                                            </div>
                                                            {lead.next_follow_up_at && (
                                                                <span className={cn(
                                                                    'text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider',
                                                                    isOverdue(lead.next_follow_up_at)
                                                                        ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                                        : 'bg-white/5 text-slate-400 border border-white/10'
                                                                )}>
                                                                    {format(new Date(lead.next_follow_up_at), 'MMM d')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    )
}
