import { Stage } from '@/types'

export const STAGE_LABELS: Record<Stage, string> = {
    new: 'New',
    contacted: 'Contacted',
    decision_maker: 'Decision Maker',
    interested: 'Interested',
    demo_scheduled: 'Demo Scheduled',
    proposal_sent: 'Proposal Sent',
    closed_won: 'Won',
    closed_lost: 'Lost',
}

export const STAGE_BADGE_STYLES: Record<Stage, string> = {
    new: 'bg-slate-700 text-slate-200',
    contacted: 'bg-blue-900 text-blue-300',
    decision_maker: 'bg-purple-900 text-purple-300',
    interested: 'bg-yellow-900 text-yellow-300',
    demo_scheduled: 'bg-indigo-900 text-indigo-300',
    proposal_sent: 'bg-orange-900 text-orange-300',
    closed_won: 'bg-green-900 text-green-300',
    closed_lost: 'bg-red-900 text-red-300',
}

export const STAGE_ORDER: Stage[] = [
    'new',
    'contacted',
    'decision_maker',
    'interested',
    'demo_scheduled',
    'proposal_sent',
    'closed_won',
    'closed_lost',
]
