import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Product } from '../types'
import { XMarkIcon, CubeIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface AddStocksModalProps {
  isOpen: boolean
  onClose: () => void
  onStockAdded: () => void
}

interface StockItem {
  product: Product
  quantityToAdd: number
  selected: boolean
}

export default function AddStocksModal({ isOpen, onClose, onStockAdded }: AddStocksModalProps) {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
    }
  }, [isOpen])

  async function fetchProducts() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')

      if (error) throw error

      const fetchedProducts = data || []

      // Initialize stock items
      const items: StockItem[] = fetchedProducts.map(p => ({
        product: p,
        quantityToAdd: 0,
        selected: false
      }))
      setStockItems(items)

      // Extract unique categories
      const uniqueCategories = Array.from(new Set(fetchedProducts.map(p => p.category).filter(Boolean)))
        .sort()
      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleSelectProduct(productId: string) {
    setStockItems(items =>
      items.map(item =>
        item.product.id === productId
          ? { ...item, selected: !item.selected, quantityToAdd: !item.selected ? item.quantityToAdd : 0 }
          : item
      )
    )
  }

  function handleQuantityChange(productId: string, quantity: number) {
    setStockItems(items =>
      items.map(item =>
        item.product.id === productId
          ? { ...item, quantityToAdd: Math.max(0, quantity) }
          : item
      )
    )
  }

  function handleSelectAll() {
    const allSelected = stockItems.every(item => item.selected)
    setStockItems(items =>
      items.map(item => ({
        ...item,
        selected: !allSelected
      }))
    )
  }

  function handleClearAll() {
    setStockItems(items =>
      items.map(item => ({
        ...item,
        selected: false,
        quantityToAdd: 0
      }))
    )
  }

  async function handleSubmit() {
    const selectedItems = stockItems.filter(item => item.selected && item.quantityToAdd > 0)

    if (selectedItems.length === 0) {
      alert('Please select at least one product and enter a quantity.')
      return
    }

    try {
      setProcessing(true)
      const now = new Date()
      console.log('📝 Starting stock addition for', selectedItems.length, 'products')

      // Process each selected product
      for (const item of selectedItems) {
        const newQuantity = item.product.quantity + item.quantityToAdd
        console.log('📦 Processing:', item.product.name, '| Adding:', item.quantityToAdd, '| Before:', item.product.quantity, '| After:', newQuantity)

        // Update product quantity
        const { error: updateError, data: updateData } = await supabase
          .from('products')
          .update({
            quantity: newQuantity,
            updated_at: now.toISOString()
          })
          .eq('id', item.product.id)
          .select()
          .single()

        if (updateError) {
          console.error('❌ Error updating product:', updateError)
          throw updateError
        }
        console.log('✅ Product updated:', updateData)

        // Log stock history
        const historyPayload = {
          product_id: item.product.id,
          product_name: item.product.name,
          action: 'ADD' as const,
          quantity_change: item.quantityToAdd,
          quantity_before: item.product.quantity,
          quantity_after: newQuantity,
          notes: `Stock addition - Added ${item.quantityToAdd} units`,
          created_at: now.toISOString()
        }
        
        console.log('📊 Inserting stock history:', historyPayload)
        
        const { error: historyError, data: historyData } = await supabase
          .from('stock_history')
          .insert([historyPayload])
          .select()

        if (historyError) {
          console.error('❌ Error logging stock history:', historyError)
          console.error('Error details:', {
            message: historyError.message,
            code: historyError.code,
            details: historyError.details,
            hint: historyError.hint
          })
          throw historyError
        }
        
        console.log('✅ Stock history logged:', historyData)
      }

      console.log('✅ All stock additions completed successfully!')
      onStockAdded()
      onClose()
    } catch (error) {
      console.error('❌ Error adding stock:', error)
      alert('Failed to add stock. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const totalQuantityToAdd = stockItems
    .filter(item => item.selected && item.quantityToAdd > 0)
    .reduce((sum, item) => sum + item.quantityToAdd, 0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative w-full max-w-5xl animate-slide-in">
          <div className="rounded-2xl bg-white shadow-large overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border-light bg-gradient-to-r from-neon-blue/5 to-neon-orange/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="stat-gradient-blue p-2.5 rounded-xl shadow-md">
                  <PlusIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-orbitron text-text-primary">Add Stock</h3>
                  <p className="text-sm text-text-muted font-rajdhani">Select products and add inventory</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-text-muted hover:text-text-primary p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-6 border-b border-border-light bg-bg-tertiary">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="input-field w-full pl-10 pr-4 py-3 rounded-xl"
                  />
                </div>
                {/* Category Filter */}
                <div className="sm:w-48">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="input-field w-full px-4 py-3 rounded-xl"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bulk Actions */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSelectAll}
                    className="btn-secondary px-4 py-2 rounded-xl font-rajdhani font-semibold text-sm"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="btn-secondary px-4 py-2 rounded-xl font-rajdhani font-semibold text-sm"
                  >
                    Clear All
                  </button>
                </div>
                <div className="text-sm font-rajdhani">
                  <span className="text-text-secondary">Selected: </span>
                  <span className="font-bold text-neon-blue">
                    {stockItems.filter(item => item.selected && item.quantityToAdd > 0).length} products
                  </span>
                  <span className="text-text-secondary mx-2">|</span>
                  <span className="text-text-secondary">Total to add: </span>
                  <span className="font-bold text-green-600">+{totalQuantityToAdd} units</span>
                </div>
              </div>
            </div>

            {/* Product List */}
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-4 border-border-light"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-neon-blue border-r-neon-orange border-b-transparent border-l-transparent animate-spin"></div>
                  </div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <CubeIcon className="h-16 w-16 text-text-muted mx-auto mb-4" />
                  <p className="text-text-secondary font-rajdhani">No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredItems.map((item) => (
                    <div
                      key={item.product.id}
                      className={`rounded-xl border-2 p-4 transition-all cursor-pointer ${
                        item.selected
                          ? 'border-neon-blue bg-neon-blue/5'
                          : 'border-border-light bg-white hover:border-neon-blue/30'
                      }`}
                      onClick={() => handleSelectProduct(item.product.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            item.selected ? 'stat-gradient-blue' : 'bg-bg-tertiary border border-border-light'
                          }`}>
                            <CubeIcon className={`h-5 w-5 ${item.selected ? 'text-white' : 'text-neon-blue'}`} />
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-bold font-rajdhani ${
                              item.selected ? 'text-neon-blue' : 'text-text-primary'
                            }`}>
                              {item.product.name}
                            </h4>
                            <p className="text-xs text-text-muted font-rajdhani mt-0.5">
                              {item.product.category}
                            </p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          item.selected
                            ? 'bg-neon-blue border-neon-blue'
                            : 'border-border-light'
                        }`}>
                          {item.selected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm font-rajdhani">
                          <span className="text-text-muted">Current Stock: </span>
                          <span className={`font-bold ${
                            item.product.quantity < 10 ? 'text-red-500' : 'text-text-primary'
                          }`}>
                            {item.product.quantity}
                          </span>
                          {item.product.quantity < 10 && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-xs text-red-600 font-semibold">
                              LOW
                            </span>
                          )}
                        </div>
                        {item.selected && (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <label className="text-xs text-text-muted font-rajdhani">Add:</label>
                            <input
                              type="number"
                              min="0"
                              value={item.quantityToAdd}
                              onChange={(e) => handleQuantityChange(item.product.id, parseInt(e.target.value) || 0)}
                              className="w-24 px-3 py-1.5 rounded-lg border border-border-light text-sm font-rajdhani focus:outline-none focus:ring-2 focus:ring-neon-blue"
                              placeholder="Qty"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border-light bg-bg-tertiary flex items-center justify-between">
              <div className="text-sm font-rajdhani">
                <span className="text-text-secondary">Total products to update: </span>
                <span className="font-bold text-neon-blue">
                  {stockItems.filter(item => item.selected && item.quantityToAdd > 0).length}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary px-6 py-2.5 rounded-xl font-rajdhani font-semibold"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={processing || totalQuantityToAdd === 0}
                  className="btn-primary px-6 py-2.5 rounded-xl font-rajdhani font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-5 w-5" />
                      <span>Add {totalQuantityToAdd > 0 ? `+${totalQuantityToAdd} Units` : 'Stock'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
