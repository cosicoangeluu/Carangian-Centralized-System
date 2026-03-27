import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  ChartBarIcon as TrendingUpIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarIcon,
  CubeTransparentIcon
} from '@heroicons/react/24/outline'

interface ProductProfit {
  product_id: string
  product_name: string
  category: string
  total_revenue: number
  total_cost: number
  gross_profit: number
  profit_margin: number
  units_sold: number
  transactions_count: number
}

export default function Profit() {
  const [productProfits, setProductProfits] = useState<ProductProfit[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(true)

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ]

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i
    return year.toString()
  })

  useEffect(() => {
    fetchProductProfits()
  }, [selectedMonth, selectedYear])

  async function fetchProductProfits() {
    try {
      setLoading(true)

      // Fetch all transactions with product info
      let query = supabase
        .from('transactions')
        .select(`
          *,
          product:products (*)
        `)

      // Filter by month/year if provided
      if (selectedMonth || selectedYear) {
        const startDate = new Date()
        const endDate = new Date()

        if (selectedMonth && selectedYear) {
          // Both month and year selected
          startDate.setFullYear(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1)
          startDate.setHours(0, 0, 0, 0)
          endDate.setFullYear(parseInt(selectedYear), parseInt(selectedMonth), 0)
          endDate.setHours(23, 59, 59, 999)
        } else if (selectedYear) {
          // Only year selected
          startDate.setFullYear(parseInt(selectedYear), 0, 1)
          startDate.setHours(0, 0, 0, 0)
          endDate.setFullYear(parseInt(selectedYear), 11, 31)
          endDate.setHours(23, 59, 59, 999)
        }

        query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString())
      }

      const { data: transactions, error } = await query

      if (error) throw error

      // Group by product and calculate profit
      const productProfitMap = new Map<string, {
        product_id: string
        product_name: string
        category: string
        revenue: number
        cost: number
        units_sold: number
        transactions: number
      }>()

      transactions?.forEach((transaction) => {
        const productId = transaction.product_id
        const productName = transaction.product?.name || 'Unknown Product'
        const category = transaction.product?.category || 'Uncategorized'

        if (!productProfitMap.has(productId)) {
          productProfitMap.set(productId, {
            product_id: productId,
            product_name: productName,
            category,
            revenue: 0,
            cost: 0,
            units_sold: 0,
            transactions: 0
          })
        }

        const productData = productProfitMap.get(productId)!

        if (transaction.type === 'OUT' || transaction.type === 'SALE' || transaction.type === 'ADJUSTMENT') {
          productData.revenue += transaction.total_revenue || 0
          productData.cost += transaction.total_cost || 0
          productData.units_sold += transaction.quantity
          productData.transactions += 1
        }
      })

      const profitData: ProductProfit[] = Array.from(productProfitMap.values()).map(product => ({
        product_id: product.product_id,
        product_name: product.product_name,
        category: product.category,
        total_revenue: product.revenue,
        total_cost: product.cost,
        gross_profit: product.revenue - product.cost,
        profit_margin: product.revenue > 0 ? ((product.revenue - product.cost) / product.revenue) * 100 : 0,
        units_sold: product.units_sold,
        transactions_count: product.transactions
      })).sort((a, b) => b.gross_profit - a.gross_profit)

      setProductProfits(profitData)
    } catch (error) {
      console.error('Error fetching product profits:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals
  const totalRevenue = productProfits.reduce((sum, p) => sum + p.total_revenue, 0)
  const totalCost = productProfits.reduce((sum, p) => sum + p.total_cost, 0)
  const totalProfit = productProfits.reduce((sum, p) => sum + p.gross_profit, 0)
  const totalUnitsSold = productProfits.reduce((sum, p) => sum + p.units_sold, 0)
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  const topProduct = productProfits.length > 0 ? productProfits[0] : null
  const highestMarginProduct = productProfits.reduce((prev, current) => 
    current.profit_margin > prev.profit_margin ? current : prev, productProfits[0] || null
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-border-light"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-neon-blue border-r-neon-orange border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <p className="text-text-secondary font-rajdhani text-base">Loading Profit Data...</p>
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
            <span className="gradient-text">PROFIT ANALYTICS</span>
          </h1>
          <p className="text-text-secondary mt-1 font-rajdhani text-base">Per-product profit performance and margins</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-white p-4 border border-border-light shadow-soft">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-neon-blue/10 border border-border-light">
              <CalendarIcon className="h-5 w-5 text-neon-blue" />
            </div>
            <label className="text-sm font-rajdhani font-semibold text-text-secondary uppercase">Filter by Period</label>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-bg-tertiary border border-border-light text-text-primary font-rajdhani focus:border-neon-blue focus:outline-none [&>option]:bg-white [&>option]:text-text-primary"
          >
            <option value="">All Months</option>
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-bg-tertiary border border-border-light text-text-primary font-rajdhani focus:border-neon-blue focus:outline-none [&>option]:bg-white [&>option]:text-text-primary"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-2xl bg-white p-6 border border-border-light shadow-medium card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="stat-gradient-green p-3 rounded-xl shadow-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-rajdhani text-text-muted uppercase tracking-wide">Total Revenue</p>
          <p className="text-3xl font-bold font-orbitron text-green-600 mt-1">
            ₱{totalRevenue.toFixed(2)}
          </p>
        </div>

        {/* Total COGS */}
        <div className="rounded-2xl bg-white p-6 border border-border-light shadow-medium card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="stat-gradient-purple p-3 rounded-xl shadow-lg">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-rajdhani text-text-muted uppercase tracking-wide">Total COGS</p>
          <p className="text-3xl font-bold font-orbitron text-purple-600 mt-1">
            ₱{totalCost.toFixed(2)}
          </p>
        </div>

        {/* Total Gross Profit */}
        <div className="rounded-2xl bg-white p-6 border border-border-light shadow-medium card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="stat-gradient-yellow p-3 rounded-xl shadow-lg">
              <TrendingUpIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-rajdhani text-text-muted uppercase tracking-wide">Gross Profit</p>
          <p className={`text-3xl font-bold font-orbitron mt-1 ${
            totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ₱{totalProfit.toFixed(2)}
          </p>
        </div>

        {/* Overall Margin */}
        <div className="rounded-2xl bg-white p-6 border border-border-light shadow-medium card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-neon-blue to-cyan-500 shadow-lg">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-rajdhani text-text-muted uppercase tracking-wide">Profit Margin</p>
          <p className={`text-3xl font-bold font-orbitron mt-1 ${
            overallMargin >= 50 ? 'text-green-600' : overallMargin >= 20 ? 'text-text-primary' : overallMargin >= 0 ? 'text-orange-600' : 'text-red-600'
          }`}>
            {overallMargin.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      {productProfits.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Profit Product */}
          {topProduct && (
            <div className="rounded-2xl bg-white p-6 border border-border-light shadow-medium">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-green-50 border border-green-200">
                  <TrendingUpIcon className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-bold font-orbitron text-text-primary">Top Profit Product</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CubeTransparentIcon className="h-4 w-4 text-text-muted" />
                  <span className="text-base font-bold font-rajdhani text-text-primary">{topProduct.product_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-muted font-rajdhani">Profit</span>
                  <span className={`text-xl font-bold font-orbitron ${
                    topProduct.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>₱{topProduct.gross_profit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-muted font-rajdhani">Margin</span>
                  <span className="text-lg font-bold font-orbitron text-green-600">{topProduct.profit_margin.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-muted font-rajdhani">Units Sold</span>
                  <span className="text-lg font-bold font-orbitron text-text-primary">{topProduct.units_sold}</span>
                </div>
              </div>
            </div>
          )}

          {/* Highest Margin Product */}
          {highestMarginProduct && (
            <div className="rounded-2xl bg-white p-6 border border-border-light shadow-medium">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-neon-yellow/20 border border-neon-yellow/30">
                  <ChartBarIcon className="h-5 w-5 text-neon-orange" />
                </div>
                <h3 className="text-lg font-bold font-orbitron text-text-primary">Highest Margin</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CubeTransparentIcon className="h-4 w-4 text-text-muted" />
                  <span className="text-base font-bold font-rajdhani text-text-primary">{highestMarginProduct.product_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-muted font-rajdhani">Profit Margin</span>
                  <span className="text-xl font-bold font-orbitron text-neon-orange">{highestMarginProduct.profit_margin.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-muted font-rajdhani">Profit</span>
                  <span className={`text-lg font-bold font-orbitron ${
                    highestMarginProduct.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>₱{highestMarginProduct.gross_profit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-muted font-rajdhani">Revenue</span>
                  <span className="text-lg font-bold font-orbitron text-green-600">₱{highestMarginProduct.total_revenue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product Profit Table */}
      <div className="rounded-2xl bg-white border border-border-light shadow-medium overflow-hidden">
        <div className="px-6 py-4 border-b border-border-light bg-bg-tertiary">
          <h3 className="text-lg font-bold font-orbitron text-text-primary flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neon-blue/10 border border-border-light">
              <CubeTransparentIcon className="h-5 w-5 text-neon-blue" />
            </div>
            Product Profit Breakdown
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border-light bg-bg-tertiary">
                <th className="px-6 py-4 text-left text-xs font-rajdhani font-semibold text-text-secondary uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-left text-xs font-rajdhani font-semibold text-text-secondary uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-rajdhani font-semibold text-text-secondary uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
                    Revenue
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-rajdhani font-semibold text-text-secondary uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <ChartBarIcon className="h-4 w-4 text-purple-600" />
                    COGS
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-rajdhani font-semibold text-text-secondary uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <TrendingUpIcon className="h-4 w-4 text-text-primary" />
                    Gross Profit
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-rajdhani font-semibold text-text-secondary uppercase tracking-wider">Margin</th>
                <th className="px-6 py-4 text-left text-xs font-rajdhani font-semibold text-text-secondary uppercase tracking-wider">Units Sold</th>
                <th className="px-6 py-4 text-left text-xs font-rajdhani font-semibold text-text-secondary uppercase tracking-wider">Transactions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {productProfits.map((product) => {
                const marginColor = product.profit_margin >= 50 ? 'text-green-600' 
                  : product.profit_margin >= 20 ? 'text-text-primary' 
                  : product.profit_margin >= 0 ? 'text-orange-600' 
                  : 'text-red-600'
                
                const barColor = product.profit_margin >= 50 ? 'bg-green-500' 
                  : product.profit_margin >= 20 ? 'bg-neon-yellow' 
                  : product.profit_margin >= 0 ? 'bg-orange-500' 
                  : 'bg-red-500'

                return (
                  <tr key={product.product_id} className="table-row-hover">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-neon-blue"></div>
                        <span className="text-sm font-semibold font-rajdhani text-text-primary">
                          {product.product_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border-light text-xs font-rajdhani font-medium text-text-secondary">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-rajdhani text-green-600 font-semibold">
                        ₱{product.total_revenue.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-rajdhani text-purple-600 font-semibold">
                        ₱{product.total_cost.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-bold font-rajdhani ${
                        product.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ₱{product.gross_profit.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-bg-tertiary rounded-full overflow-hidden border border-border-light">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${Math.min(Math.max(product.profit_margin, 0), 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-bold font-orbitron ${marginColor}`}>
                          {product.profit_margin.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-rajdhani text-text-primary font-medium">
                        {product.units_sold}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-md bg-bg-tertiary border border-border-light text-xs font-rajdhani text-text-secondary font-medium">
                        {product.transactions_count}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {productProfits.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-bg-tertiary border border-border-light flex items-center justify-center mb-4">
                        <TrendingUpIcon className="h-8 w-8 text-text-muted" />
                      </div>
                      <p className="text-text-secondary font-rajdhani text-base">No profit data available</p>
                      <p className="text-text-muted font-rajdhani text-sm mt-1">Complete some OUT transactions to see profit analytics</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {productProfits.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border-light bg-bg-tertiary">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold font-orbitron text-text-primary">TOTAL</span>
                  </td>
                  <td></td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold font-orbitron text-green-600">₱{totalRevenue.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold font-orbitron text-purple-600">₱{totalCost.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-bold font-orbitron ${
                      totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₱{totalProfit.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-bold font-orbitron ${
                      overallMargin >= 50 ? 'text-green-600' : overallMargin >= 20 ? 'text-text-primary' : overallMargin >= 0 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {overallMargin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold font-orbitron text-text-primary">{totalUnitsSold}</span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
