'use client'
import { useState } from 'react'
import { X, Copy, Check, Loader2, Sparkles, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OutreachMessages } from '@/types'

const TABS: { key: keyof OutreachMessages; label: string; emoji: string }[] = [
    { key: 'email', label: 'Email', emoji: '📧' },
    { key: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
    { key: 'instagram_dm', label: 'Instagram DM', emoji: '📸' },
    { key: 'linkedin_dm', label: 'LinkedIn DM', emoji: '💼' },
]

interface Props {
    leadId: string
    onClose: () => void
}

/** Parse "Subject: Foo\n\nBody text" into subject + body */
function parseEmail(raw: string): { subject: string; body: string } {
    const match = raw.match(/^Subject:\s*(.+?)\n\n([\s\S]*)$/i)
    if (match) return { subject: match[1].trim(), body: match[2].trim() }
    return { subject: '', body: raw }
}

export default function AIOutreachModal({ leadId, onClose }: Props) {
    const [messages, setMessages] = useState<OutreachMessages | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState<keyof OutreachMessages>('email')
    const [copied, setCopied] = useState(false)

    const generate = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/ai/outreach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId }),
            })
            if (!res.ok) throw new Error('API error')
            const data: OutreachMessages = await res.json()
            setMessages(data)
        } catch {
            setError('Generation failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    /** Copy: for email tab, copy subject + body together cleanly */
    const handleCopy = async () => {
        if (!messages) return
        let textToCopy = messages[activeTab]
        if (activeTab === 'email') {
            const { subject, body } = parseEmail(messages.email)
            textToCopy = subject ? `Subject: ${subject}\n\n${body}` : body
        }
        await navigator.clipboard.writeText(textToCopy)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const activeMessage = messages ? messages[activeTab] : ''
    const emailParsed = messages && activeTab === 'email' ? parseEmail(messages.email) : null
    const displayText = emailParsed ? emailParsed.body : activeMessage
    const charCount = displayText.length

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end">
            <div className="w-[500px] h-full bg-[#111113] border-l border-white/10 flex flex-col shadow-2xl">

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-600/20 flex items-center justify-center">
                            <Sparkles size={13} className="text-blue-400" />
                        </div>
                        <span className="text-white font-semibold text-sm">AI Outreach Generator</span>
                        <span className="text-[10px] text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-full font-medium">
                            Powered by Gemini
                        </span>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1 rounded hover:bg-white/5">
                        <X size={16} />
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">

                    {/* Empty / CTA state */}
                    {!messages && !loading && (
                        <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/20 flex items-center justify-center mb-1">
                                <Sparkles size={24} className="text-blue-400" />
                            </div>
                            <p className="text-white font-semibold text-base">Generate Value-Driven Outreach</p>
                            <p className="text-slate-400 text-sm max-w-[300px] leading-relaxed">
                                AI will analyze this lead and write personalized, solution-first messages
                                for Email, WhatsApp, Instagram DM, and LinkedIn.
                            </p>

                            <div className="flex flex-col gap-2 text-xs text-slate-500 mt-1 mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    <span>Personalized to their business type & pain points</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    <span>Value-first hooks, no generic marketing fluff</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    <span>R&B Group services matched to lead's needs</span>
                                </div>
                            </div>

                            <button
                                onClick={generate}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold
                                   px-6 py-2.5 rounded-lg text-sm transition-all
                                   shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_28px_rgba(37,99,235,0.5)]
                                   flex items-center gap-2"
                            >
                                <Sparkles size={14} />
                                Generate Messages
                            </button>
                        </div>
                    )}

                    {/* Loading state */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                            <Loader2 size={28} className="text-blue-400 animate-spin" />
                            <p className="text-slate-300 text-sm font-medium">Crafting personalized messages…</p>
                            <p className="text-slate-500 text-xs">Analyzing lead data + matching R&B services</p>
                        </div>
                    )}

                    {/* Error state */}
                    {error && !loading && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-5 text-sm max-w-[320px]">
                                <p className="text-red-400 font-medium mb-2">Generation failed</p>
                                <p className="text-red-400/70 text-xs mb-3">{error}</p>
                                <button
                                    onClick={generate}
                                    className="text-xs bg-red-900/40 hover:bg-red-900/60 text-red-300 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Messages state */}
                    {messages && !loading && (
                        <div className="flex flex-col gap-4">
                            {/* Tab bar */}
                            <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={cn(
                                            'flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium rounded-md transition-all',
                                            activeTab === tab.key
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        )}
                                    >
                                        <span>{tab.emoji}</span>
                                        <span className="hidden xs:inline">{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Email subject badge */}
                            {activeTab === 'email' && emailParsed?.subject && (
                                <div className="flex items-start gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                    <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider shrink-0 mt-0.5">Subject</span>
                                    <span className="text-slate-200 text-xs leading-relaxed">{emailParsed.subject}</span>
                                </div>
                            )}

                            {/* Message textarea */}
                            <div className="relative group">
                                <textarea
                                    readOnly
                                    value={displayText}
                                    className="w-full bg-[#1a1a1d] border border-white/10 text-slate-300
                                     rounded-lg p-4 text-sm leading-relaxed resize-none outline-none
                                     focus:border-blue-500/40 transition-colors custom-scrollbar"
                                    rows={18}
                                />
                                <button
                                    onClick={handleCopy}
                                    className={cn(
                                        'absolute top-3 right-3 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-all shadow-lg',
                                        copied
                                            ? 'bg-green-900/80 text-green-400 border border-green-500/30'
                                            : 'bg-zinc-800 text-slate-300 hover:bg-zinc-700 border border-white/10 opacity-0 group-hover:opacity-100'
                                    )}
                                >
                                    {copied ? <Check size={12} /> : <Copy size={12} />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>

                            {/* Footer: char count + regenerate */}
                            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                                <span>{charCount} characters</span>
                                <button
                                    onClick={generate}
                                    disabled={loading}
                                    className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw size={11} />
                                    Regenerate
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
