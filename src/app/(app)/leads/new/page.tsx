'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface Profile {
    id: string
    full_name: string
}

interface ContactField {
    id: string
    label: string
    value: string
}

interface SocialLink {
    id: string
    platform: string
    url: string
}

export default function NewLeadPage() {
    const router = useRouter()
    const { profile: currentUser } = useCurrentUser()

    const [closers, setClosers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Form State
    const [businessName, setBusinessName] = useState('')
    const [assignedTo, setAssignedTo] = useState('')
    const [ownerName, setOwnerName] = useState('')
    const [emails, setEmails] = useState<ContactField[]>([])
    const [phones, setPhones] = useState<ContactField[]>([])
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')
    const [state, setStateText] = useState('')
    const [rating, setRating] = useState('')
    const [totalReviews, setTotalReviews] = useState('')
    const [clientType, setClientType] = useState('')
    const [leadSource, setLeadSource] = useState('')
    const [leadScore, setLeadScore] = useState('')
    const [painPoint, setPainPoint] = useState('')
    const [proposedSolution, setProposedSolution] = useState('')
    const [industry, setIndustry] = useState('')
    const [companySize, setCompanySize] = useState('')
    const [annualRevenue, setAnnualRevenue] = useState('')
    const [leadStatus, setLeadStatus] = useState('New')
    const [priority, setPriority] = useState('Medium')
    const [expectedCloseDate, setExpectedCloseDate] = useState('')
    const [clientBudget, setClientBudget] = useState('')
    const [quotedPrice, setQuotedPrice] = useState('')
    const [notes, setNotes] = useState('')

    useEffect(() => {
        const fetchClosers = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('role', 'closer')

            if (data) setClosers(data)
        }
        fetchClosers()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!businessName.trim()) return setError('Business name is required')
        if (!assignedTo) return setError('You must assign this lead to a closer')
        if (!currentUser) return setError('Not authenticated')

        setLoading(true)
        setError('')

        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .insert({
                business_name: businessName,
                owner_name: ownerName || null,
                emails: emails.length > 0 ? emails : null,
                phones: phones.length > 0 ? phones : null,
                social_links: socialLinks.length > 0 ? socialLinks : null,
                address: address || null,
                city: city || null,
                state: state || null,
                rating: rating ? parseFloat(rating) : null,
                total_reviews: totalReviews ? parseInt(totalReviews) : null,
                client_type: clientType || null,
                lead_source: leadSource || null,
                lead_score: leadScore ? parseInt(leadScore) : null,
                pain_point: painPoint || null,
                proposed_solution: proposedSolution || null,
                industry: industry || null,
                company_size: companySize || null,
                annual_revenue: annualRevenue || null,
                lead_status: leadStatus || null,
                priority: priority || null,
                expected_close_date: expectedCloseDate || null,
                client_budget: clientBudget ? parseFloat(clientBudget) : 0,
                quoted_price: quotedPrice ? parseFloat(quotedPrice) : 0,
                assigned_to: assignedTo,
                stage: 'new',
            })
            .select()
            .single()

        if (leadError || !lead) {
            setError(leadError?.message ?? 'Failed to create lead')
            setLoading(false)
            return
        }

        await supabase.from('activities').insert({
            lead_id: lead.id,
            user_id: currentUser.id,
            type: 'note',
            outcome: 'Lead created and assigned',
            notes: notes || null
        })

        router.push(`/leads/${lead.id}`)
    }

    const addEmail = () => setEmails([...emails, { id: crypto.randomUUID(), label: 'Work', value: '' }])
    const updateEmail = (id: string, field: keyof ContactField, val: string) => setEmails(emails.map(e => e.id === id ? { ...e, [field]: val } : e))
    const removeEmail = (id: string) => setEmails(emails.filter(e => e.id !== id))

    const addPhone = () => setPhones([...phones, { id: crypto.randomUUID(), label: 'Mobile', value: '' }])
    const updatePhone = (id: string, field: keyof ContactField, val: string) => setPhones(phones.map(p => p.id === id ? { ...p, [field]: val } : p))
    const removePhone = (id: string) => setPhones(phones.filter(p => p.id !== id))

    const addSocialLink = () => setSocialLinks([...socialLinks, { id: crypto.randomUUID(), platform: 'Website', url: '' }])
    const updateSocialLink = (id: string, field: keyof SocialLink, val: string) => setSocialLinks(socialLinks.map(s => s.id === id ? { ...s, [field]: val } : s))
    const removeSocialLink = (id: string) => setSocialLinks(socialLinks.filter(s => s.id !== id))


    const inputClass = "w-full bg-[#181818] border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#dcfc71] focus:ring-1 focus:ring-[#dcfc71] transition-colors"
    const labelClass = "block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2"

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight uppercase">Add New Lead</h1>
                <p className="text-sm text-zinc-500 mt-2">Enter the details below to create a new lead in the system.</p>
            </div>

            <div className="bg-[#111111] border border-white/5 rounded-[32px] p-8 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.5)]">
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 border-b border-white/5 pb-4 mb-8">Lead Information</h2>

                {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={`${labelClass} flex items-center gap-1`}>
                                Business Name <span className="text-[#dcfc71]">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={businessName}
                                onChange={e => setBusinessName(e.target.value)}
                                className={inputClass}
                                placeholder="e.g. Acme Corporation"
                            />
                        </div>

                        <div>
                            <label className={`${labelClass} flex items-center gap-1`}>
                                Assigned To (Closer) <span className="text-[#dcfc71]">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    required
                                    value={assignedTo}
                                    onChange={e => setAssignedTo(e.target.value)}
                                    className={`${inputClass} appearance-none cursor-pointer pr-10`}
                                >
                                    <option value="" disabled>Select Closer</option>
                                    {closers.map(c => (
                                        <option key={c.id} value={c.id}>{c.full_name}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">expand_more</span>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Owner Name</label>
                            <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} className={inputClass} placeholder="e.g. John Doe" />
                        </div>

                        {/* Dynamic Emails */}
                        <div className="md:col-span-2">
                            <div className="flex items-center justify-between mb-2">
                                <label className={labelClass}>Email Addresses</label>
                                <button type="button" onClick={addEmail} className="text-[#dcfc71] hover:text-[#c4e650] text-xs font-bold uppercase tracking-widest flex items-center gap-1 transition-colors">
                                    <span className="material-symbols-outlined text-[14px]">add</span> Add Email
                                </button>
                            </div>
                            <div className="space-y-3">
                                {emails.map(email => (
                                    <div key={email.id} className="flex gap-2">
                                        <select value={email.label} onChange={e => updateEmail(email.id, 'label', e.target.value)} className={`${inputClass} w-1/3 lg:w-1/4`}>
                                            <option value="Work">Work</option>
                                            <option value="Personal">Personal</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <input type="email" value={email.value} onChange={e => updateEmail(email.id, 'value', e.target.value)} className={`${inputClass} flex-1`} placeholder="example@domain.com" />
                                        <button type="button" onClick={() => removeEmail(email.id)} className="shrink-0 bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 rounded-xl transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                ))}
                                {emails.length === 0 && <p className="text-xs text-zinc-600 italic">No email addresses added.</p>}
                            </div>
                        </div>

                        {/* Dynamic Phones */}
                        <div className="md:col-span-2">
                            <div className="flex items-center justify-between mb-2">
                                <label className={labelClass}>Phone Numbers</label>
                                <button type="button" onClick={addPhone} className="text-[#dcfc71] hover:text-[#c4e650] text-xs font-bold uppercase tracking-widest flex items-center gap-1 transition-colors">
                                    <span className="material-symbols-outlined text-[14px]">add</span> Add Phone
                                </button>
                            </div>
                            <div className="space-y-3">
                                {phones.map(phone => (
                                    <div key={phone.id} className="flex gap-2">
                                        <select value={phone.label} onChange={e => updatePhone(phone.id, 'label', e.target.value)} className={`${inputClass} w-1/3 lg:w-1/4`}>
                                            <option value="Mobile">Mobile</option>
                                            <option value="Office">Office</option>
                                            <option value="Home">Home</option>
                                            <option value="Fax">Fax</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <input type="tel" value={phone.value} onChange={e => updatePhone(phone.id, 'value', e.target.value)} className={`${inputClass} flex-1`} placeholder="(555) 123-4567" />
                                        <button type="button" onClick={() => removePhone(phone.id)} className="shrink-0 bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 rounded-xl transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                ))}
                                {phones.length === 0 && <p className="text-xs text-zinc-600 italic">No phone numbers added.</p>}
                            </div>
                        </div>

                        {/* Dynamic Social Links */}
                        <div className="md:col-span-2">
                            <div className="flex items-center justify-between mb-2">
                                <label className={labelClass}>Web & Social Links</label>
                                <button type="button" onClick={addSocialLink} className="text-[#dcfc71] hover:text-[#c4e650] text-xs font-bold uppercase tracking-widest flex items-center gap-1 transition-colors">
                                    <span className="material-symbols-outlined text-[14px]">add</span> Add Link
                                </button>
                            </div>
                            <div className="space-y-3">
                                {socialLinks.map(link => (
                                    <div key={link.id} className="flex gap-2">
                                        <select value={link.platform} onChange={e => updateSocialLink(link.id, 'platform', e.target.value)} className={`${inputClass} w-1/3 lg:w-1/4`}>
                                            <option value="Website">Website</option>
                                            <option value="LinkedIn">LinkedIn</option>
                                            <option value="Twitter">Twitter/X</option>
                                            <option value="Facebook">Facebook</option>
                                            <option value="Instagram">Instagram</option>
                                            <option value="Yelp">Yelp</option>
                                            <option value="Google Maps">Google Maps</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <input type="url" value={link.url} onChange={e => updateSocialLink(link.id, 'url', e.target.value)} className={`${inputClass} flex-1`} placeholder="https://..." />
                                        <button type="button" onClick={() => removeSocialLink(link.id)} className="shrink-0 bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 rounded-xl transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                ))}
                                {socialLinks.length === 0 && <p className="text-xs text-zinc-600 italic">No web or social links added.</p>}
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClass}>Address</label>
                            <input type="text" value={address} onChange={e => setAddress(e.target.value)} className={inputClass} placeholder="123 Business Rd, Suite 100" />
                        </div>

                        <div>
                            <label className={labelClass}>City</label>
                            <input type="text" value={city} onChange={e => setCity(e.target.value)} className={inputClass} placeholder="e.g. New York" />
                        </div>

                        <div>
                            <label className={labelClass}>State / Province</label>
                            <input type="text" value={state} onChange={e => setStateText(e.target.value)} className={inputClass} placeholder="e.g. NY" />
                        </div>

                        <div>
                            <label className={labelClass}>Rating</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                value={rating}
                                onChange={e => setRating(e.target.value)}
                                className={inputClass}
                                placeholder="0.0 - 5.0"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Total Reviews</label>
                            <input type="number" value={totalReviews} onChange={e => setTotalReviews(e.target.value)} className={inputClass} placeholder="0" />
                        </div>

                        <div>
                            <label className={labelClass}>Client Type</label>
                            <div className="relative">
                                <select value={clientType} onChange={e => setClientType(e.target.value)} className={`${inputClass} appearance-none cursor-pointer pr-10`}>
                                    <option value="">Select Type</option>
                                    <option value="b2b">B2B</option>
                                    <option value="b2c">B2C</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">expand_more</span>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Lead Source</label>
                            <div className="relative">
                                <select value={leadSource} onChange={e => setLeadSource(e.target.value)} className={`${inputClass} appearance-none cursor-pointer pr-10`}>
                                    <option value="">Select Source</option>
                                    <option value="organic">Organic Search</option>
                                    <option value="social">Social Media</option>
                                    <option value="referral">Referral</option>
                                    <option value="outbound">Outbound</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">expand_more</span>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Lead Score</label>
                            <input type="number" min="0" max="100" value={leadScore} onChange={e => setLeadScore(e.target.value)} className={inputClass} placeholder="0 - 100" />
                        </div>

                        {/* ===== FIRMOGRAPHICS ===== */}
                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-white/5 pb-2 mb-4">Firmographics</h3>
                        </div>
                        <div>
                            <label className={labelClass}>Industry</label>
                            <div className="relative">
                                <select value={industry} onChange={e => setIndustry(e.target.value)} className={`${inputClass} appearance-none cursor-pointer pr-10`}>
                                    <option value="">Select Industry</option>
                                    <option value="Healthcare">Healthcare</option>
                                    <option value="Real Estate">Real Estate</option>
                                    <option value="Technology">Technology</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Retail">Retail</option>
                                    <option value="Construction">Construction</option>
                                    <option value="Manufacturing">Manufacturing</option>
                                    <option value="Education">Education</option>
                                    <option value="Other">Other</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">expand_more</span>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Company Size</label>
                            <div className="relative">
                                <select value={companySize} onChange={e => setCompanySize(e.target.value)} className={`${inputClass} appearance-none cursor-pointer pr-10`}>
                                    <option value="">Select Size</option>
                                    <option value="1-10">1-10 employees</option>
                                    <option value="11-50">11-50 employees</option>
                                    <option value="51-200">51-200 employees</option>
                                    <option value="201-500">201-500 employees</option>
                                    <option value="501+">501+ employees</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">expand_more</span>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Annual Revenue</label>
                            <div className="relative">
                                <select value={annualRevenue} onChange={e => setAnnualRevenue(e.target.value)} className={`${inputClass} appearance-none cursor-pointer pr-10`}>
                                    <option value="">Select Revenue Range</option>
                                    <option value="<$1M">&lt; $1M</option>
                                    <option value="$1M-$5M">$1M - $5M</option>
                                    <option value="$5M-$10M">$5M - $10M</option>
                                    <option value="$10M-$50M">$10M - $50M</option>
                                    <option value="$50M+">$50M+</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">expand_more</span>
                            </div>
                        </div>

                        {/* ===== DEAL QUALIFICATION ===== */}
                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-white/5 pb-2 mb-4">Qualification & Deal Info</h3>
                        </div>

                        <div>
                            <label className={labelClass}>Lead Status</label>
                            <div className="relative">
                                <select value={leadStatus} onChange={e => setLeadStatus(e.target.value)} className={`${inputClass} appearance-none cursor-pointer pr-10`}>
                                    <option value="New">New</option>
                                    <option value="Engaged">Engaged</option>
                                    <option value="Qualified">Qualified</option>
                                    <option value="Unqualified">Unqualified</option>
                                    <option value="Nurturing">Nurturing</option>
                                    <option value="Dropped">Dropped</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">expand_more</span>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Priority</label>
                            <div className="relative">
                                <select value={priority} onChange={e => setPriority(e.target.value)} className={`${inputClass} appearance-none cursor-pointer pr-10`}>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">expand_more</span>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Expected Close Date</label>
                            <input
                                type="date"
                                value={expectedCloseDate}
                                onChange={e => setExpectedCloseDate(e.target.value)}
                                className={`${inputClass} [&::-webkit-calendar-picker-indicator]:invert-[0.6]`}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Client Budget ($)</label>
                            <input type="number" min="0" step="100" value={clientBudget} onChange={e => setClientBudget(e.target.value)} className={inputClass} placeholder="0" />
                        </div>

                        <div>
                            <label className={labelClass}>Quoted Price ($)</label>
                            <input type="number" min="0" step="100" value={quotedPrice} onChange={e => setQuotedPrice(e.target.value)} className={inputClass} placeholder="0" />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClass}>Pain Point</label>
                            <textarea value={painPoint} onChange={e => setPainPoint(e.target.value)} className={`${inputClass} resize-none h-24`} placeholder="Briefly describe the client's main challenges..."></textarea>
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClass}>Proposed Solution</label>
                            <textarea value={proposedSolution} onChange={e => setProposedSolution(e.target.value)} className={`${inputClass} resize-none h-24`} placeholder="Describe how our product/service solves their challenge..."></textarea>
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClass}>Initial Notes</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} className={`${inputClass} resize-none h-24`} placeholder="Add any operational notes here..."></textarea>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-[#dcfc71] text-black rounded-xl text-sm font-bold uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-sm">add_circle</span>
                            {loading ? 'Creating...' : 'Create Lead'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
