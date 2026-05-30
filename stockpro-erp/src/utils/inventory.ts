/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Locale } from '../i18n/I18nContext';

export function isLowStock(product: { stock: number; minStock: number; status: string }): boolean {
  return product.status === 'active' && product.minStock > 0 && product.stock <= product.minStock;
}

/** 根据语言环境返回货币符号 */
export function getCurrencySymbol(locale: Locale): string {
  return locale === 'zh' ? '￥' : '$';
}

/** 格式化金额显示 */
export function formatCurrency(amount: number, locale: Locale, options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }): string {
  const symbol = getCurrencySymbol(locale);
  const minDigits = options?.minimumFractionDigits ?? 2;
  const maxDigits = options?.maximumFractionDigits ?? 2;
  const formatted = amount.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    minimumFractionDigits: Math.min(minDigits, maxDigits),
    maximumFractionDigits: maxDigits,
  });
  return `${symbol}${formatted}`;
}
