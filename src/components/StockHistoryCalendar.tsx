import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { StockHistory, Product } from '../types'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CubeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface StockHistoryCalendarProps {
  selectedProduct?: Product | null
}

interface DayEntry {
  date: string
  entries: StockHistory[]
}

export default function StockHistoryCalendar({ selectedProduct }: StockHistoryCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<DayEntry | null>(null)
  const [showDayModal, setShowDayModal] = useState(false)

  useEffect(() => {
    console.log('📅 StockHistoryCalendar - selectedProduct changed:', selectedProduct?.name || 'ALL PRODUCTS')
    fetchStockHistory()
  }, [selectedProduct])

  async function fetchStockHistory() {
    try {
      setLoading(true)
      console.log('📊 Fetching stock history...')
      
      let query = supabase
        .from('stock_history')
        .select('*')
        .order('created_at', { ascending: false })

      if (selectedProduct) {
        query = query.eq('product_id', selectedProduct.id)
        console.log('🔍 Filtering by product:', selectedProduct.name, selectedProduct.id)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }
      
      console.log('✅ Fetched stock history:', data?.length || 0, 'entries')
      if (data && data.length > 0) {
        console.log('📋 First entry:', data[0])
        console.log('📋 Sample dates:', data.slice(0, 3).map(d => ({
          product: d.product_name,
          action: d.action,
          quantity: d.quantity_change,
          created_at: d.created_at
        })))
      }
      
      setStockHistory(data || [])
    } catch (error) {
      console.error('❌ Error fetching stock history:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get days in month with calendar grid info
  const getCalendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    const startingDay = firstDayOfMonth.getDay() // 0 = Sunday
    const totalDays = lastDayOfMonth.getDate()

    const days: (number | null)[] = []

    // Add empty cells for days before the first day
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let i = 1; i <= totalDays; i++) {
      days.push(i)
    }

    return days
  }, [currentDate])

  // Group history by date
  const historyByDate = useMemo(() => {
    const grouped = new Map<string, StockHistory[]>()
    console.log('🗓️ Grouping stock history by date...')

    stockHistory.forEach(entry => {
      const dateKey = new Date(entry.created_at).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      console.log(`  📌 ${entry.product_name}: ${entry.action} ${entry.quantity_change} on ${dateKey} (created_at: ${entry.created_at})`)

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, [])
      }
      grouped.get(dateKey)!.push(entry)
    })

    console.log('🗓️ Grouped dates:', Array.from(grouped.keys()))
    return grouped
  }, [stockHistory])

  // Get summary for a specific date
  const getDateSummary = (day: number) => {
    const dateKey = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })

    const entries = historyByDate.get(dateKey) || []
    const additions = entries.filter(e => e.action === 'ADD').reduce((sum, e) => sum + e.quantity_change, 0)
    const removals = entries.filter(e => e.action === 'REMOVE').reduce((sum, e) => sum + Math.abs(e.quantity_change), 0)

    if (entries.length > 0) {
      console.log(`📍 Date ${dateKey} (Day ${day}): ${entries.length} entries, +${additions}/-${removals}`)
      console.log(`  Entries:`, entries.map(e => ({ product: e.product_name, action: e.action, qty: e.quantity_change })))
    }

    return { additions, removals, hasActivity: entries.length > 0, entries }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  function handlePrevMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  function handleNextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  function handleDayClick(day: number) {
    const summary = getDateSummary(day)
    if (summary.hasActivity) {
      const dateKey = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      ).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      setSelectedDay({ date: dateKey, entries: summary.entries })
      setShowDayModal(true)
    }
  }

  const today = new Date()
  const isToday = (day: number) =>
    day === today.getDate() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-border-light"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-neon-blue border-r-neon-orange border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <p className="text-text-secondary font-rajdhani text-base">Loading Stock History...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg bg-bg-tertiary border border-border-light hover:bg-neon-blue hover:text-white hover:border-neon-blue transition-all"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="stat-gradient-blue p-2.5 rounded-xl shadow-md">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-orbitron text-text-primary">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <p className="text-sm text-text-muted font-rajdhani">Stock movement calendar</p>
            </div>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg bg-bg-tertiary border border-border-light hover:bg-neon-blue hover:text-white hover:border-neon-blue transition-all"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
        <button
          onClick={() => setCurrentDate(new Date())}
          className="btn-secondary px-4 py-2 rounded-xl font-rajdhani font-semibold"
        >
          Today
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm font-rajdhani">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
          <span className="text-text-secondary">Stock Added</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
          <span className="text-text-secondary">Stock Removed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-r from-green-100 to-red-100 border border-border-light"></div>
          <span className="text-text-secondary">Both Actions</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl bg-white border border-border-light shadow-medium overflow-hidden">
        {/* Day Names Header */}
        <div className="grid grid-cols-7 border-b border-border-light bg-bg-tertiary">
          {dayNames.map(day => (
            <div
              key={day}
              className="py-3 text-center text-xs font-rajdhani font-semibold text-text-secondary uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {getCalendarDays.map((day, index) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-[120px] bg-bg-secondary/30 border-r border-b border-border-light"
                ></div>
              )
            }

            const summary = getDateSummary(day)
            const isTodayDay = isToday(day)

            let bgColor = 'bg-white'
            if (summary.additions > 0 && summary.removals > 0) {
              bgColor = 'bg-gradient-to-br from-green-50 to-red-50'
            } else if (summary.additions > 0) {
              bgColor = 'bg-green-50'
            } else if (summary.removals > 0) {
              bgColor = 'bg-red-50'
            }

            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                className={`min-h-[120px] p-2 border-r border-b border-border-light cursor-pointer transition-all hover:shadow-inner ${bgColor} ${
                  summary.hasActivity ? 'hover:scale-[1.02] hover:z-10' : ''
                } ${isTodayDay ? 'ring-2 ring-inset ring-neon-blue' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm font-bold font-rajdhani ${
                      isTodayDay
                        ? 'bg-neon-blue text-white px-2 py-0.5 rounded-full'
                        : 'text-text-primary'
                    }`}
                  >
                    {day}
                  </span>
                  {summary.hasActivity && (
                    <InformationCircleIcon className="h-4 w-4 text-text-muted" />
                  )}
                </div>

                {summary.hasActivity && (
                  <div className="space-y-1 max-h-[80px] overflow-y-auto">
                    {/* Show unique products with stock changes */}
                    {Array.from(new Set(summary.entries.map(e => e.product_name))).slice(0, 3).map((productName, idx) => {
                      const productEntries = summary.entries.filter(e => e.product_name === productName)
                      const totalAdded = productEntries.filter(e => e.action === 'ADD').reduce((sum, e) => sum + e.quantity_change, 0)
                      const totalRemoved = productEntries.filter(e => e.action === 'REMOVE').reduce((sum, e) => sum + Math.abs(e.quantity_change), 0)
                      
                      return (
                        <div key={idx} className="text-xs font-rajdhani py-0.5 px-1.5 rounded bg-white/70 border border-border-light">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-text-secondary truncate flex-1">{productName}</span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {totalAdded > 0 && (
                                <span className="text-green-600 font-semibold">+{totalAdded}</span>
                              )}
                              {totalRemoved > 0 && (
                                <span className="text-red-600 font-semibold">-{totalRemoved}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {Array.from(new Set(summary.entries.map(e => e.product_name))).length > 3 && (
                      <div className="text-xs text-text-muted font-rajdhani text-center pt-1">
                        +{Array.from(new Set(summary.entries.map(e => e.product_name))).length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Day Detail Modal */}
      {showDayModal && selectedDay && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 modal-backdrop" onClick={() => setShowDayModal(false)} />

            <div className="relative w-full max-w-2xl animate-slide-in">
              <div className="rounded-2xl bg-white shadow-large overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-border-light bg-gradient-to-r from-neon-blue/5 to-neon-orange/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="stat-gradient-blue p-2.5 rounded-xl shadow-md">
                        <CubeIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold font-orbitron text-text-primary">
                          {new Date(selectedDay.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <p className="text-sm text-text-muted font-rajdhani">
                          {selectedDay.entries.length} stock movement{selectedDay.entries.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDayModal(false)}
                      className="text-text-muted hover:text-text-primary p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Entries List */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-3">
                    {selectedDay.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className={`rounded-xl border p-4 transition-all ${
                          entry.action === 'ADD'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                entry.action === 'ADD'
                                  ? 'stat-gradient-green'
                                  : 'stat-gradient-orange'
                              }`}
                            >
                              {entry.action === 'ADD' ? (
                                <ArrowUpIcon className="h-5 w-5 text-white" />
                              ) : (
                                <ArrowDownIcon className="h-5 w-5 text-white" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold font-rajdhani text-text-primary">
                                {entry.product_name}
                              </h4>
                              <div className="flex items-center gap-3 mt-1">
                                <span
                                  className={`text-sm font-bold font-rajdhani ${
                                    entry.action === 'ADD' ? 'text-green-600' : 'text-red-600'
                                  }`}
                                >
                                  {entry.action === 'ADD' ? '+' : '-'}
                                  {Math.abs(entry.quantity_change)} units
                                </span>
                                <span className="text-xs text-text-muted font-rajdhani">
                                  {entry.quantity_before} → {entry.quantity_after}
                                </span>
                              </div>
                              {entry.notes && (
                                <p className="text-xs text-text-muted font-rajdhani mt-1">
                                  {entry.notes}
                                </p>
                              )}
                              <p className="text-xs text-text-muted font-rajdhani mt-1">
                                {new Date(entry.created_at).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Footer */}
                <div className="px-6 py-4 border-t border-border-light bg-bg-tertiary">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <ArrowUpIcon className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-rajdhani text-text-secondary">Total Added:</span>
                        <span className="text-sm font-bold font-rajdhani text-green-600">
                          {selectedDay.entries
                            .filter(e => e.action === 'ADD')
                            .reduce((sum, e) => sum + e.quantity_change, 0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowDownIcon className="h-5 w-5 text-red-600" />
                        <span className="text-sm font-rajdhani text-text-secondary">Total Removed:</span>
                        <span className="text-sm font-bold font-rajdhani text-red-600">
                          {selectedDay.entries
                            .filter(e => e.action === 'REMOVE')
                            .reduce((sum, e) => sum + Math.abs(e.quantity_change), 0)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDayModal(false)}
                      className="btn-secondary px-4 py-2 rounded-xl font-rajdhani font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
