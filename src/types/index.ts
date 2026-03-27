export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  selling_price: number;
  cost: number;
  created_at: string;
  updated_at: string;
  // Retail pricing fields
  is_retailable: boolean;
  units_per_pack: number;
  retail_price: number | null;
  // Size variant fields (Small, Medium, Large)
  has_size_variants: boolean;
  size_small_price: number | null;
  size_medium_price: number | null;
  size_large_price: number | null;
  // Inventory tracking
  track_inventory: boolean;
}

export interface Transaction {
  id: string;
  product_id: string;
  type: 'IN' | 'OUT';
  quantity: number;
  unit_cost: number;
  total_cost: number;
  selling_price?: number;
  total_revenue?: number;
  notes?: string;
  created_at: string;
  product?: Product;
}

export interface MonthlySummary {
  month: string;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selling_price: number;
  subtotal: number;
  is_retail: boolean;  // true = sold by piece, false = sold by pack
  size?: 'small' | 'medium' | 'large';  // for size variant products
}

export interface ReceiptData {
  id: string;
  transactionNumber: string;
  date: string;
  type: 'SALE' | 'RESTOCK' | 'RETURN' | 'ADJUSTMENT';
  customerName?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  cashier?: string;
}
