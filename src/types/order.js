/**
 * @typedef {Object} OrderItem
 * @property {number} id
 * @property {number} product_id
 * @property {string} product_name
 * @property {string} product_sku
 * @property {string} unit_price
 * @property {number} quantity
 * @property {string} discount_amount
 * @property {string} subtotal
 */

/**
 * @typedef {Object} Payment
 * @property {number}      id
 * @property {string}      payment_method
 * @property {string}      amount
 * @property {string}      change_amount
 * @property {string}      status
 * @property {string|null} reference_number
 * @property {string}      paid_at
 */

/**
 * @typedef {Object} Order
 * @property {number}  id
 * @property {string}  order_number
 * @property {'pending'|'completed'|'cancelled'} status
 * @property {'unpaid'|'paid'} payment_status
 * @property {string}  subtotal
 * @property {string}  tax_amount
 * @property {string}  discount_amount
 * @property {string}  total_amount
 * @property {string|null} notes
 * @property {{id: number, name: string}|null} cashier
 * @property {{id: number, name: string}|null} customer
 * @property {{id: number, name: string}|null} outlet
 * @property {string}  created_at
 */

/**
 * @typedef {Order & { items: OrderItem[], payments: Payment[] }} OrderDetail
 */

/**
 * @typedef {Object} CreateOrderData
 * @property {number}       outlet_id
 * @property {number|null}  [customer_id]
 * @property {string}       [notes]
 * @property {Array<{product_id: number, quantity: number, discount_amount?: number}>} items
 */

/**
 * @typedef {Object} PayOrderData
 * @property {'cash'|'card'|'qris'|'transfer'} payment_method
 * @property {number} amount
 * @property {string} [reference_number]
 */

/**
 * @typedef {Object} OrderQueryParams
 * @property {string}  [search]
 * @property {string}  [status]
 * @property {number}  [outlet_id]
 * @property {number}  [per_page]
 * @property {number}  [page]
 */
