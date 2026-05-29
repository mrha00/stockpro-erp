import { apiClient, apiClientPaginated } from './client';
import { InventoryDto, InventoryTransactionDto, AdjustInventoryRequest, PagedData, Transaction } from '../types';
import { toTransaction } from './adapters';

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const parts = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

export async function getTransactions(params?: Record<string, unknown>): Promise<PagedData<Transaction>> {
  const result = await apiClientPaginated<InventoryTransactionDto>(`/api/inventories/transactions${buildQuery(params)}`);
  return {
    items: result.items.map(toTransaction),
    pagination: result.pagination,
  };
}

export async function adjustInventory(req: AdjustInventoryRequest): Promise<void> {
  await apiClient<void>('/api/inventories/adjust', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}
