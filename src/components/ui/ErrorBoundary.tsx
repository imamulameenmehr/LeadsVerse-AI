'use client'
import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}
interface State {
    hasError: boolean
    error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error) {
        console.error('[ErrorBoundary]', error)
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback
            return (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-red-900/20 border border-red-800/50 flex items-center justify-center mb-4">
                        <AlertTriangle size={20} className="text-red-400" />
                    </div>
                    <p className="text-white font-semibold mb-1">Something went wrong</p>
                    <p className="text-slate-500 text-sm mb-6 max-w-xs">
                        An unexpected error occurred. Try refreshing the page.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: undefined })}
                        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        <RefreshCw size={14} />
                        Try again
                    </button>
                </div>
            )
        }
        return this.props.children
    }
}
