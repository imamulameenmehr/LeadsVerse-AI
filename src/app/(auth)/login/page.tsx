'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

type Mode = 'login' | 'set-password'

export default function LoginPage() {
    const router = useRouter()
    const [mode, setMode] = useState<Mode>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    // On mount: detect Supabase invite hash in the URL
    useEffect(() => {
        const hash = window.location.hash
        if (!hash) return

        const params = new URLSearchParams(hash.slice(1)) // remove leading '#'
        const type = params.get('type')
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (type === 'invite' && accessToken && refreshToken) {
            // Set the session so the user is authenticated
            supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
                .then(() => {
                    // Clear hash from URL without reload
                    window.history.replaceState(null, '', window.location.pathname)
                    setMode('set-password')
                })
        }
    }, [])

    // ── Regular login ──
    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        setLoading(true)
        setError('')
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            setError('Invalid credentials. Please try again.')
            setLoading(false)
            return
        }
        router.push('/dashboard')
    }

    // ── Set password (invite flow) ──
    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirm) {
            setError('Passwords do not match.')
            return
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters.')
            return
        }
        setLoading(true)
        setError('')
        const { error } = await supabase.auth.updateUser({ password })
        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }
        setSuccess(true)
        // Force a hard reload — router.push doesn't work when already on /login
        setTimeout(async () => {
            await supabase.auth.signOut()
            window.location.href = '/login'
        }, 2000)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleLogin()
    }

    // ── Background blobs (shared) ──
    const Blobs = () => (
        <div className="fixed inset-0 z-0 bg-[#09090b] pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/30 rounded-full blur-[80px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-950/40 rounded-full blur-[80px]" />
            <div className="absolute top-1/4 left-1/3 w-[40%] h-[40%] bg-slate-900/50 rounded-full blur-[80px]" />
            <div className="absolute top-1/2 right-1/4 w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[80px]" />
        </div>
    )

    // ── Card header (shared) ──
    const CardHeader = ({ subtitle }: { subtitle: string }) => (
        <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2 text-white">
                <span className="material-symbols-outlined text-3xl text-blue-500">token</span>
                <h1 className="text-2xl font-bold tracking-tight">Leadsverse AI</h1>
            </div>
            <p className="text-slate-400 text-sm">{subtitle}</p>
        </div>
    )

    const inputClass = "w-full bg-black/40 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-600"
    const btnClass = "w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-[#111113] shadow-[0_10px_15px_-3px_rgba(37,99,235,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SET PASSWORD VIEW (invite accepted)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (mode === 'set-password') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#09090b]">
                <Blobs />
                <div className="w-full max-w-[400px] bg-[#111113]/80 border border-white/10 rounded-2xl p-8 relative z-10 backdrop-blur-[12px] shadow-[0_0_40px_0_rgba(59,130,246,0.15)]">
                    <CardHeader subtitle="You've been invited — set your password to get started." />

                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="w-14 h-14 rounded-full bg-green-900/20 border border-green-700/40 flex items-center justify-center mx-auto">
                                <span className="material-symbols-outlined text-green-400 text-3xl">check_circle</span>
                            </div>
                            <p className="text-white font-semibold">Password set successfully!</p>
                            <p className="text-slate-400 text-sm">Redirecting you to login…</p>
                        </div>
                    ) : (
                        <form className="space-y-5" onSubmit={handleSetPassword}>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className={inputClass}
                                    placeholder="Min. 8 characters"
                                    required
                                    minLength={8}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    className={inputClass}
                                    placeholder="Repeat your password"
                                    required
                                />
                            </div>

                            {error && <p className="text-red-400 text-xs">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading || !password || !confirm}
                                className={btnClass}
                            >
                                {loading ? 'Setting password…' : 'Set Password & Sign In'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        )
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // REGULAR LOGIN VIEW
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#09090b]">
            <Blobs />
            <div className="w-full max-w-[400px] bg-[#111113]/80 border border-white/10 rounded-2xl p-8 relative z-10 backdrop-blur-[12px] shadow-[0_0_40px_0_rgba(59,130,246,0.15)]">
                <CardHeader subtitle="Control. Convert. Scale." />

                <form className="space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="email">Email address</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className={inputClass}
                                placeholder="admin@leadsverse.ai"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className={inputClass}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="rounded border-white/10 bg-black/40 text-blue-600 focus:ring-offset-0 focus:ring-blue-600" />
                            <span>Remember me</span>
                        </label>
                        <Link href="/forgot-password" className="hover:text-blue-400 transition-colors">Forgot password?</Link>
                    </div>

                    {error && <p className="text-red-400 text-xs">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading || !email || !password}
                        className={btnClass}
                    >
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-xs text-slate-500">
                        Don't have an account? <a href="#" className="text-blue-500 hover:text-blue-400 font-medium cursor-default">Contact Sales</a>
                    </p>
                </div>
            </div>
        </div>
    )
}
