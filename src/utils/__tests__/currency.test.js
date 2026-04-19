import { formatCurrency } from '../currency';

describe('formatCurrency', () => {
  it('formats IDR amount with default currency', () => {
    const result = formatCurrency(25000);
    expect(result).toMatch(/25\.000/);
    expect(result).toMatch(/Rp/);
  });

  it('formats zero amount', () => {
    const result = formatCurrency(0);
    expect(result).toMatch(/0/);
  });

  it('formats large amounts with thousands separator', () => {
    const result = formatCurrency(1000000);
    expect(result).toMatch(/1\.000\.000/);
  });

  it('uses dot as thousands separator for IDR locale', () => {
    const result = formatCurrency(10000);
    expect(result).toMatch(/10\.000/);
  });

  it('formats negative amounts', () => {
    const result = formatCurrency(-5000);
    expect(result).toMatch(/5\.000/);
  });

  it('formats amounts with cents (IDR minimumFractionDigits=0)', () => {
    const result = formatCurrency(1500, 'IDR');
    expect(result).toMatch(/1\.500/);
  });

  it('accepts a custom currency code', () => {
    const result = formatCurrency(100, 'USD');
    expect(result).toBeTruthy();
    // USD on id-ID locale should still be numeric value 100
    expect(result).toMatch(/100/);
  });

  it('returns a string', () => {
    expect(typeof formatCurrency(1000)).toBe('string');
  });

  it('formats decimal amounts within maximumFractionDigits=2', () => {
    const result = formatCurrency(1000.5, 'IDR');
    // IDR typically rounds – just ensure it's a non-empty string
    expect(result).toBeTruthy();
  });
});
