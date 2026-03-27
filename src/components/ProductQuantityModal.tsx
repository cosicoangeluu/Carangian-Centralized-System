import { useState } from 'react'
import { Product } from '../types'
import { XMarkIcon, CubeIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline'

interface ProductQuantityModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (quantity: number, isRetail: boolean, price: number) => void
  product: Product | null
}

export default function ProductQuantityModal({
  isOpen,
  onClose,
  onConfirm,
  product
}: ProductQuantityModalProps) {
  const [selectedMode, setSelectedMode] = useState<'retail' | 'wholesale' | null>(null)
  const [quantity, setQuantity] = useState(1)

  if (!isOpen || !product) return null

  const costPerPiece = product.cost / (product.units_per_pack || 1)
  const profitPerPiece = (product.retail_price || 0) - costPerPiece
  const profitMarginPerPiece = product.retail_price && product.retail_price > 0
    ? ((profitPerPiece / product.retail_price) * 100).toFixed(1)
    : 0

  const profitPerPack = product.selling_price - product.cost
  const profitMarginPerPack = product.selling_price > 0
    ? ((profitPerPack / product.selling_price) * 100).toFixed(1)
    : 0

  const handleModeSelect = (mode: 'retail' | 'wholesale') => {
    setSelectedMode(mode)
    setQuantity(1)
  }

  const handleConfirm = () => {
    if (!selectedMode) return
    
    const isRetail = selectedMode === 'retail'
    const price = isRetail ? (product.retail_price || 0) : product.selling_price
    onConfirm(quantity, isRetail, price)
  }

  const maxQuantity = selectedMode === 'retail'
    ? product.quantity
    : Math.floor(product.quantity / (product.units_per_pack || 1))

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 modal-backdrop" onClick={onClose} />

        <div className="relative w-full max-w-lg animate-slide-in">
          <div className="rounded-2xl bg-white shadow-large overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border-light bg-gradient-to-r from-neon-blue/5 to-neon-orange/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="stat-gradient-blue p-2.5 rounded-xl shadow-md">
                  <CubeIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-orbitron text-text-primary">{product.name}</h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-text-muted hover:text-text-primary p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Sale Mode Selection */}
              <div className="grid grid-cols-2 gap-4">
                {/* Wholesale Option */}
                <button
                  onClick={() => handleModeSelect('wholesale')}
                  className={`p-4 rounded-xl border-2 hover:border-neon-blue hover:shadow-medium transition-all bg-bg-tertiary text-left group ${
                    selectedMode === 'wholesale' ? 'border-neon-blue ring-2 ring-neon-blue/20' : 'border-border-light'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <CubeIcon className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold font-orbitron text-text-primary group-hover:text-neon-blue transition-colors">
                      Wholesale
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold font-orbitron text-green-600">₱{product.selling_price.toFixed(2)}</p>
                    <p className="text-xs text-text-muted font-rajdhani">per pack</p>
                  </div>
                </button>

                {/* Retail Option */}
                {product.is_retailable && product.retail_price ? (
                  <button
                    onClick={() => handleModeSelect('retail')}
                    className={`p-4 rounded-xl border-2 hover:border-neon-blue hover:shadow-medium transition-all bg-bg-tertiary text-left group ${
                      selectedMode === 'retail' ? 'border-neon-blue ring-2 ring-neon-blue/20' : 'border-border-light'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                        <CubeIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-bold font-orbitron text-text-primary group-hover:text-neon-blue transition-colors">
                        Retail
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold font-orbitron text-green-600">₱{product.retail_price.toFixed(2)}</p>
                      <p className="text-xs text-text-muted font-rajdhani">per piece</p>
                    </div>
                  </button>
                ) : (
                  <div className="p-4 rounded-xl border-2 border-dashed border-border-light bg-bg-secondary flex items-center justify-center">
                    <p className="text-sm text-text-muted font-rajdhani">Retail not enabled</p>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              {selectedMode && (
                <div className="rounded-xl bg-bg-tertiary border border-border-light p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-rajdhani font-semibold text-text-secondary uppercase">
                      Quantity ({selectedMode === 'retail' ? 'pieces' : 'packs'})
                    </label>
                    <span className="text-xs text-text-muted font-rajdhani">
                      Max: {maxQuantity} {selectedMode === 'retail' ? 'pcs' : 'packs'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 rounded-xl bg-white border border-border-light flex items-center justify-center hover:border-neon-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <MinusIcon className="h-5 w-5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={maxQuantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-20 text-center px-3 py-2 rounded-xl bg-white border border-border-light font-rajdhani font-bold text-lg"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                      disabled={quantity >= maxQuantity}
                      className="w-10 h-10 rounded-xl bg-white border border-border-light flex items-center justify-center hover:border-neon-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="pt-3 border-t border-border-light">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-muted font-rajdhani">Total:</span>
                      <span className="text-2xl font-bold font-orbitron text-neon-blue">
                        ₱{((selectedMode === 'retail' ? (product.retail_price || 0) : product.selling_price) * quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border-light bg-bg-tertiary flex gap-3">
              <button
                onClick={onClose}
                className="btn-secondary flex-1 px-4 py-3 rounded-xl font-rajdhani font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedMode}
                className="btn-primary flex-1 px-4 py-3 rounded-xl font-rajdhani font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
