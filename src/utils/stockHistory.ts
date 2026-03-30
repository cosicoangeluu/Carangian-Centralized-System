import { supabase } from '../lib/supabase'

/**
 * Log a stock history entry to the database
 */
export async function logStockHistory(params: {
  productId: string
  productName: string
  action: 'ADD' | 'REMOVE'
  quantityChange: number
  quantityBefore: number
  quantityAfter: number
  notes?: string
  transactionId?: string
}) {
  try {
    const { error } = await supabase
      .from('stock_history')
      .insert([{
        product_id: params.productId,
        product_name: params.productName,
        action: params.action,
        quantity_change: params.quantityChange,
        quantity_before: params.quantityBefore,
        quantity_after: params.quantityAfter,
        notes: params.notes,
        transaction_id: params.transactionId,
        created_at: new Date().toISOString()
      }])

    if (error) {
      console.error('Error logging stock history:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Error logging stock history:', error)
    return false
  }
}
