/**
 * @typedef {Object} DailySales
 * @property {string} date
 * @property {string} label
 * @property {number} total
 */

/**
 * @typedef {Object} TopProduct
 * @property {number} product_id
 * @property {string} product_name
 * @property {number} sold
 * @property {string} revenue
 */

/**
 * @typedef {Object} PaymentStat
 * @property {string} payment_method
 * @property {number} count
 * @property {string} total
 */

/**
 * @typedef {Object} LowStockProduct
 * @property {number} product_id
 * @property {string} name
 * @property {string} outlet_name
 * @property {number} outlet_id
 * @property {number} stock
 * @property {number} threshold
 */

/**
 * @typedef {Object} RecentOrder
 * @property {number}       id
 * @property {string}       order_number
 * @property {string}       status
 * @property {number}       total_amount
 * @property {string|null}  customer
 * @property {string|null}  outlet
 * @property {string}       created_at
 */

/**
 * @typedef {Object} DashboardData
 * @property {{ today: number; today_growth: number; monthly: number; monthly_growth: number; avg_order: number; last_7_days: DailySales[] }} sales
 * @property {{ today: number; completed: number; pending: number }} orders
 * @property {number} outlets
 * @property {{ total: number; new_this_week: number }} customers
 * @property {TopProduct[]}      top_products
 * @property {PaymentStat[]}     payment_method_stats
 * @property {LowStockProduct[]} low_stock_products
 * @property {RecentOrder[]}     recent_orders
 */
