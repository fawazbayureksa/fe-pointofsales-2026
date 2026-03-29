/**
 * Format a numeric amount as a currency string.
 *
 * @param {number} amount  – The value to format
 * @param {string} currency – ISO 4217 currency code (default: 'IDR')
 * @returns {string} Formatted currency string, e.g. "Rp 25.000"
 */
export function formatCurrency(amount, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
