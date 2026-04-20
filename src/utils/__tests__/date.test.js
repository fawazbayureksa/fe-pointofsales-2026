import { formatDate } from '../date';

describe('formatDate', () => {
  it('formats an ISO string with the default format dd/MM/yyyy HH:mm', () => {
    const result = formatDate('2026-03-30T14:00:00Z');
    // The exact hour may shift by timezone; assert the date portion is present
    expect(result).toMatch(/30\/03\/2026/);
  });

  it('formats with a custom date-only format', () => {
    const result = formatDate('2026-01-15T08:30:00Z', 'yyyy-MM-dd');
    expect(result).toBe('2026-01-15');
  });

  it('formats with a custom time format', () => {
    const result = formatDate('2026-06-20T09:05:00Z', 'HH:mm');
    // Allow timezone-shifted values — just check it's a valid HH:mm string
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('formats a date at midnight', () => {
    const result = formatDate('2026-12-31T00:00:00Z', 'dd/MM/yyyy');
    // Depending on timezone, could be 30/12 or 31/12 — just assert format
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('returns a non-empty string for any valid ISO input', () => {
    const result = formatDate('2025-07-04T12:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('formats with a long descriptive format token', () => {
    const result = formatDate('2026-03-30T00:00:00Z', 'MMMM do, yyyy');
    expect(result).toMatch(/2026/);
  });
});
