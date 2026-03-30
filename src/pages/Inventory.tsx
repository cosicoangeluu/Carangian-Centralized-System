import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Product } from '../types'
import { PlusIcon, PencilIcon, TrashIcon, CubeIcon, TagIcon, FolderIcon } from '@heroicons/react/24/outline'
import ModalNotification from '../components/ModalNotification'

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    selling_price: 0,
    cost: 0,
    is_retailable: false,
    units_per_pack: 1,
    retail_price: 0,
    has_size_variants: false,
    size_small_price: 0,
    size_medium_price: 0,
    size_large_price: 0,
    track_inventory: true
  })
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  
  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])
  
  // Modal notification state
  const [showNotification, setShowNotification] = useState(false)
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'confirm'>('confirm')
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationMessage, setNotificationMessage] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const fetchedProducts = data || []
      setProducts(fetchedProducts)
      
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const finalCategory = showNewCategoryInput ? newCategoryName : formData.category

    // Validation: Ensure category is provided
    if (!finalCategory || finalCategory.trim() === '') {
      setNotificationType('error')
      setNotificationTitle('Validation Error')
      setNotificationMessage('Please select or enter a category for the product.')
      setShowNotification(true)
      return
    }

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({
            ...formData,
            category: finalCategory,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProduct.id)

        if (error) throw error

        // Show success notification for edit
        setNotificationType('success')
        setNotificationTitle('Product Updated')
        setNotificationMessage(`"${editingProduct.name}" has been successfully updated.`)
        setShowNotification(true)
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{
            ...formData,
            category: finalCategory,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])

        if (error) throw error

        // Show success notification for add
        setNotificationType('success')
        setNotificationTitle('Product Added')
        setNotificationMessage(`"${formData.name}" has been successfully added to inventory.`)
        setShowNotification(true)
      }

      setShowModal(false)
      setEditingProduct(null)
      setFormData({ name: '', category: '', quantity: 0, selling_price: 0, cost: 0, is_retailable: false, units_per_pack: 1, retail_price: 0, has_size_variants: false, size_small_price: 0, size_medium_price: 0, size_large_price: 0, track_inventory: true })
      setShowNewCategoryInput(false)
      setNewCategoryName('')
      fetchProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      // Log detailed error information for debugging
      if (error && typeof error === 'object') {
        if ('message' in error) console.error('Error message:', error.message)
        if ('code' in error) console.error('Error code:', error.code)
        if ('details' in error) console.error('Error details:', error.details)
        if ('hint' in error) console.error('Error hint:', error.hint)
      }
      setNotificationType('error')
      setNotificationTitle('Error')
      setNotificationMessage('Failed to save product. Please try again.')
      setShowNotification(true)
    }
  }

  async function handleDelete(id: string) {
    // Store the ID and show confirmation modal
    setPendingDeleteId(id)
    setNotificationType('confirm')
    setNotificationTitle('Delete Product')
    setNotificationMessage('Are you sure you want to delete this product? This action cannot be undone.')
    setShowNotification(true)
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', pendingDeleteId)

      if (error) throw error
      
      // Show success notification after delete
      setNotificationType('success')
      setNotificationTitle('Product Deleted')
      setNotificationMessage('The product has been successfully deleted.')
      setShowNotification(true)
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      setNotificationType('error')
      setNotificationTitle('Error')
      setNotificationMessage('Failed to delete product. Please try again.')
      setShowNotification(true)
    } finally {
      setPendingDeleteId(null)
    }
  }

  function handleEdit(product: Product) {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      selling_price: product.selling_price,
      cost: product.cost || 0,
      is_retailable: product.is_retailable || false,
      units_per_pack: product.units_per_pack || 1,
      retail_price: product.retail_price || 0,
      has_size_variants: product.has_size_variants || false,
      size_small_price: product.size_small_price || 0,
      size_medium_price: product.size_medium_price || 0,
      size_large_price: product.size_large_price || 0,
      track_inventory: product.track_inventory ?? true
    })
    setShowNewCategoryInput(false)
    setNewCategoryName('')
    setShowModal(true)
  }

  // Filter products by selected category
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory)

  const totalValue = filteredProducts.reduce((sum, p) => sum + (p.quantity * p.selling_price), 0)
  const lowStockProducts = filteredProducts.filter(p => p.quantity < 10).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-border-light"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-neon-blue border-r-neon-orange border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <p className="text-text-secondary font-rajdhani text-base">Loading Inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-orbitron text-text-primary flex items-center gap-3">
            <span className="gradient-text">INVENTORY</span>
          </h1>
          <p className="text-text-secondary mt-1 font-rajdhani text-base">Master product catalog & stock management</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-border-light shadow-soft">
            <FolderIcon className="h-5 w-5 text-neon-yellow" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-bg-secondary border border-border-light rounded px-2 py-1 text-sm text-text-primary font-rajdhani focus:outline-none focus:ring-2 focus:ring-neon-blue"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary px-5 py-2.5 rounded-xl flex items-center gap-2 font-rajdhani font-semibold"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white p-5 border border-border-light shadow-soft card-hover">
          <div className="flex items-center gap-3">
            <div className="stat-gradient-blue p-3 rounded-xl shadow-lg">
              <CubeIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-text-muted font-rajdhani uppercase">Total Products</p>
              <p className="text-2xl font-bold font-orbitron text-text-primary">{products.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 border border-border-light shadow-soft card-hover">
          <div className="flex items-center gap-3">
            <div className="stat-gradient-yellow p-3 rounded-xl shadow-lg">
              <TagIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-text-muted font-rajdhani uppercase">Inventory Value</p>
              <p className="text-2xl font-bold font-orbitron text-text-primary">₱{totalValue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 border border-border-light shadow-soft card-hover">
          <div className="flex items-center gap-3">
            <div className="stat-gradient-orange p-3 rounded-xl shadow-lg">
              <FolderIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-text-muted font-rajdhani uppercase">Low Stock Alert</p>
              <p className="text-2xl font-bold font-orbitron text-text-primary">{lowStockProducts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-border-light shadow-medium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border-light bg-bg-tertiary">
                <th className="px-6 py-4 text-left text-xs font-rajdhani font-semibold text-text-secondary uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <CubeIcon className="h-4 w-4 text-neon-blue" />
                    Product Name
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-rajdhani font-semibold text-text-secondary uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FolderIcon className="h-4 w-4 text-neon-yellow" />
                    Category
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-rajdhani font-semibold text-text-secondary uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-4 text-left text-xs font-rajdhani font-semibold text-text-secondary uppercase tracking-wider">
                  Selling Price
                </th>
                <th className="px-6 py-4 text-right text-xs font-rajdhani font-semibold text-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="table-row-hover">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-xl bg-bg-tertiary border border-border-light flex items-center justify-center">
                        <CubeIcon className="h-5 w-5 text-neon-blue" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold font-rajdhani text-text-primary">{product.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border-light text-xs font-rajdhani text-text-secondary font-medium">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.track_inventory !== false ? (
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold font-rajdhani ${
                          product.quantity < 10 ? 'text-red-500' : 'text-text-primary'
                        }`}>
                          {product.quantity}
                        </span>
                        {product.quantity < 10 && (
                          <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-xs text-red-600 font-semibold">
                            LOW
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-text-muted font-rajdhani">Not tracked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.has_size_variants ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-rajdhani text-text-secondary">S:</span>
                        <span className="text-sm font-rajdhani text-green-600 font-semibold">₱{product.size_small_price?.toFixed(2)}</span>
                        <span className="text-xs font-rajdhani text-text-secondary">|</span>
                        <span className="text-xs font-rajdhani text-text-secondary">M:</span>
                        <span className="text-sm font-rajdhani text-green-600 font-semibold">₱{product.size_medium_price?.toFixed(2)}</span>
                        <span className="text-xs font-rajdhani text-text-secondary">|</span>
                        <span className="text-xs font-rajdhani text-text-secondary">L:</span>
                        <span className="text-sm font-rajdhani text-green-600 font-semibold">₱{product.size_large_price?.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-rajdhani text-green-600 font-semibold">₱{product.selling_price.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 rounded-lg bg-bg-tertiary border border-border-light text-text-muted hover:text-neon-blue hover:border-neon-blue/30 transition-all"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 rounded-lg bg-bg-tertiary border border-border-light text-text-muted hover:text-red-500 hover:border-red-300 transition-all"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-bg-tertiary border border-border-light flex items-center justify-center mb-4">
                        <CubeIcon className="h-8 w-8 text-text-muted" />
                      </div>
                      <p className="text-text-secondary font-rajdhani text-base">
                        {selectedCategory === 'all' ? 'No products yet' : `No products in "${selectedCategory}" category`}
                      </p>
                      <p className="text-text-muted font-rajdhani text-sm mt-1">
                        {selectedCategory === 'all' ? 'Add your first product to get started' : 'Try selecting a different category'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 modal-backdrop" onClick={() => setShowModal(false)} />
            
            <div className="relative w-full max-w-lg animate-slide-in">
              <div className="rounded-2xl bg-white shadow-large overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-border-light bg-gradient-to-r from-neon-blue/5 to-neon-orange/5">
                  <div className="flex items-center gap-3">
                    <div className="stat-gradient-blue p-2.5 rounded-xl shadow-md">
                      <CubeIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-orbitron text-text-primary">
                        {editingProduct ? 'Edit Product' : 'Add Product'}
                      </h3>
                      <p className="text-sm text-text-muted font-rajdhani">
                        {editingProduct ? 'Update product information' : 'Create new inventory item'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <div>
                    <label className="block text-xs font-rajdhani font-semibold text-text-secondary uppercase mb-2">
                      Product Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field w-full px-4 py-3 rounded-xl"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-rajdhani font-semibold text-text-secondary uppercase mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      <select
                        value={showNewCategoryInput ? '__new__' : formData.category}
                        onChange={(e) => {
                          if (e.target.value === '__new__') {
                            setShowNewCategoryInput(true)
                            setNewCategoryName('')
                          } else {
                            setShowNewCategoryInput(false)
                            setFormData({ ...formData, category: e.target.value })
                          }
                        }}
                        className="input-field w-full px-4 py-3 rounded-xl"
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                        <option value="__new__">+ Add New Category</option>
                      </select>
                      {showNewCategoryInput && (
                        <input
                          type="text"
                          required
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="input-field w-full px-4 py-3 rounded-xl"
                          placeholder="Enter new category name"
                          autoFocus
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-rajdhani font-semibold text-text-secondary uppercase mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                        className="input-field w-full px-4 py-3 rounded-xl"
                        disabled={!formData.track_inventory}
                      />
                      {!formData.track_inventory && (
                        <p className="text-xs text-text-muted font-rajdhani mt-1">
                          Not tracked (unlimited)
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-rajdhani font-semibold text-text-secondary uppercase mb-2">
                        Selling Price (₱)
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.selling_price}
                        onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                        className="input-field w-full px-4 py-3 rounded-xl text-green-600 font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-rajdhani font-semibold text-text-secondary uppercase mb-2">
                      Cost (₱)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                      className="input-field w-full px-4 py-3 rounded-xl text-green-600 font-semibold"
                      placeholder="Price when product was bought"
                    />
                  </div>

                  {/* Retail Settings Section */}
                  <div className="border-t border-border-light pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        id="is_retailable"
                        checked={formData.is_retailable}
                        onChange={(e) => setFormData({ ...formData, is_retailable: e.target.checked })}
                        className="w-4 h-4 text-neon-blue border-border-light rounded focus:ring-neon-blue"
                      />
                      <label htmlFor="is_retailable" className="text-sm font-rajdhani font-semibold text-text-primary">
                        Enable Retail Pricing (Sell by piece)
                      </label>
                    </div>

                    {formData.is_retailable && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-rajdhani font-semibold text-text-secondary uppercase mb-2">
                            Units per Pack
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={formData.units_per_pack}
                            onChange={(e) => setFormData({ ...formData, units_per_pack: parseInt(e.target.value) || 1 })}
                            className="input-field w-full px-4 py-3 rounded-xl"
                            placeholder="e.g., 12"
                          />
                          <p className="text-xs text-text-muted font-rajdhani mt-1">
                            Pieces in one pack
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-rajdhani font-semibold text-text-secondary uppercase mb-2">
                            Retail Price per Piece (₱)
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={formData.retail_price}
                            onChange={(e) => setFormData({ ...formData, retail_price: parseFloat(e.target.value) || 0 })}
                            className="input-field w-full px-4 py-3 rounded-xl text-green-600 font-semibold"
                            placeholder="e.g., 15.00"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Size Variants Section */}
                  <div className="border-t border-border-light pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        id="has_size_variants"
                        checked={formData.has_size_variants}
                        onChange={(e) => setFormData({ ...formData, has_size_variants: e.target.checked, is_retailable: false })}
                        className="w-4 h-4 text-neon-blue border-border-light rounded focus:ring-neon-blue"
                      />
                      <label htmlFor="has_size_variants" className="text-sm font-rajdhani font-semibold text-text-primary">
                        Enable Size Variants (Small, Medium, Large)
                      </label>
                    </div>

                    {formData.has_size_variants && (
                      <>
                        <div className="mb-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="track_inventory"
                              checked={formData.track_inventory}
                              onChange={(e) => setFormData({ ...formData, track_inventory: e.target.checked })}
                              className="w-4 h-4 text-neon-blue border-border-light rounded focus:ring-neon-blue"
                            />
                            <label htmlFor="track_inventory" className="text-sm font-rajdhani font-semibold text-text-primary">
                              Track Inventory (disable for non-inventory items like beverages)
                            </label>
                          </div>
                          {!formData.track_inventory && (
                            <p className="text-xs text-text-muted font-rajdhani mt-1">
                              Quantity will not be deducted when selling
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-rajdhani font-semibold text-text-secondary uppercase mb-2">
                            Small Price (₱)
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={formData.size_small_price}
                            onChange={(e) => setFormData({ ...formData, size_small_price: parseFloat(e.target.value) || 0 })}
                            className="input-field w-full px-4 py-3 rounded-xl text-green-600 font-semibold"
                            placeholder="e.g., 25.00"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-rajdhani font-semibold text-text-secondary uppercase mb-2">
                            Medium Price (₱)
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={formData.size_medium_price}
                            onChange={(e) => setFormData({ ...formData, size_medium_price: parseFloat(e.target.value) || 0 })}
                            className="input-field w-full px-4 py-3 rounded-xl text-green-600 font-semibold"
                            placeholder="e.g., 35.00"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-rajdhani font-semibold text-text-secondary uppercase mb-2">
                            Large Price (₱)
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={formData.size_large_price}
                            onChange={(e) => setFormData({ ...formData, size_large_price: parseFloat(e.target.value) || 0 })}
                            className="input-field w-full px-4 py-3 rounded-xl text-green-600 font-semibold"
                            placeholder="e.g., 45.00"
                          />
                        </div>
                      </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn-secondary flex-1 px-4 py-3 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex-1 px-4 py-3 rounded-xl"
                    >
                      {editingProduct ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Notification */}
      <ModalNotification
        show={showNotification}
        type={notificationType}
        title={notificationTitle}
        message={notificationMessage}
        onConfirm={confirmDelete}
        onClose={() => setShowNotification(false)}
      />
    </div>
  )
}
