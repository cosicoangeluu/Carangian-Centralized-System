import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { Transaction, Product, ReceiptData } from '../types'
import { printReceipt, downloadReceiptAsPDF } from '../utils/receiptUtils'
import Receipt from '../components/Receipt'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CubeIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  EyeIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'

interface TransactionGroup {
  transactionNumber: string
  date: string
  type: 'SALE' | 'RESTOCK' | 'RETURN' | 'ADJUSTMENT'
  items: (Transaction & { product?: Product })[]
  totalRevenue: number
  totalCost: number
  notes?: string
}

function extractTransactionNumber(notes?: string): string {
  if (!notes) return 'UNKNOWN'
  
  // Try to match new format first: RCP-XXXX (4-digit number)
  const rcpMatch = notes.match(/RCP-\d{4}/)
  if (rcpMatch) return rcpMatch[0]
  
  // Try to match old format: TXN-XXXXX-XXX (alphanumeric)
  const txnMatch = notes.match(/TXN-\w+-\w+/)
  if (txnMatch) return txnMatch[0]
  
  return 'UNKNOWN'
}

function determineTransactionType(notes?: string): 'SALE' | 'RESTOCK' | 'RETURN' | 'ADJUSTMENT' {
  if (!notes) return 'ADJUSTMENT'
  if (notes.startsWith('SALE')) return 'SALE'
  if (notes.startsWith('RESTOCK')) return 'RESTOCK'
  if (notes.startsWith('RETURN')) return 'RETURN'
  return 'ADJUSTMENT'
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<(Transaction & { product?: Product })[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<TransactionGroup | null>(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  useEffect(() => {
    fetchTransactions()
  }, [])

  async function fetchTransactions() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          product:products (*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Group transactions by transaction number
  const transactionGroups = useMemo(() => {
    const groups = new Map<string, TransactionGroup>()
    
    transactions.forEach(t => {
      const txnNumber = extractTransactionNumber(t.notes)
      const existing = groups.get(txnNumber)
      
      if (existing) {
        existing.items.push(t)
        existing.totalRevenue += t.total_revenue || 0
        existing.totalCost += t.total_cost
      } else {
        groups.set(txnNumber, {
          transactionNumber: txnNumber,
          date: t.created_at,
          type: determineTransactionType(t.notes),
          items: [t],
          totalRevenue: t.total_revenue || 0,
          totalCost: t.total_cost,
          notes: t.notes
        })
      }
    })
    
    return Array.from(groups.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [transactions])

  const totalIn = transactionGroups.filter(t => t.type === 'RESTOCK' || t.type === 'RETURN').length
  const totalOut = transactionGroups.filter(t => t.type === 'SALE' || t.type === 'ADJUSTMENT').length
  const totalRevenue = transactionGroups.reduce((sum, t) => sum + t.totalRevenue, 0)

  function handleViewDetails(group: TransactionGroup) {
    setSelectedGroup(group)
    setShowReceiptModal(true)
  }

  function handleCloseModal() {
    setShowReceiptModal(false)
    setSelectedGroup(null)
  }

  function handlePrintReceipt() {
    if (selectedGroup) {
      printReceipt(`receipt-${selectedGroup.transactionNumber}`)
    }
  }

  function handleDownloadReceipt() {
    if (selectedGroup) {
      downloadReceiptAsPDF(`receipt-${selectedGroup.transactionNumber}`, selectedGroup.transactionNumber)
    }
  }

  // Convert TransactionGroup to ReceiptData for the Receipt component
  const receiptData: ReceiptData | null = useMemo(() => {
    if (!selectedGroup) return null
    
    return {
      id: selectedGroup.transactionNumber,
      transactionNumber: selectedGroup.transactionNumber,
      date: new Date(selectedGroup.date).toLocaleString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      type: selectedGroup.type,
      items: selectedGroup.items.map(item => ({
        name: item.product?.name || 'Unknown',
        sku: '',
        quantity: item.quantity,
        unitPrice: item.type === 'OUT' && item.total_revenue ? item.total_revenue / item.quantity : item.unit_cost,
        total: item.type === 'OUT' && item.total_revenue ? item.total_revenue : item.total_cost
      })),
      subtotal: selectedGroup.totalRevenue > 0 ? selectedGroup.totalRevenue : selectedGroup.totalCost,
      tax: 0,
      total: selectedGroup.totalRevenue > 0 ? selectedGroup.totalRevenue : selectedGroup.totalCost,
      notes: selectedGroup.notes
    }
  }, [selectedGroup])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-border-light"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-neon-blue border-r-neon-orange border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <p className="text-text-secondary font-rajdhani text-base">Loading Transactions...</p>
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
            <span className="gradient-text">TRANSACTION HISTORY</span>
          </h1>
          <p className="text-text-secondary mt-1 font-rajdhani text-base">Complete log of all POS transactions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white p-5 border border-border-light shadow-soft card-hover">
          <div className="flex items-center gap-3">
            <div className="stat-gradient-blue p-3 rounded-xl shadow-lg">
              <ClockIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-text-muted font-rajdhani uppercase">Total</p>
              <p className="text-2xl font-bold font-orbitron text-text-primary">{transactionGroups.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 border border-border-light shadow-soft card-hover">
          <div className="flex items-center gap-3">
            <div className="stat-gradient-green p-3 rounded-xl shadow-lg">
              <ArrowUpIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-text-muted font-rajdhani uppercase">Stock In</p>
              <p className="text-2xl font-bold font-orbitron text-green-600">{totalIn}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 border border-border-light shadow-soft card-hover">
          <div className="flex items-center gap-3">
            <div className="stat-gradient-orange p-3 rounded-xl shadow-lg">
              <ArrowDownIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-text-muted font-rajdhani uppercase">Stock Out</p>
              <p className="text-2xl font-bold font-orbitron text-text-primary">{totalOut}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 border border-border-light shadow-soft card-hover">
          <div className="flex items-center gap-3">
            <div className="stat-gradient-yellow p-3 rounded-xl shadow-lg">
              <DocumentTextIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-text-muted font-rajdhani uppercase">Revenue</p>
              <p className="text-2xl font-bold font-orbitron text-text-primary">₱{totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="rounded-2xl bg-white border border-border-light shadow-medium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border-light bg-bg-tertiary">
                <th className="px-6 py-4 text-left text-xs font-rajdhani font-semibold text-text-secondary uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-rajdhani font-semibold text-text-secondary uppercase tracking-wider">Receipt No.</th>
                <th className="px-6 py-4 text-left text-xs font-rajdhani font-semibold text-text-secondary uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-rajdhani font-semibold text-text-secondary uppercase tracking-wider">Items</th>
                <th className="px-6 py-4 text-left text-xs font-rajdhani font-semibold text-text-secondary uppercase tracking-wider">Total Cost</th>
                <th className="px-6 py-4 text-left text-xs font-rajdhani font-semibold text-text-secondary uppercase tracking-wider">Total Revenue</th>
                <th className="px-6 py-4 text-left text-xs font-rajdhani font-semibold text-text-secondary uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {transactionGroups.map((group) => {
                return (
                  <tr key={group.transactionNumber} className="table-row-hover">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-bg-tertiary border border-border-light flex items-center justify-center">
                          <ClockIcon className="h-4 w-4 text-neon-blue" />
                        </div>
                        <div>
                          <span className="text-sm font-rajdhani text-text-secondary block">
                            {new Date(group.date).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-text-muted font-rajdhani">
                            {new Date(group.date).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold font-rajdhani text-text-primary">{group.transactionNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-rajdhani font-semibold uppercase ${
                        group.type === 'SALE' || group.type === 'ADJUSTMENT' ? 'badge-out' : 'badge-in'
                      }`}>
                        {group.type === 'SALE' || group.type === 'ADJUSTMENT' ? <ArrowDownIcon className="h-3 w-3" /> : <ArrowUpIcon className="h-3 w-3" />}
                        {group.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-bg-tertiary border border-border-light flex items-center justify-center">
                          <CubeIcon className="h-4 w-4 text-neon-yellow" />
                        </div>
                        <span className="text-sm font-bold font-rajdhani text-text-primary">{group.items.length} item{group.items.length > 1 ? 's' : ''}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-rajdhani text-purple-600 font-semibold">₱{group.totalCost.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {group.totalRevenue > 0 ? (
                        <span className="text-sm font-rajdhani text-green-600 font-semibold">₱{group.totalRevenue.toFixed(2)}</span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleViewDetails(group)}
                        style={{ backgroundColor: '#ffffff', color: '#000000', border: '2px solid #00a8cc' }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-rajdhani font-semibold transition-all shadow-md hover:bg-neon-blue hover:text-white hover:border-neon-blue hover:shadow-lg"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
              {transactionGroups.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-bg-tertiary border border-border-light flex items-center justify-center mb-4">
                        <ArrowsRightLeftIcon className="h-8 w-8 text-text-muted" />
                      </div>
                      <p className="text-text-secondary font-rajdhani text-base">No transactions yet</p>
                      <p className="text-text-muted font-rajdhani text-sm mt-1">Use the POS system to record your first transaction</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={handleCloseModal} />

            <div className="relative w-full max-w-lg animate-slide-in">
              <div className="rounded-2xl bg-white shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-border-light bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="stat-gradient-green p-2.5 rounded-xl shadow-md">
                      <CheckCircleSolid className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-orbitron text-text-primary">Transaction Details</h3>
                      <p className="text-sm text-text-muted font-rajdhani">Receipt generated successfully</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-text-muted hover:text-text-primary p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Receipt Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  <Receipt
                    receiptData={receiptData}
                    showActions={false}
                  />
                </div>

                {/* Action Buttons */}
                <div className="px-6 py-5 border-t border-border-light bg-bg-tertiary flex gap-3">
                  <button
                    onClick={handlePrintReceipt}
                    className="btn-primary flex-1 px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-rajdhani font-semibold"
                  >
                    <PrinterIcon className="h-5 w-5" />
                    Print
                  </button>
                  <button
                    onClick={handleDownloadReceipt}
                    className="btn-secondary flex-1 px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-rajdhani font-semibold"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    Download PDF
                  </button>
                  <button
                    onClick={handleCloseModal}
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
  )
}
