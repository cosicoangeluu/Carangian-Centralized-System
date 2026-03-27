import { XMarkIcon } from '@heroicons/react/24/outline'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CubeIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline'

type TransactionType = 'SALE' | 'RESTOCK' | 'RETURN' | 'ADJUSTMENT'

interface TransactionSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectType: (type: TransactionType) => void
  userRole: 'admin' | 'customer'
}

export default function TransactionSelectionModal({
  isOpen,
  onClose,
  onSelectType,
  userRole
}: TransactionSelectionModalProps) {
  if (!isOpen) return null

  const transactionTypes: { type: TransactionType; label: string; description: string; color: string; icon: any }[] = [
    {
      type: 'SALE',
      label: 'Sale',
      description: 'Process customer purchases',
      color: 'from-green-500 to-emerald-500',
      icon: ArrowDownIcon
    },
    {
      type: 'RESTOCK',
      label: 'Restock',
      description: 'Add inventory to stock',
      color: 'from-blue-500 to-cyan-500',
      icon: ArrowUpIcon
    },
    {
      type: 'RETURN',
      label: 'Return',
      description: 'Process returned items',
      color: 'from-orange-500 to-red-500',
      icon: ArrowsRightLeftIcon
    },
    {
      type: 'ADJUSTMENT',
      label: 'Adjustment',
      description: 'Make inventory corrections',
      color: 'from-purple-500 to-pink-500',
      icon: CubeIcon
    }
  ]

  // Filter transaction types based on user role
  const visibleTypes = userRole === 'admin'
    ? transactionTypes
    : transactionTypes.filter(t => t.type === 'SALE')

  const handleSelectType = (type: TransactionType) => {
    onSelectType(type)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative w-full max-w-2xl animate-slide-in">
          <div className="rounded-2xl bg-white shadow-large overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border-light bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="stat-gradient-blue p-2.5 rounded-xl shadow-md">
                  <ArrowsRightLeftIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-orbitron text-text-primary">Select Transaction Type</h3>
                  <p className="text-sm text-text-muted font-rajdhani">Choose the type of transaction to process</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-text-muted hover:text-text-primary p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Transaction Type Options */}
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visibleTypes.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.type}
                      onClick={() => handleSelectType(item.type)}
                      className="group relative p-6 rounded-xl border-2 border-border-light hover:border-transparent transition-all duration-300 text-left overflow-hidden"
                    >
                      {/* Gradient Background on Hover */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                      
                      {/* Content */}
                      <div className="relative z-10">
                        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${item.color} shadow-lg mb-4`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        
                        <h4 className="text-lg font-bold font-orbitron text-text-primary group-hover:text-white transition-colors duration-300">
                          {item.label}
                        </h4>
                        
                        <p className="text-sm text-text-muted font-rajdhani mt-1 group-hover:text-white/90 transition-colors duration-300">
                          {item.description}
                        </p>

                        {/* Arrow indicator */}
                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <ArrowDownIcon className="h-5 w-5 text-white rotate-[-45deg]" />
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            {userRole === 'customer' && (
              <div className="px-6 py-4 border-t border-border-light bg-bg-tertiary">
                <p className="text-sm text-text-muted font-rajdhani text-center">
                  You are logged in as a customer. Only sale transactions are available.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
