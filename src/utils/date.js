import { format, parseISO } from 'date-fns';

/**
 * Format an ISO-8601 date string.
 *
 * @param {string} isoString – ISO date string, e.g. "2026-03-30T14:00:00Z"
 * @param {string} fmt       – date-fns format token (default: 'dd/MM/yyyy HH:mm')
 * @returns {string} Formatted date string
 */
export function formatDate(isoString, fmt = 'dd/MM/yyyy HH:mm') {
  if (!isoString) return '-';
  return format(parseISO(isoString), fmt);
}
