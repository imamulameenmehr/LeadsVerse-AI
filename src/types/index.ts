export type Role = 'admin' | 'closer' | 'extractor'

export type Stage =
    | 'new'
    | 'contacted'
    | 'decision_maker'
    | 'interested'
    | 'demo_scheduled'
    | 'proposal_sent'
    | 'closed_won'
    | 'closed_lost'

export type ActivityType =
    | 'call'
    | 'sms'
    | 'email'
    | 'note'
    | 'stage_change'
    | 'whatsapp'
    | 'instagram_dm'
    | 'linkedin_dm'
    | 'facebook_dm'
    | 'twitter_dm'
    | 'tiktok_dm'
    | 'meeting'
    | 'demo'
    | 'voicemail'
    | 'no_answer'
    | 'follow_up'

export interface Profile {
    id: string
    full_name: string
    role: Role
    created_at: string
    city?: string | null
    phone?: string | null
}

export interface ContactField {
    id: string
    label: string
    value: string
}

export interface SocialLink {
    id: string
    platform: string
    url: string
}

export interface Lead {
    id: string
    business_name: string
    owner_name: string | null
    emails?: ContactField[] | null
    phones?: ContactField[] | null
    social_links?: SocialLink[] | null
    city: string | null
    state: string | null
    address: string | null
    rating: number | null
    total_reviews: number | null
    client_type: string | null
    lead_source: string | null
    lead_score: number
    pain_point: string | null
    notes: string | null
    assigned_to: string | null
    stage: Stage
    industry: string | null
    company_size: string | null
    annual_revenue: string | null
    lead_status: string | null
    priority: string | null
    expected_close_date: string | null
    proposed_solution: string | null
    quoted_price: number
    client_budget: number
    probability_percent: number
    expected_mrr: number
    created_at: string
    updated_at: string
    last_activity_at: string | null
    next_follow_up_at: string | null
    profiles?: Profile
}

export interface Activity {
    id: string
    lead_id: string
    user_id: string
    type: ActivityType
    outcome: string | null
    follow_up_date: string | null
    created_at: string
    profiles?: Profile
    leads?: Pick<Lead, 'business_name'>
}

export interface OutreachMessages {
    email: string
    whatsapp: string
    instagram_dm: string
    linkedin_dm: string
}
