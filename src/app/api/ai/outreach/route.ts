import { GoogleGenerativeAI } from '@google/generative-ai'
import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// R&B GROUP KNOWLEDGE BASE — Injected into every AI outreach call
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const RB_GROUP_KNOWLEDGE = `
ABOUT US — R&B Group (Raees & Brothers)
Founded in 2021, Multan, Pakistan. Operating globally for US/UK clients.
Website: rbgroup.com.pk
Tagline: "Engineering the Future."
Mission: We liberate businesses from robotic, repetitive work using Elite Engineering + AI.
Identity: We are NOT a freelancer marketplace. We are a high-performance Automation & Software Engineering House. Every project is delivered by in-house partners. Zero outsourcing. 100% transparency.

OUR SERVICES (What We Sell):

A. WordPress Ecosystem
- Full-Stack Web: Design, Development, Maintenance, Technical Support
- Infrastructure: Domain registration + exclusive high-performance hosting (reserved only for clients)
- The Edge: "Total Package" — from first line of code to the server it runs on

B. AI & Automation
- AI Calling Agents: Inbound/Outbound agents (Retell AI, Vapi) — sound human, book appointments 24/7
- Business Flow Automation: Connect apps businesses already use (GHL, n8n, Make.com, Zapier) — automate emails, lead routing, content creation
- ROI: Our AI costs 70% LESS than a human receptionist and NEVER misses a call

PRICING (AI Calling / Any industry Model — Recurring):
- STARTER: $1,500/mo — 800 min/mo, 1 concurrent call (best for after-hours coverage)
- STANDARD: $2,800/mo — 1,600 min/mo, 2 concurrent calls (best for staff reduction)
- PRO/ADVANCE: $5,000/mo — 3,000 min/mo, 5 concurrent calls (total replacement)

One-Time Projects:
- Simple bots/automations: $100–$500
- CRM + Workflow setups: $500–$1,500
- Enterprise/complex systems: $1,500–$5,000+

IDEAL CLIENT (Target Avatar):
- US-based Clinics, Real Estate Firms, Solar Companies
- PAIN POINT: Missing calls, losing leads to slow follow-ups, spending too much on receptionists
- OUR SOLUTION: AI that never sleeps, never misses a call, costs 70% less than a human

WHY WE ARE DIFFERENT:
- Zero outsourcing — every line built in-house
- 100% transparent — real people, real relationships
- Legacy over quick cash — we turn down bad-fit clients
- We don't sell tools — we deploy engineering systems that save thousands in labor
`

export async function POST(req: NextRequest) {
    try {
        const { leadId } = await req.json()
        if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 })

        // Auth check — only authenticated users
        const supabase = await createServerSupabase()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Fetch full lead data
        const { data: lead, error } = await supabase
            .from('leads')
            .select(`
        business_name, owner_name, city, state, 
        client_type, pain_point, rating, total_reviews,
        proposed_solution, lead_source, lead_score, stage, notes,
        emails, phones, social_links,
        industry, company_size, annual_revenue, 
        lead_status, priority, expected_close_date, 
        client_budget, quoted_price
      `)
            .eq('id', leadId)
            .single()

        if (error || !lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
        }

        // Determine most relevant R&B service based on lead data
        const businessType = (lead.client_type || '').toLowerCase()
        const painPoint = (lead.pain_point || '').toLowerCase()
        const proposedSolution = lead.proposed_solution || ''

        let primaryService = 'AI Calling Agents & Business Automation'
        let specificPitch = 'an AI system that handles your inbound calls, books appointments, and follows up with leads automatically — 24/7, at 70% less cost than a human.'

        if (businessType.includes('clinic') || businessType.includes('health') || businessType.includes('dental') || businessType.includes('medical')) {
            primaryService = 'AI Calling Agent for Clinics'
            specificPitch = 'an AI receptionist that answers every patient call, books appointments automatically, and handles after-hours inquiries — starting at $1,500/mo. No more missed calls = no more missed revenue.'
        } else if (businessType.includes('real estate') || businessType.includes('realty') || businessType.includes('realtor')) {
            primaryService = 'AI Lead Follow-Up System for Real Estate'
            specificPitch = 'an AI system that instantly follows up with every new property inquiry, qualifies leads, and books viewings directly in your calendar — while your team focuses on closing.'
        } else if (businessType.includes('solar') || businessType.includes('energy')) {
            primaryService = 'AI Outbound Caller for Solar Lead Conversion'
            specificPitch = 'an AI agent that follows up with every solar lead within seconds, qualifies them on the call, and books consultations automatically — dramatically improving your cost-per-acquisition.'
        } else if (businessType.includes('web') || businessType.includes('agency') || businessType.includes('marketing')) {
            primaryService = 'Full-Stack Web Development + Automation'
            specificPitch = 'a full-stack web solution — from a high-performance WordPress site on our private hosting to automated lead capture and CRM workflows that run while you sleep.'
        }

        if (proposedSolution) {
            specificPitch = proposedSolution
        }

        // Build the master prompt
        const prompt = `
You are a world-class, value-first B2B outreach specialist working for R&B Group.
Your job is NOT to write marketing fluff. You write messages that PROVE VALUE immediately.

COMPANY KNOWLEDGE:
${RB_GROUP_KNOWLEDGE}

LEAD DATA:
- Business Name: ${lead.business_name}
- Owner/Contact: ${lead.owner_name ?? 'Not specified'}
- Location: ${[lead.city, lead.state].filter(Boolean).join(', ') || 'US-based'}
- Business Type: ${lead.client_type ?? 'Local business'}
- Industry: ${lead.industry ?? 'Not specified'}
- Company Size: ${lead.company_size ?? 'Not specified'}
- Annual Revenue: ${lead.annual_revenue ?? 'Not specified'}
- Google Rating: ${lead.rating ?? 'N/A'} stars (${lead.total_reviews ?? 0} reviews)
- Identified Pain Point: ${lead.pain_point ?? 'Missing leads and slow follow-ups'}
- Our Proposed Solution for this lead: ${specificPitch}
- CRM Lead Status: ${lead.lead_status ?? 'New'}
- Priority Level: ${lead.priority ?? 'Medium'}
${lead.client_budget ? `- Client Budget: $${lead.client_budget}` : ''}
${lead.quoted_price ? `- Quoted Price: $${lead.quoted_price}` : ''}
- Found Via: ${lead.lead_source ?? 'Prospecting'}
${lead.notes ? `- Internal Notes: ${lead.notes}` : ''}

PRIMARY SERVICE TO PITCH: ${primaryService}

WRITING RULES — FOLLOW THESE EXACTLY:
1. Write as a SOLUTION PROVIDER, not a marketer. Open with a genuine observation about their business or industry context.
2. Start EVERY message with a personalized hook — mention their business name, location, rating, or specific situation. USE the Industry and Company Size if relevant.
3. Prove value immediately. Tell them WHAT PROBLEM WE SOLVE and HOW, not just what we sell.
4. If a 'Proposed Solution' is provided, pivot the entire message around that exact solution.
5. Be conversational and direct. No corporate buzzwords. Write like a real person.
6. NO generic phrases like "I hope this message finds you well" or "I wanted to reach out."
7. Maximum 120 words per message. Be tight.
8. End with ONE low-friction CTA (e.g. "Open to a 10-minute call this week?")
9. For email: include a compelling subject line. Format: "Subject: [subject]\\n\\n[body]"
10. Each platform has a different tone:
   - EMAIL: slightly formal, professional, uses the full business name
   - WHATSAPP: conversational, casual, like texting a business contact
   - INSTAGRAM DM: friendly, brief, references something visual about their business/profile if possible
   - LINKEDIN DM: professional peer-to-peer, reference their role/title or industry context

Return ONLY valid JSON, no markdown, no code blocks, no explanations:
{
  "email": "Subject: [subject]\\n\\n[body]",
  "whatsapp": "...",
  "instagram_dm": "...",
  "linkedin_dm": "..."
}
    `

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                temperature: 0.85,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        })

        const result = await model.generateContent(prompt)
        const text = result.response.text()

        // Strip markdown code blocks if Gemini adds them
        const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(clean)

        return NextResponse.json(parsed)
    } catch (err) {
        console.error('AI outreach error:', err)
        return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
    }
}
