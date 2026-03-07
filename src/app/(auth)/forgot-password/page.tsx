'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

type Mode = 'request' | 'verify' | 'reset'

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [mode, setMode] = useState<Mode>('request')

    // Form fields
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')

    // UI state
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [successMsg, setSuccessMsg] = useState('')

    // ── Detect Magic Link (URL token) on mount ──
    useEffect(() => {
        // Handle Implicit Flow (hash fallback, just in case)
        const hash = window.location.hash
        if (hash) {
            const params = new URLSearchParams(hash.slice(1))
            const type = params.get('type')
            const accessToken = params.get('access_token')
            const refreshToken = params.get('refresh_token')

            if (type === 'recovery' && accessToken && refreshToken) {
                supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
                    .then(({ error }) => {
                        if (!error) {
                            window.history.replaceState(null, '', window.location.pathname)
                            setMode('reset')
                        }
                    })
                return
            }
        }

        // Handle Server-Side PKCE Redirect
        // The /api/auth/callback route exchanges the code and redirects us here with ?type=recovery
        const searchParams = new URLSearchParams(window.location.search)
        if (searchParams.get('type') === 'recovery') {
            // Check if we actually have an active session before switching to reset mode
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                    // Clean up URL
                    window.history.replaceState(null, '', window.location.pathname)
                    setMode('reset')
                } else {
                    setError('Session expired. Please request a new link.')
                }
            })
        }
    }, [])

    // ── Step 1: Send Request ──
    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Redirect back to this page via the server-side callback to exchange the PKCE code first
        const redirectTo = `${window.location.origin}/api/auth/callback?next=/forgot-password?type=recovery`

        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

        setLoading(false)
        if (error) {
            setError(error.message)
            return
        }

        setSuccessMsg('Check your email for the reset link or 8-digit code.')
        setMode('verify')
    }

    // ── Step 2: Verify OTP ──
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'recovery'
        })

        setLoading(false)
        if (error) {
            setError('Invalid code. Please try again.')
            return
        }

        setSuccessMsg('')
        setMode('reset')
    }

    // ── Step 3: Set New Password ──
    const handleReset = async (e: React.FormEvent) => {
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

        setSuccessMsg('Password updated successfully! Redirecting...')

        // Force hard reload back to login page
        setTimeout(async () => {
            await supabase.auth.signOut()
            window.location.href = '/login'
        }, 2000)
    }

    // ── Shared UI Components ──
    const Blobs = () => (
        <div className="fixed inset-0 z-0 bg-[#09090b] pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/30 rounded-full blur-[80px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-950/40 rounded-full blur-[80px]" />
            <div className="absolute top-1/4 left-1/3 w-[40%] h-[40%] bg-slate-900/50 rounded-full blur-[80px]" />
            <div className="absolute top-1/2 right-1/4 w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[80px]" />
        </div>
    )

    const CardHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
        <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2 text-white">
                <span className="material-symbols-outlined text-3xl text-blue-500">lock_reset</span>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            </div>
            <p className="text-slate-400 text-sm whitespace-pre-wrap">{subtitle}</p>
        </div>
    )

    const inputClass = "w-full bg-black/40 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-600"
    const btnClass = "w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-[#111113] shadow-[0_10px_15px_-3px_rgba(37,99,235,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#09090b]">
            <Blobs />
            <div className="w-full max-w-[400px] bg-[#111113]/80 border border-white/10 rounded-2xl p-8 relative z-10 backdrop-blur-[12px] shadow-[0_0_40px_0_rgba(59,130,246,0.15)]">

                {/* ━━━━━━━━━━ MODE: REQUEST ━━━━━━━━━━ */}
                {mode === 'request' && (
                    <>
                        <CardHeader
                            title="Reset Password"
                            subtitle="Enter your email and we'll send you a link and code to reset your password."
                        />
                        <form className="space-y-6" onSubmit={handleRequest}>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Email address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className={inputClass}
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>

                            {error && <p className="text-red-400 text-xs">{error}</p>}

                            <button type="submit" disabled={loading || !email} className={btnClass}>
                                {loading ? 'Sending...' : 'Send Reset Instructions'}
                            </button>
                        </form>
                    </>
                )}

                {/* ━━━━━━━━━━ MODE: VERIFY ━━━━━━━━━━ */}
                {mode === 'verify' && (
                    <>
                        <CardHeader
                            title="Check Your Email"
                            subtitle={`We sent a verification code to\n${email}\nEnter it below or click the link in the email.`}
                        />
                        <form className="space-y-6" onSubmit={handleVerifyOtp}>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-3 text-center">Verification Code</label>
                                <div className="flex justify-center gap-2">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <input
                                            key={i}
                                            id={`otp-${i}`}
                                            type="text"
                                            inputMode="numeric"
                                            value={otp[i] || ''}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '')
                                                if (!val && e.target.value !== '') return
                                                const newOtp = otp.split('')
                                                newOtp[i] = val.slice(-1)
                                                setOtp(newOtp.join(''))
                                                if (val && i < 7) {
                                                    document.getElementById(`otp-${i + 1}`)?.focus()
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Backspace' && !otp[i] && i > 0) {
                                                    const prev = document.getElementById(`otp-${i - 1}`)
                                                    if (prev) {
                                                        const newOtp = otp.split('')
                                                        newOtp[i - 1] = ''
                                                        setOtp(newOtp.join(''))
                                                        prev.focus()
                                                    }
                                                }
                                                // Handle Left/Right arrows
                                                if (e.key === 'ArrowLeft' && i > 0) {
                                                    document.getElementById(`otp-${i - 1}`)?.focus()
                                                }
                                                if (e.key === 'ArrowRight' && i < 7) {
                                                    document.getElementById(`otp-${i + 1}`)?.focus()
                                                }
                                            }}
                                            onPaste={(e) => {
                                                e.preventDefault()
                                                const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8)
                                                if (pasted) {
                                                    setOtp(pasted)
                                                    const nextFocus = Math.min(pasted.length, 7)
                                                    document.getElementById(`otp-${nextFocus}`)?.focus()
                                                }
                                            }}
                                            className="w-10 h-12 bg-black/40 border border-white/10 text-white rounded-lg text-center text-xl font-semibold shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-600"
                                            maxLength={2}
                                        />
                                    ))}
                                </div>
                            </div>

                            {error && <p className="text-red-400 text-xs">{error}</p>}
                            {successMsg && <p className="text-green-400 text-xs">{successMsg}</p>}

                            <button type="submit" disabled={loading || otp.length < 6} className={btnClass}>
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </button>
                        </form>
                    </>
                )}

                {/* ━━━━━━━━━━ MODE: RESET ━━━━━━━━━━ */}
                {mode === 'reset' && (
                    <>
                        {successMsg ? (
                            <div className="text-center space-y-4">
                                <div className="w-14 h-14 rounded-full bg-green-900/20 border border-green-700/40 flex items-center justify-center mx-auto">
                                    <span className="material-symbols-outlined text-green-400 text-3xl">check_circle</span>
                                </div>
                                <p className="text-white font-semibold">Password updated successfully!</p>
                                <p className="text-slate-400 text-sm">Redirecting to login…</p>
                            </div>
                        ) : (
                            <>
                                <CardHeader
                                    title="Set New Password"
                                    subtitle="Almost done! Enter your new password."
                                />
                                <form className="space-y-5" onSubmit={handleReset}>
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
                                            placeholder="Repeat password"
                                            required
                                        />
                                    </div>

                                    {error && <p className="text-red-400 text-xs">{error}</p>}

                                    <button
                                        type="submit"
                                        disabled={loading || !password || !confirm}
                                        className={btnClass}
                                    >
                                        {loading ? 'Updating...' : 'Set New Password'}
                                    </button>
                                </form>
                            </>
                        )}
                    </>
                )}

                {/* Return to Login link */}
                {!successMsg.includes('Redirecting') && (
                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <Link href="/login" onClick={() => setMode('request')} className="text-xs text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-1 group">
                            <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                            Return to log in
                        </Link>
                    </div>
                )}

            </div>
        </div>
    )
}
