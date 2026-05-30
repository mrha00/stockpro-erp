import { describe, expect, it } from 'vitest';
import { formatCurrency, getCurrencySymbol, isLowStock } from './inventory';

describe('inventory utils', () => {
  it('isLowStock returns true when active and at or below min', () => {
    expect(isLowStock({ stock: 5, minStock: 10, status: 'active' })).toBe(true);
    expect(isLowStock({ stock: 10, minStock: 10, status: 'active' })).toBe(true);
  });

  it('isLowStock returns false when inactive or above min', () => {
    expect(isLowStock({ stock: 20, minStock: 10, status: 'active' })).toBe(false);
    expect(isLowStock({ stock: 1, minStock: 10, status: 'inactive' })).toBe(false);
  });

  it('getCurrencySymbol uses locale', () => {
    expect(getCurrencySymbol('zh')).toBe('￥');
    expect(getCurrencySymbol('en')).toBe('$');
  });

  it('formatCurrency formats with symbol', () => {
    expect(formatCurrency(1234.5, 'zh')).toContain('￥');
    expect(formatCurrency(1234.5, 'en')).toContain('$');
  });
});
