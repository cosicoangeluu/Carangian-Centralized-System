import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CubeIcon, ArrowUpIcon, CurrencyDollarIcon, ArrowsRightLeftIcon, ChartBarIcon as TrendingUpIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface CategorySales {
  category: string
  revenue: number
  cost: number
  profit: number
  transactions: number
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    totalCost: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [categorySales, setCategorySales] = useState<CategorySales[]>([])

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  useEffect(() => {
    fetchStats()
  }, [selectedMonth, selectedYear])

  function getMonthDateRange(month: number, year: number) {
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)
    return {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    }
  }

  async function fetchStats() {
    try {
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      // Fetch all products to get all categories
      const { data: allProducts } = await supabase
        .from('products')
        .select('category')

      const { start, end } = getMonthDateRange(selectedMonth, selectedYear)

      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          *,
          products (
            category
          )
        `)
        .gte('created_at', start)
        .lte('created_at', end)

      const totalRevenue = transactions
        ?.filter(t => t.type === 'OUT' && t.total_revenue)
        .reduce((sum, t) => sum + (t.total_revenue || 0), 0) || 0

      const totalCost = transactions
        ?.filter(t => t.type === 'OUT')
        .reduce((sum, t) => sum + (t.total_cost || 0), 0) || 0

      // Get all unique categories from products
      const allCategories = new Set<string>()
      allProducts?.forEach(p => {
        if (p.category) allCategories.add(p.category)
      })

      // Calculate sales per category from transactions
      const categoryMap = new Map<string, { revenue: number; cost: number; profit: number; transactions: number }>()

      // Initialize all categories with zero values
      allCategories.forEach(category => {
        categoryMap.set(category, { revenue: 0, cost: 0, profit: 0, transactions: 0 })
      })

      // Add transaction data
      transactions
        ?.filter(t => t.type === 'OUT')
        .forEach(t => {
          const category = (t.products as any)?.category || 'Uncategorized'
          const existing = categoryMap.get(category) || { revenue: 0, cost: 0, profit: 0, transactions: 0 }
          const revenue = t.total_revenue || 0
          const cost = t.total_cost || 0
          const profit = revenue - cost
          categoryMap.set(category, {
            revenue: existing.revenue + revenue,
            cost: existing.cost + cost,
            profit: existing.profit + profit,
            transactions: existing.transactions + 1
          })
        })

      const categoryData: CategorySales[] = Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category,
          revenue: data.revenue,
          cost: data.cost,
          profit: data.profit,
          transactions: data.transactions
        }))
        .sort((a, b) => b.revenue - a.revenue)

      setCategorySales(categoryData)

      setStats({
        totalProducts: productsCount || 0,
        totalTransactions: transactions?.length || 0,
        totalRevenue,
        totalCost
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  function handlePrevMonth() {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  function handleNextMonth() {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  function handleResetToCurrent() {
    setSelectedMonth(new Date().getMonth())
    setSelectedYear(new Date().getFullYear())
  }

  const cards = [
    {
      name: 'Total Products',
      value: stats.totalProducts,
      icon: CubeIcon,
      gradient: 'stat-gradient-blue',
      color: 'text-neon-blue'
    },
    {
      name: 'Total Transactions',
      value: stats.totalTransactions,
      icon: ArrowsRightLeftIcon,
      gradient: 'stat-gradient-orange',
      color: 'text-neon-orange'
    },
    {
      name: 'Total Revenue',
      value: `₱${stats.totalRevenue.toFixed(2)}`,
      icon: ArrowUpIcon,
      gradient: 'stat-gradient-yellow',
      color: 'text-neon-yellow'
    },
    {
      name: 'Total COGS',
      value: `₱${stats.totalCost.toFixed(2)}`,
      icon: CurrencyDollarIcon,
      gradient: 'stat-gradient-purple',
      color: 'text-purple-500'
    }
  ]

  const grossProfit = stats.totalRevenue - stats.totalCost
  const profitMargin = stats.totalRevenue > 0 ? ((grossProfit / stats.totalRevenue) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-border-light"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-neon-blue border-r-neon-orange border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <p className="text-text-secondary font-rajdhani text-base">Loading Dashboard...</p>
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
            <span className="gradient-text">DASHBOARD</span>
          </h1>
          <p className="text-text-secondary mt-1 font-rajdhani text-base">Real-time inventory & financial analytics</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-border-light shadow-soft">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded hover:bg-bg-secondary transition-colors text-text-muted hover:text-text-primary"
              title="Previous Month"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-bg-secondary border border-border-light rounded px-2 py-1 text-sm text-text-primary font-rajdhani focus:outline-none focus:ring-2 focus:ring-neon-blue"
              >
                {months.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-bg-secondary border border-border-light rounded px-2 py-1 text-sm text-text-primary font-rajdhani focus:outline-none focus:ring-2 focus:ring-neon-blue"
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded hover:bg-bg-secondary transition-colors text-text-muted hover:text-text-primary"
              title="Next Month"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={handleResetToCurrent}
            style={{ backgroundColor: '#ffffff', color: '#000000', border: '2px solid #00a8cc' }}
            className="px-4 py-2 rounded-lg text-sm font-rajdhani font-semibold hover:bg-gray-50 transition-colors shadow-md"
            title="Reset to current month and year"
          >
            Reset to Current
          </button>
          <div className="px-4 py-2 rounded-lg bg-white border border-border-light shadow-soft">
            <p className="text-xs text-text-muted font-rajdhani">Last Updated</p>
            <p className="text-sm text-text-primary font-rajdhani font-semibold">{new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.name}
            className="relative overflow-hidden rounded-2xl bg-white p-5 border border-border-light shadow-soft card-hover"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-rajdhani text-text-muted uppercase tracking-wide">{card.name}</p>
                <p className="text-2xl font-bold font-orbitron text-text-primary mt-1">{card.value}</p>
              </div>
              <div className={`${card.gradient} p-3 rounded-xl shadow-lg`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gross Profit Card */}
      <div className="rounded-2xl bg-white border border-border-light shadow-medium p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="stat-gradient-green p-3 rounded-xl shadow-lg">
                <TrendingUpIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold font-orbitron text-text-primary">Gross Profit</h3>
            </div>
            <p className={`text-4xl font-bold font-orbitron ${grossProfit >= 0 ? 'gradient-text' : 'text-red-500'}`}>
              ₱{grossProfit.toFixed(2)}
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className={`px-3 py-1.5 rounded-lg ${grossProfit >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm font-rajdhani font-semibold ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {grossProfit >= 0 ? '▲' : '▼'} {Math.abs(profitMargin).toFixed(2)}% Margin
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border-light">
                <p className="text-xs text-text-muted font-rajdhani">
                  Revenue: <span className="text-neon-yellow font-semibold">₱{stats.totalRevenue.toFixed(2)}</span>
                </p>
                <p className="text-xs text-text-muted font-rajdhani">
                  COGS: <span className="text-purple-500 font-semibold">₱{stats.totalCost.toFixed(2)}</span>
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border-light">
                <p className="text-xs text-text-muted font-rajdhani">
                  Period: <span className="text-text-primary font-semibold">{months[selectedMonth]} {selectedYear}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Circular Progress */}
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e2e8f0"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="url(#gradient)"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${Math.min(profitMargin, 100) * 3.52} 352`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fbbf00" />
                    <stop offset="50%" stopColor="#ff6b00" />
                    <stop offset="100%" stopColor="#00a8cc" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xl font-bold font-orbitron text-text-primary">{profitMargin.toFixed(1)}%</p>
                  <p className="text-xs text-text-muted font-rajdhani">Profit Margin</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Per Category */}
      <div className="rounded-2xl bg-white border border-border-light shadow-medium p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold font-orbitron text-text-primary">SALES PER CATEGORY</h3>
            <p className="text-sm text-text-secondary font-rajdhani mt-1">Revenue breakdown by product category</p>
          </div>
          <div className="px-4 py-2 rounded-lg bg-bg-tertiary border border-border-light">
            <p className="text-xs text-text-muted font-rajdhani">
              Total: <span className="text-neon-yellow font-semibold">₱{stats.totalRevenue.toFixed(2)}</span>
            </p>
          </div>
        </div>

        {categorySales.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categorySales.map((category, index) => {
              const percentage = stats.totalRevenue > 0 
                ? ((category.revenue / stats.totalRevenue) * 100) 
                : 0
              const gradients = [
                'stat-gradient-blue',
                'stat-gradient-orange',
                'stat-gradient-yellow',
                'stat-gradient-green',
                'stat-gradient-purple',
                'bg-gradient-to-br from-pink-500 to-rose-500'
              ]
              const gradient = gradients[index % gradients.length]

              return (
                <div
                  key={category.category}
                  className="relative overflow-hidden rounded-xl bg-white p-4 border border-border-light shadow-soft card-hover"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`${gradient} p-2.5 rounded-lg shadow-lg`}>
                        <CubeIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold font-orbitron text-text-primary">
                          {category.category}
                        </p>
                        <p className="text-xs text-text-muted font-rajdhani">
                          {category.transactions} {category.transactions === 1 ? 'sale' : 'sales'}
                        </p>
                      </div>
                    </div>
                    <div className="px-2 py-1 rounded bg-bg-tertiary border border-border-light">
                      <p className="text-xs font-semibold font-rajdhani text-text-primary">
                        {percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-text-muted font-rajdhani">Revenue</p>
                      <p className="text-sm font-semibold font-rajdhani text-text-primary">₱{category.revenue.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-text-muted font-rajdhani">Cost</p>
                      <p className="text-sm font-semibold font-rajdhani text-text-primary">₱{category.cost.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border-light">
                      <p className="text-xs font-bold font-rajdhani text-text-muted">Profit</p>
                      <p className={`text-lg font-bold font-orbitron ${category.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ₱{category.profit.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-secondary flex items-center justify-center">
                <CubeIcon className="h-8 w-8 text-text-muted" />
              </div>
              <p className="text-text-secondary font-rajdhani text-base">No categories found</p>
              <p className="text-text-muted font-rajdhani text-sm mt-1">Add products with categories to see sales metrics</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
