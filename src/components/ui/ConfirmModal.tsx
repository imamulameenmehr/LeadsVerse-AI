import React from 'react'

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    isDestructive?: boolean
    isLoading?: boolean
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false,
    isLoading = false
}: ConfirmModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#121212] border border-white/10 rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-6 mx-auto">
                    <span className="material-symbols-outlined text-[32px] text-red-500">warning</span>
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-3 tracking-tight">{title}</h3>
                <p className="text-slate-400 text-sm text-center mb-8 leading-relaxed">
                    {description}
                </p>
                <div className="flex gap-4 min-w-full">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-5 py-3.5 rounded-2xl text-sm font-bold text-slate-300 bg-white/[0.03] hover:bg-white/[0.08] transition-all disabled:opacity-50 outline-none"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 flex justify-center items-center px-5 py-3.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-70 outline-none shadow-lg ${isDestructive
                                ? 'bg-red-500 text-white hover:bg-red-400 shadow-red-500/20'
                                : 'bg-[#d9ff54] text-black hover:bg-[#c4ed3b] shadow-[#d9ff54]/20'
                            }`}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
