import { ReactNode } from 'react'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface POSLayoutProps {
  children: ReactNode
  onBack: () => void
}

export default function POSLayout({ children, onBack }: POSLayoutProps) {
  return (
    <div className="min-h-screen futuristic-bg flex flex-col">
      {/* Top Header */}
      <header className="flex h-16 items-center justify-between border-b border-border-light bg-white/80 backdrop-blur-md px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-text-secondary hover:text-neon-blue transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="font-rajdhani font-semibold">Back to App</span>
          </button>
          <div className="h-6 w-px bg-border-light"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-orange flex items-center justify-center">
              <span className="text-xs font-bold text-white font-orbitron">POS</span>
            </div>
            <h1 className="text-lg font-bold font-orbitron gradient-text">POINT OF SALE</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-rajdhani text-green-700 font-medium">Active</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto bg-bg-primary">
        <div className="mx-auto max-w-[1600px] animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
