import { apiClient, apiClientPaginated } from './client';
import { SalesOrderDto, PurchaseOrderDto, CreateSalesOrderRequest, PagedData, Order } from '../types';
import { toOrderFromSales, toOrderFromPurchase, toCreateSalesOrderRequest } from './adapters';

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const parts = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

export async function getSalesOrders(params?: Record<string, unknown>): Promise<PagedData<Order>> {
  const result = await apiClientPaginated<SalesOrderDto>(`/api/salesorders${buildQuery(params)}`);
  return {
    items: result.items.map(toOrderFromSales),
    pagination: result.pagination,
  };
}

export async function getPurchaseOrders(params?: Record<string, unknown>): Promise<PagedData<Order>> {
  const result = await apiClientPaginated<PurchaseOrderDto>(`/api/purchaseorders${buildQuery(params)}`);
  return {
    items: result.items.map(toOrderFromPurchase),
    pagination: result.pagination,
  };
}

export async function getAllOrders(params?: Record<string, unknown>): Promise<PagedData<Order>> {
  const [sales, purchase] = await Promise.all([
    getSalesOrders(params),
    getPurchaseOrders(params),
  ]);
  const all = [...sales.items, ...purchase.items]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return {
    items: all,
    pagination: { page: 1, pageSize: all.length, total: all.length, totalPages: 1 },
  };
}

export async function createSalesOrder(
  customerId: string,
  items: { productId: string; unitPrice: number; quantity: number }[],
  shippingAddress?: string,
  remarks?: string
): Promise<Order> {
  const req = toCreateSalesOrderRequest(customerId, items, shippingAddress, remarks);
  const dto = await apiClient<SalesOrderDto>('/api/salesorders', {
    method: 'POST',
    body: JSON.stringify(req),
  });
  return toOrderFromSales(dto);
}

export async function approveSalesOrder(id: string): Promise<Order> {
  const dto = await apiClient<SalesOrderDto>(`/api/salesorders/${id}/approve`, { method: 'POST' });
  return toOrderFromSales(dto);
}

export async function shipSalesOrder(
  id: string,
  items: { productId: string; quantity: number }[]
): Promise<Order> {
  const dto = await apiClient<SalesOrderDto>(`/api/salesorders/${id}/ship`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
  return toOrderFromSales(dto);
}

/** 创建销售订单并完成审批出库（扣减库存） */
export async function createAndFulfillSalesOrder(
  customerId: string,
  items: { productId: string; unitPrice: number; quantity: number }[],
  shippingAddress?: string,
  remarks?: string
): Promise<Order> {
  const draft = await createSalesOrder(customerId, items, shippingAddress, remarks);
  const approved = await approveSalesOrder(draft.id);
  return shipSalesOrder(
    approved.id,
    items.map(i => ({ productId: i.productId, quantity: i.quantity }))
  );
}
