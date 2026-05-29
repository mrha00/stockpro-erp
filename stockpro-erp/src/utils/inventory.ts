/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function isLowStock(product: { stock: number; minStock: number; status: string }): boolean {
  return product.status === 'active' && product.minStock > 0 && product.stock <= product.minStock;
}
