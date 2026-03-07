'use client'
import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'
import type { Profile } from '@/types'

interface FullProfile extends Profile {
    email?: string | null
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<FullProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Form states
    const [fullName, setFullName] = useState('')
    const [city, setCity] = useState('')
    const [phone, setPhone] = useState('')

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/profile')
                if (!res.ok) throw new Error('Failed to load profile')
                const data = await res.json()
                setProfile(data)
                setFullName(data.full_name || '')
                setCity(data.city || '')
                setPhone(data.phone || '')
            } catch (err) {
                console.error(err)
                toast.error('Could not load profile data.')
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: fullName, city, phone }),
            })
            if (!res.ok) throw new Error('Failed to update profile')
            toast.success('Profile updated successfully!')
        } catch (err: any) {
            toast.error(err.message || 'Error saving profile.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <Skeleton className="h-40 w-full rounded-[32px]" />
            </div>
        )
    }

    if (!profile) return null

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
            <div className="flex items-end gap-6 border-b border-white/5 pb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#d9ff54] to-white p-1 shrink-0 shadow-2xl shadow-[#d9ff54]/10">
                    <div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">
                            {fullName.substring(0, 2).toUpperCase() || 'U'}
                        </span>
                    </div>
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">{fullName || 'Your Profile'}</h1>
                    <p className="text-sm font-medium text-[#d9ff54] tracking-widest uppercase mt-1 drop-shadow-[0_0_8px_rgba(217,255,84,0.3)]">
                        {profile.role}
                    </p>
                </div>
            </div>

            <div className="bg-[#121212] rounded-[32px] border border-white/5 p-8 shadow-2xl">
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-white mb-2">Personal Information</h2>
                    <p className="text-sm text-slate-500">Update your contact details and location.</p>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Read-only fields */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={profile.email || ''}
                            readOnly
                            disabled
                            className="w-full bg-white/5 border border-transparent text-slate-500 rounded-2xl px-5 py-3 text-sm outline-none cursor-not-allowed"
                            title="Contact your administrator to change your email."
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                            Job Role
                        </label>
                        <input
                            type="text"
                            value={profile.role.toUpperCase()}
                            readOnly
                            disabled
                            className="w-full bg-white/5 border border-transparent text-slate-500 rounded-2xl px-5 py-3 text-sm outline-none cursor-not-allowed font-bold"
                            title="Contact your administrator to change your role."
                        />
                    </div>

                    {/* Editable fields */}
                    <div className="md:col-span-2 border-t border-white/5 pt-8 mt-2" />

                    <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-2" htmlFor="fullName">
                            Full Name
                        </label>
                        <input
                            id="fullName"
                            type="text"
                            required
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full bg-black/40 border border-white/10 text-white rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-[#d9ff54] transition-all outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-2" htmlFor="phone">
                            Phone Number
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="+1 (555) 000-0000"
                            className="w-full bg-black/40 border border-white/10 text-white rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-[#d9ff54] transition-all outline-none"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-2" htmlFor="city">
                            City / Location
                        </label>
                        <input
                            id="city"
                            type="text"
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            placeholder="New York, NY"
                            className="w-full bg-black/40 border border-white/10 text-white rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-[#d9ff54] transition-all outline-none"
                        />
                    </div>

                    <div className="md:col-span-2 pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-[#d9ff54] hover:brightness-110 disabled:opacity-60 text-black font-bold flex items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-sm transition-all shadow-lg shadow-[#d9ff54]/20 outline-none"
                        >
                            {saving ? (
                                <>
                                    <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[20px]">save</span>
                                    Save Profile
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
