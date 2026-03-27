import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Transaction, MonthlySummary } from '../types'
import { CalendarIcon, CurrencyDollarIcon, ChartBarIcon as TrendingUpIcon, ChartBarIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'

export default function MonthlyReport() {
  const [summaries, setSummaries] = useState<MonthlySummary[]>([])
  const [selectedMonth, setSelectedMonth] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMonthlySummaries()
  }, [])

  async function fetchMonthlySummaries() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const monthlyData = new Map<string, { revenue: number; cost: number }>()

      data?.forEach((transaction: Transaction) => {
        const date = new Date(transaction.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { revenue: 0, cost: 0 })
        }

        const monthData = monthlyData.get(monthKey)!

        if (transaction.type === 'OUT') {
          monthData.revenue += transaction.total_revenue || 0
          monthData.cost += transaction.total_cost || 0
        }
      })

      const summaryArray: MonthlySummary[] = Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        total_revenue: data.revenue,
        total_cost: data.cost,
        gross_profit: data.revenue - data.cost
      })).sort((a, b) => b.month.localeCompare(a.month))

      setSummaries(summaryArray)

      if (summaryArray.length > 0 && !selectedMonth) {
        setSelectedMonth(summaryArray[0].month)
      }
    } catch (error) {
      console.error('Error fetching summaries:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedSummary = summaries.find(s => s.month === selectedMonth)
  const previousSummary = summaries.find(s => s.month !== selectedMonth)
  
  const revenueChange = selectedSummary && previousSummary 
    ? selectedSummary.total_revenue - previousSummary.total_revenue 
    : 0
  const profitChange = selectedSummary && previousSummary 
    ? selectedSummary.gross_profit - previousSummary.gross_profit 
    : 0

  const months = summaries.map(s => {
    const [year, month] = s.month.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return {
      value: s.month,
      fullLabel: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-border-light"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-neon-blue border-r-neon-orange border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <p className="text-text-secondary font-rajdhani text-base">Loading Reports...</p>
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
            <span className="gradient-text">MONTHLY REPORT</span>
          </h1>
          <p className="text-text-secondary mt-1 font-rajdhani text-base">Financial performance analytics by month</p>
        </div>
      </div>

      {/* Month Selector */}
      {months.length > 0 && (
        <div className="rounded-xl bg-white p-4 border border-border-light shadow-soft">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-neon-blue/10 border border-border-light">
                <CalendarIcon className="h-5 w-5 text-neon-blue" />
              </div>
              <label className="text-sm font-rajdhani font-semibold text-text-secondary uppercase">Select Period</label>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-64 px-4 py-2.5 rounded-xl bg-bg-tertiary border border-border-light text-text-primary font-rajdhani focus:border-neon-blue focus:outline-none [&>option]:bg-white [&>option]:text-text-primary"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.fullLabel}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {selectedSummary && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Revenue Card */}
            <div className="rounded-2xl bg-white p-6 border border-border-light shadow-medium card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="stat-gradient-green p-3 rounded-xl shadow-lg">
                  <CurrencyDollarIcon className="h-6 w-6 text-white" />
                </div>
                {revenueChange !== 0 && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-rajdhani font-semibold ${
                    revenueChange > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {revenueChange > 0 ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                    {Math.abs(revenueChange).toFixed(2)}
                  </div>
                )}
              </div>
              <p className="text-sm font-rajdhani text-text-muted uppercase tracking-wide">Total Revenue</p>
              <p className="text-3xl font-bold font-orbitron text-green-600 mt-1">
                ₱{selectedSummary.total_revenue.toFixed(2)}
              </p>
            </div>

            {/* COGS Card */}
            <div className="rounded-2xl bg-white p-6 border border-border-light shadow-medium card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="stat-gradient-purple p-3 rounded-xl shadow-lg">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-sm font-rajdhani text-text-muted uppercase tracking-wide">Total COGS</p>
              <p className="text-3xl font-bold font-orbitron text-purple-600 mt-1">
                ₱{selectedSummary.total_cost.toFixed(2)}
              </p>
            </div>

            {/* Gross Profit Card */}
            <div className="rounded-2xl bg-white p-6 border border-border-light shadow-medium card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="stat-gradient-yellow p-3 rounded-xl shadow-lg">
                  <TrendingUpIcon className="h-6 w-6 text-white" />
                </div>
                {profitChange !== 0 && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-rajdhani font-semibold ${
                    profitChange > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {profitChange > 0 ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                    {Math.abs(profitChange).toFixed(2)}
                  </div>
                )}
              </div>
              <p className="text-sm font-rajdhani text-text-muted uppercase tracking-wide">Gross Profit</p>
              <p className={`text-3xl font-bold font-orbitron mt-1 ${
                selectedSummary.gross_profit >= 0 ? 'gradient-text' : 'text-red-500'
              }`}>
                ₱{selectedSummary.gross_profit.toFixed(2)}
              </p>
              
              {/* Profit Margin Bar */}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden border border-border-light">
                  <div 
                    className="h-full bg-gradient-to-r from-neon-yellow via-neon-orange to-green-500 rounded-full"
                    style={{ width: `${Math.min(Math.max((selectedSummary.gross_profit / selectedSummary.total_revenue) * 100, 0), 100)}%` }}
                  ></div>
                </div>
                <span className={`text-sm font-bold font-orbitron ${
                  selectedSummary.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedSummary.total_revenue > 0
                    ? ((selectedSummary.gross_profit / selectedSummary.total_revenue) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="rounded-2xl bg-white border border-border-light shadow-medium p-6">
            <h3 className="text-lg font-bold font-orbitron text-text-primary mb-6 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neon-blue/10 border border-border-light">
                <ChartBarIcon className="h-5 w-5 text-neon-blue" />
              </div>
              Performance Analytics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="space-y-4">
                <h4 className="text-sm font-rajdhani text-text-secondary uppercase">Revenue vs COGS</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-rajdhani mb-1">
                      <span className="text-green-600 font-semibold">Revenue</span>
                      <span className="text-text-secondary">₱{selectedSummary.total_revenue.toFixed(2)}</span>
                    </div>
                    <div className="h-4 bg-bg-tertiary rounded-full overflow-hidden border border-border-light">
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-rajdhani mb-1">
                      <span className="text-purple-600 font-semibold">COGS</span>
                      <span className="text-text-secondary">₱{selectedSummary.total_cost.toFixed(2)}</span>
                    </div>
                    <div className="h-4 bg-bg-tertiary rounded-full overflow-hidden border border-border-light">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        style={{ width: `${selectedSummary.total_revenue > 0 ? (selectedSummary.total_cost / selectedSummary.total_revenue) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-rajdhani mb-1">
                      <span className="text-text-primary font-semibold">Profit</span>
                      <span className="text-text-secondary">₱{selectedSummary.gross_profit.toFixed(2)}</span>
                    </div>
                    <div className="h-4 bg-bg-tertiary rounded-full overflow-hidden border border-border-light">
                      <div 
                        className="h-full bg-gradient-to-r from-neon-yellow to-neon-orange rounded-full"
                        style={{ width: `${selectedSummary.total_revenue > 0 ? (selectedSummary.gross_profit / selectedSummary.total_revenue) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="space-y-4">
                <h4 className="text-sm font-rajdhani text-text-secondary uppercase">Key Metrics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-bg-tertiary border border-border-light">
                    <p className="text-xs text-text-muted font-rajdhani uppercase">Gross Margin</p>
                    <p className={`text-xl font-bold font-orbitron mt-1 ${
                      selectedSummary.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedSummary.total_revenue > 0
                        ? ((selectedSummary.gross_profit / selectedSummary.total_revenue) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-bg-tertiary border border-border-light">
                    <p className="text-xs text-text-muted font-rajdhani uppercase">COGS Ratio</p>
                    <p className="text-xl font-bold font-orbitron text-purple-600 mt-1">
                      {selectedSummary.total_revenue > 0
                        ? ((selectedSummary.total_cost / selectedSummary.total_revenue) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-bg-tertiary border border-border-light">
                    <p className="text-xs text-text-muted font-rajdhani uppercase">Revenue/Cost</p>
                    <p className="text-xl font-bold font-orbitron text-neon-blue mt-1">
                      {selectedSummary.total_cost > 0
                        ? (selectedSummary.total_revenue / selectedSummary.total_cost).toFixed(2)
                        : '0.00'}x
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-bg-tertiary border border-border-light">
                    <p className="text-xs text-text-muted font-rajdhani uppercase">Profit Factor</p>
                    <p className="text-xl font-bold font-orbitron text-text-primary mt-1">
                      {selectedSummary.total_cost > 0
                        ? (selectedSummary.gross_profit / selectedSummary.total_cost).toFixed(2)
                        : '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Historical Table */}
      <div className="rounded-2xl bg-white border border-border-light shadow-medium overflow-hidden">
        <div className="px-6 py-4 border-b border-border-light bg-bg-tertiary">
          <h3 className="text-lg font-bold font-orbitron text-text-primary">Historical Summary</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border-light bg-bg-tertiary">
                <th className="px-6 py-4 text-left text-xs font-rajdhani font-semibold text-text-secondary uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-neon-blue" />
                    Period
                  </div>
                </th>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {summaries.map((summary) => {
                const [year, month] = summary.month.split('-')
                const date = new Date(parseInt(year), parseInt(month) - 1)
                const margin = summary.total_revenue > 0
                  ? ((summary.gross_profit / summary.total_revenue) * 100)
                  : 0

                return (
                  <tr
                    key={summary.month}
                    className={`table-row-hover cursor-pointer ${
                      selectedMonth === summary.month ? 'bg-neon-blue/5' : ''
                    }`}
                    onClick={() => setSelectedMonth(summary.month)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          selectedMonth === summary.month ? 'bg-neon-blue' : 'bg-border-medium'
                        }`}></div>
                        <span className={`text-sm font-semibold font-rajdhani ${
                          selectedMonth === summary.month ? 'text-neon-blue' : 'text-text-primary'
                        }`}>
                          {date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-rajdhani text-green-600 font-semibold">
                        ₱{summary.total_revenue.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-rajdhani text-purple-600 font-semibold">
                        ₱{summary.total_cost.toFixed(2)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold font-rajdhani ${
                      summary.gross_profit >= 0 ? 'gradient-text' : 'text-red-500'
                    }`}>
                      ₱{summary.gross_profit.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-bg-tertiary rounded-full overflow-hidden border border-border-light">
                          <div 
                            className={`h-full rounded-full ${
                              margin >= 50 ? 'bg-green-500' : margin >= 20 ? 'bg-neon-yellow' : margin >= 0 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(Math.max(margin, 0), 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-bold font-orbitron ${
                          margin >= 50 ? 'text-green-600' : margin >= 20 ? 'text-text-primary' : margin >= 0 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {margin.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {summaries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-bg-tertiary border border-border-light flex items-center justify-center mb-4">
                        <ChartBarIcon className="h-8 w-8 text-text-muted" />
                      </div>
                      <p className="text-text-secondary font-rajdhani text-base">No data available</p>
                      <p className="text-text-muted font-rajdhani text-sm mt-1">Complete some transactions to see reports</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
