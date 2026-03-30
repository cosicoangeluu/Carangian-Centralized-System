import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Product, CartItem, ReceiptData } from '../types'
import {
  CubeIcon,
  ShoppingCartIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import Receipt from '../components/Receipt'
import { generateTransactionNumber, formatReceiptDate, downloadReceiptAsPDF, downloadReceiptAsImage } from '../utils/receiptUtils'
import { logStockHistory } from '../utils/stockHistory'
import POSLayout from '../components/POSLayout'
import ProductQuantityModal from '../components/ProductQuantityModal'

const TRANSACTION_TYPE = 'SALE' as const

export default function POS() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // POS State
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [showQuantityModal, setShowQuantityModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  // POS Functions
  function handleProductClick(product: Product) {
    setSelectedProduct(product)
    setShowQuantityModal(true)
  }

  function handleQuantityConfirm(quantity: number, isRetail: boolean, price: number, size?: 'small' | 'medium' | 'large') {
    if (!selectedProduct) return

    addToCart(selectedProduct, quantity, isRetail, price, size)
    setShowQuantityModal(false)
    setSelectedProduct(null)
  }

  function addToCart(product: Product, quantity: number, isRetail: boolean, sellingPrice: number, size?: 'small' | 'medium' | 'large') {
    // For size variants, use product.id + size as the unique key
    const cartKey = size ? `${product.id}-${size}` : product.id
    const existingItem = cart.find(item => {
      const itemKey = item.size ? `${item.product.id}-${item.size}` : item.product.id
      return itemKey === cartKey
    })

    if (existingItem) {
      setCart(cart.map(item => {
        const itemKey = item.size ? `${item.product.id}-${item.size}` : item.product.id
        return itemKey === cartKey
          ? {
              ...item,
              quantity: item.quantity + quantity,
              subtotal: (item.quantity + quantity) * item.selling_price
            }
          : item
      }))
    } else {
      setCart([...cart, {
        product,
        quantity,
        selling_price: sellingPrice,
        subtotal: quantity * sellingPrice,
        is_retail: isRetail,
        size
      }])
    }
  }

  function removeFromCart(productId: string) {
    setCart(cart.filter(item => {
      const itemKey = item.size ? `${item.product.id}-${item.size}` : item.product.id
      return itemKey !== productId
    }))
  }

  function updateCartQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart(cart.map(item => {
      const itemKey = item.size ? `${item.product.id}-${item.size}` : item.product.id
      return itemKey === productId
        ? { ...item, quantity, subtotal: quantity * item.selling_price }
        : item
    }))
  }

  function clearCart() {
    setCart([])
    setNotes('')
    setCustomerName('')
  }

  async function processTransaction() {
    if (cart.length === 0) return

    const transactionNumber = generateTransactionNumber()
    const now = new Date()

    try {
      // Process each item in cart
      for (const item of cart) {
        // Skip inventory deduction if product doesn't track inventory
        if (item.product.track_inventory === false) {
          // Still record transaction but don't update quantity
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert([{
              product_id: item.product.id,
              type: 'OUT',
              quantity: item.quantity,
              unit_cost: item.product.cost / (item.product.units_per_pack || 1),
              total_cost: item.quantity * (item.product.cost / (item.product.units_per_pack || 1)),
              selling_price: item.selling_price,
              total_revenue: item.subtotal,
              notes: customerName ? `${customerName} - ${notes || `${TRANSACTION_TYPE} - ${transactionNumber}`}${item.size ? ` (${item.size})` : ''}` : notes || `${TRANSACTION_TYPE} - ${transactionNumber}${item.size ? ` (${item.size})` : ''}`,
              created_at: now.toISOString()
            }])

          if (transactionError) throw transactionError
          continue
        }

        // Calculate quantity in base units (pieces)
        // If retail: quantity is already in pieces
        // If wholesale: quantity is in packs, convert to pieces
        const quantityInBaseUnits = item.is_retail
          ? item.quantity
          : item.quantity * (item.product.units_per_pack || 1)

        // Calculate cost per piece
        const costPerPiece = item.product.cost / (item.product.units_per_pack || 1)
        const totalCost = quantityInBaseUnits * costPerPiece

        const { error: transactionError } = await supabase
          .from('transactions')
          .insert([{
            product_id: item.product.id,
            type: 'OUT',
            quantity: quantityInBaseUnits,
            unit_cost: costPerPiece,
            total_cost: totalCost,
            selling_price: item.selling_price,
            total_revenue: item.subtotal,
            notes: customerName ? `${customerName} - ${notes || `${TRANSACTION_TYPE} - ${transactionNumber}`}${item.size ? ` (${item.size})` : ''}` : notes || `${TRANSACTION_TYPE} - ${transactionNumber}${item.size ? ` (${item.size})` : ''}`,
            created_at: now.toISOString()
          }])

        if (transactionError) throw transactionError

        // Update product quantity (quantity is stored in base units/pieces)
        const newQuantity = item.product.quantity - quantityInBaseUnits

        const { error: updateError } = await supabase
          .from('products')
          .update({
            quantity: newQuantity,
            updated_at: now.toISOString()
          })
          .eq('id', item.product.id)

        if (updateError) throw updateError

        // Log stock history for inventory removal
        await logStockHistory({
          productId: item.product.id,
          productName: item.product.name,
          action: 'REMOVE',
          quantityChange: -quantityInBaseUnits,
          quantityBefore: item.product.quantity,
          quantityAfter: newQuantity,
          notes: `Sale - ${transactionNumber}${item.size ? ` (${item.size})` : ''}`
        })
      }

      // Generate receipt data
      const receipt: ReceiptData = {
        id: Date.now().toString(),
        transactionNumber,
        date: formatReceiptDate(now),
        type: TRANSACTION_TYPE,
        customerName: customerName || undefined,
        items: cart.map(item => ({
          name: item.size 
            ? `${item.product.name} (${item.size.charAt(0).toUpperCase() + item.size.slice(1)})`
            : item.product.name,
          quantity: item.quantity,
          unitPrice: item.selling_price,
          total: item.subtotal
        })),
        subtotal: cart.reduce((sum, item) => sum + item.subtotal, 0),
        tax: 0,
        total: cart.reduce((sum, item) => sum + item.subtotal, 0),
        notes: notes || undefined
      }

      setReceiptData(receipt)
      setShowReceipt(true)
      clearCart()
      fetchProducts() // Refresh product stock
    } catch (error) {
      console.error('Error processing transaction:', error)
      alert('Failed to process transaction. Please try again.')
    }
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-border-light"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-neon-blue border-r-neon-orange border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <p className="text-text-secondary font-rajdhani text-base">Loading Products...</p>
        </div>
      </div>
    )
  }

  return (
    <POSLayout onBack={() => navigate(-1)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-orbitron text-text-primary flex items-center gap-3">
              <span className="gradient-text">POINT OF SALE</span>
            </h1>
            <p className="text-text-secondary mt-1 font-rajdhani text-base">Process customer purchases and generate receipts</p>
          </div>
        </div>

        {/* POS Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl bg-white border border-border-light shadow-medium p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold font-orbitron text-text-primary flex items-center gap-2">
                  <CubeIcon className="h-5 w-5 text-neon-yellow" />
                  Products
                </h2>
                <div className="text-sm font-rajdhani text-text-muted">
                  {products.length} products available
                </div>
              </div>

              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field w-full px-4 py-3 rounded-xl"
                />
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[550px] overflow-y-auto pr-2">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="text-left p-4 rounded-xl border-2 border-border-light hover:border-neon-blue hover:shadow-medium transition-all bg-bg-tertiary group"
                  >
                    <div className="mb-2">
                      <h3 className="font-rajdhani font-bold text-text-primary group-hover:text-neon-blue transition-colors">
                        {product.name}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        {product.has_size_variants ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-rajdhani text-text-secondary">S:</span>
                            <span className="text-sm font-bold font-orbitron text-neon-blue">₱{product.size_small_price?.toFixed(2)}</span>
                            <span className="text-xs text-text-muted">|</span>
                            <span className="text-xs font-rajdhani text-text-secondary">M:</span>
                            <span className="text-sm font-bold font-orbitron text-neon-blue">₱{product.size_medium_price?.toFixed(2)}</span>
                            <span className="text-xs text-text-muted">|</span>
                            <span className="text-xs font-rajdhani text-text-secondary">L:</span>
                            <span className="text-sm font-bold font-orbitron text-neon-blue">₱{product.size_large_price?.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold font-orbitron text-neon-blue">
                            ₱{product.selling_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-text-muted font-rajdhani">
                        Click to add
                      </span>
                    </div>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <CubeIcon className="h-12 w-12 text-text-muted mx-auto mb-3" />
                    <p className="text-text-secondary font-rajdhani">No products found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cart Panel */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-white border border-border-light shadow-medium p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold font-orbitron text-text-primary flex items-center gap-2">
                  <ShoppingCartIcon className="h-5 w-5 text-neon-blue" />
                  Cart
                </h2>
                {cart.length > 0 && (
                  <button
                    onClick={() => {
                      clearCart()
                    }}
                    className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Clear cart"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Cart Items */}
              <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto pr-2">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCartIcon className="h-12 w-12 text-text-muted mx-auto mb-3" />
                    <p className="text-text-secondary font-rajdhani">Cart is empty</p>
                    <p className="text-sm text-text-muted font-rajdhani mt-1">Select products to add to cart</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.size ? `${item.product.id}-${item.size}` : item.product.id} className="p-3 rounded-xl bg-bg-tertiary border border-border-light">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-rajdhani font-semibold text-text-primary truncate">{item.product.name}</h4>
                            {item.size && (
                              <span className={`px-2 py-0.5 rounded text-xs font-bold font-rajdhani uppercase ${
                                item.size === 'small' ? 'bg-green-100 text-green-700' :
                                item.size === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {item.size}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-50"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-white border border-border-medium flex items-center justify-center hover:border-neon-blue transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-rajdhani font-bold text-text-primary">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-white border border-border-medium flex items-center justify-center hover:border-neon-blue transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-rajdhani font-bold text-neon-blue">
                          ₱{item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Notes */}
              {cart.length > 0 && (
                <>
                  <div className="mb-4">
                    <label className="block text-xs font-rajdhani font-semibold text-text-secondary uppercase mb-2">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="input-field w-full px-3 py-2 rounded-xl text-sm"
                      placeholder="Enter customer name..."
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-rajdhani font-semibold text-text-secondary uppercase mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="input-field w-full px-3 py-2 rounded-xl resize-none text-sm"
                      placeholder="Add transaction notes..."
                    />
                  </div>
                </>
              )}

              {/* Totals */}
              {cart.length > 0 && (
                <div className="border-t-2 border-dashed border-border-medium pt-4 mb-4 space-y-2">
                  <div className="flex justify-between text-sm font-rajdhani">
                    <span className="text-text-muted">Items:</span>
                    <span className="font-semibold text-text-secondary">{cartItemsCount}</span>
                  </div>
                  <div className="flex justify-between text-lg font-rajdhani font-bold">
                    <span className="text-text-primary">Total:</span>
                    <span className="text-neon-blue">₱{cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Process Button */}
              <button
                onClick={processTransaction}
                disabled={cart.length === 0}
                className={`w-full py-4 rounded-xl font-rajdhani font-bold text-base flex items-center justify-center gap-2 transition-all ${
                  cart.length === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'btn-primary'
                }`}
              >
                <CheckCircleIcon className="h-5 w-5" />
                Process Transaction
              </button>
            </div>
          </div>
        </div>

        {/* Product Quantity Modal */}
        <ProductQuantityModal
          isOpen={showQuantityModal}
          onClose={() => {
            setShowQuantityModal(false)
            setSelectedProduct(null)
          }}
          onConfirm={handleQuantityConfirm}
          product={selectedProduct}
        />

        {/* Receipt Modal */}
        {showReceipt && receiptData && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 modal-backdrop" onClick={() => setShowReceipt(false)} />

              <div className="relative w-full max-w-lg animate-slide-in">
                <div className="rounded-2xl bg-white shadow-large overflow-hidden">
                  {/* Header */}
                  <div className="px-6 py-5 border-b border-border-light bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="stat-gradient-green p-2.5 rounded-xl shadow-md">
                        <CheckCircleIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold font-orbitron text-text-primary">Transaction Complete!</h3>
                        <p className="text-sm text-text-muted font-rajdhani">Receipt generated successfully</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowReceipt(false)}
                      className="text-text-muted hover:text-text-primary p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Receipt Content */}
                  <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <Receipt
                      receiptData={receiptData}
                      showActions={false}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="px-6 py-5 border-t border-border-light bg-bg-tertiary flex gap-3">
                    <button
                      onClick={() => downloadReceiptAsPDF(`receipt-${receiptData.id}`, receiptData.transactionNumber)}
                      className="btn-secondary flex-1 px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-rajdhani font-semibold"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      PDF
                    </button>
                    <button
                      onClick={() => downloadReceiptAsImage(`receipt-${receiptData.id}`, receiptData.transactionNumber)}
                      className="btn-secondary flex-1 px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-rajdhani font-semibold"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      Image
                    </button>
                    <button
                      onClick={() => setShowReceipt(false)}
                      className="btn-secondary px-4 py-3 rounded-xl font-rajdhani font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </POSLayout>
  )
}
