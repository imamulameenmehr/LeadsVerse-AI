'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Skeleton } from '@/components/ui/Skeleton'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

type Role = 'admin' | 'closer' | 'extractor'

interface TeamMember {
    id: string
    full_name: string
    email: string | null
    role: Role
    created_at: string
}

export default function SettingsPage() {
    const router = useRouter()
    const { profile: currentUser, loading: userLoading } = useCurrentUser()

    const [team, setTeam] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)

    // Invite form
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState<'closer' | 'extractor'>('closer')
    const [inviting, setInviting] = useState(false)
    const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    // Redirect non-admins
    useEffect(() => {
        if (!userLoading && currentUser && currentUser.role !== 'admin') {
            router.replace('/dashboard')
        }
    }, [currentUser, userLoading, router])

    const fetchTeam = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/team')
            if (!res.ok) throw new Error('Failed to fetch team')
            const data = await res.json()
            setTeam(data as TeamMember[])
        } catch (err) {
            console.error('Team fetch error:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (currentUser?.role === 'admin') fetchTeam()
    }, [currentUser, fetchTeam])

    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [userToDelete, setUserToDelete] = useState<TeamMember | null>(null)

    const updateRole = async (userId: string, newRole: Role) => {
        // Optimistic update
        setTeam(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m))
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            })
            if (!res.ok) throw new Error('Failed to update role')
            toast.success('Team member role updated')
        } catch (err: any) {
            toast.error(err.message || 'Failed to update user role')
            // Revert to real state on failure
            fetchTeam()
        }
    }

    const confirmDelete = async () => {
        if (!userToDelete) return
        setDeletingId(userToDelete.id)
        try {
            const res = await fetch(`/api/admin/users/${userToDelete.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete user')
            setTeam(prev => prev.filter(m => m.id !== userToDelete.id))
            toast.success(`${userToDelete.full_name} has been removed from the team`)
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete user.')
        } finally {
            setDeletingId(null)
            setUserToDelete(null)
        }
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setInviting(true)
        setInviteMsg(null)
        try {
            const res = await fetch('/api/admin/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail, full_name: inviteEmail.split('@')[0], role: inviteRole }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed')
            setInviteMsg({ type: 'success', text: 'Invitation sent successfully!' })
            toast.success('Invitation email sent!')
            setInviteEmail('')
            setInviteRole('closer')
        } catch (err: any) {
            setInviteMsg({ type: 'error', text: err.message })
            toast.error(err.message)
        } finally {
            setInviting(false)
        }
    }

    const initials = (name: string) =>
        name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    if (userLoading) {
        return (
            <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-8 space-y-4 bg-[#121212] rounded-[32px] border border-white/5 p-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
                            <Skeleton className="h-4 flex-1" />
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-7 w-24 rounded-xl" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    ))}
                </div>
                <div className="xl:col-span-4">
                    <Skeleton className="h-[340px] rounded-[32px]" />
                </div>
            </div>
        )
    }

    if (currentUser?.role !== 'admin') return null

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8">

            {/* ── LEFT: Team Members Table ── */}
            <div className="xl:col-span-8 space-y-6">
                <div className="bg-[#121212] rounded-[32px] border border-white/5 p-2 shadow-2xl">
                    <div className="p-6 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-white">
                            Team Members{' '}
                            <span className="ml-2 text-xs font-normal text-slate-500 bg-white/5 px-2 py-1 rounded-full">
                                {team.length} total
                            </span>
                        </h2>
                        <div className="flex gap-2">
                            <button className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all">
                                <span className="material-symbols-outlined text-[20px]">filter_list</span>
                            </button>
                            <button className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all">
                                <span className="material-symbols-outlined text-[20px]">download</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto px-4 pb-4">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-500">
                                    <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-[0.1em]">Member</th>
                                    <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-[0.1em]">Email</th>
                                    <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-[0.1em]">Role</th>
                                    <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-[0.1em]">Joined</th>
                                    <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-[0.1em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i} className="border-t border-white/5">
                                            {[140, 160, 100, 80, 40].map((w, j) => (
                                                <td key={j} className="px-4 py-5">
                                                    <Skeleton className={`h-4 w-[${w}px]`} />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : team.map(member => {
                                    const isSelf = member.id === currentUser.id
                                    return (
                                        <tr key={member.id} className="group hover:bg-white/[0.02] transition-all">
                                            <td className="px-4 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-2xl bg-[#ff9d42]/10 border border-[#ff9d42]/20 flex items-center justify-center text-[#ff9d42] text-sm font-bold">
                                                            {initials(member.full_name)}
                                                        </div>
                                                        {isSelf && (
                                                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-[#121212] rounded-full" />
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-semibold text-white">{member.full_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5 text-sm text-slate-400">{member.email || '—'}</td>
                                            <td className="px-4 py-5">
                                                {member.role === 'admin' ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                                                        Admin
                                                    </span>
                                                ) : (
                                                    <div className="relative w-max">
                                                        <select
                                                            value={member.role}
                                                            onChange={e => updateRole(member.id, e.target.value as Role)}
                                                            className="bg-black/50 border border-white/10 text-slate-300 rounded-xl pl-3 pr-8 py-1.5 text-xs focus:ring-1 focus:ring-[#d9ff54] appearance-none cursor-pointer hover:border-white/20 transition-all outline-none"
                                                        >
                                                            <option value="closer">Closer</option>
                                                            <option value="extractor">Extractor</option>
                                                        </select>
                                                        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-[16px] pointer-events-none">expand_more</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-5 text-sm text-slate-500">
                                                {format(new Date(member.created_at), 'MMM dd, yyyy')}
                                            </td>
                                            <td className="px-4 py-5 text-right">
                                                {isSelf ? (
                                                    <button className="text-slate-600 hover:text-white transition-all">
                                                        <span className="material-symbols-outlined">more_horiz</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setUserToDelete(member)}
                                                        disabled={deletingId === member.id}
                                                        className="text-slate-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                                    >
                                                        {deletingId === member.id ? (
                                                            <div className="w-5 h-5 rounded-full border-2 border-red-500/20 border-t-red-500 animate-spin" />
                                                        ) : (
                                                            <span className="material-symbols-outlined">delete_outline</span>
                                                        )}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── RIGHT: Invite + Role Capabilities ── */}
            <div className="xl:col-span-4 space-y-6">

                {/* Invite Form Card */}
                <div className="bg-[#121212] rounded-[32px] border border-white/5 p-8 shadow-2xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-[#d9ff54]/10 border border-[#d9ff54]/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#d9ff54]">person_add</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Invite Member</h2>
                            <p className="text-xs text-slate-500">Add people to your project</p>
                        </div>
                    </div>

                    {inviteMsg && (
                        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${inviteMsg.type === 'success' ? 'bg-green-900/20 border border-green-800/50 text-green-400' : 'bg-red-900/20 border border-red-800/50 text-red-400'}`}>
                            {inviteMsg.text}
                        </div>
                    )}

                    <form onSubmit={handleInvite} className="space-y-6">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2" htmlFor="invite-email">
                                Email Address
                            </label>
                            <input
                                id="invite-email"
                                required
                                type="email"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                placeholder="colleague@example.com"
                                className="w-full bg-black/40 border border-white/10 text-white rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-[#d9ff54] placeholder:text-slate-700 transition-all outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2" htmlFor="invite-role">
                                Select Role
                            </label>
                            <div className="relative">
                                <select
                                    id="invite-role"
                                    value={inviteRole}
                                    onChange={e => setInviteRole(e.target.value as 'closer' | 'extractor')}
                                    className="w-full bg-black/40 border border-white/10 text-white rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-[#d9ff54] appearance-none cursor-pointer transition-all outline-none"
                                >
                                    <option value="closer">Closer (Sales Representative)</option>
                                    <option value="extractor">Extractor (Lead Sourcing)</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">expand_more</span>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={inviting}
                            className="w-full bg-[#d9ff54] hover:brightness-110 disabled:opacity-60 text-black font-bold rounded-2xl px-6 py-4 text-sm transition-all flex items-center justify-center gap-2 group"
                        >
                            {inviting ? (
                                <>
                                    <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                                    Sending…
                                </>
                            ) : (
                                <>
                                    <span>Send Invitation</span>
                                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>
                    <p className="text-[10px] text-slate-600 mt-6 text-center italic">
                        Administrators can only be promoted from existing workspace members.
                    </p>
                </div>

                {/* Role Capabilities Card */}
                <div className="bg-white/[0.02] rounded-[32px] border border-white/5 p-8">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Role Capabilities</h3>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-purple-400 text-[18px]">admin_panel_settings</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white mb-1">Administrator</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">Unrestricted access to all data, team management, and billing settings.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-xl bg-[#ff9d42]/10 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[#ff9d42] text-[18px]">support_agent</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white mb-1">Closer</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">Manage assigned leads, update pipeline stages, and log meeting activities.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-green-400 text-[18px]">person_search</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white mb-1">Extractor</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">Research and import new prospects. View access limited to lead lists.</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <ConfirmModal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={confirmDelete}
                title="Remove Team Member"
                description={`Are you sure you want to permanently remove ${userToDelete?.full_name} from the CRM? Their tracked activities and leads will be preserved automatically.`}
                confirmText="Yes, remove user"
                cancelText="Cancel"
                isDestructive={true}
                isLoading={deletingId !== null}
            />
        </div>
    )
}
