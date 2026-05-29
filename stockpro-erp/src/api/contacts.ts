import { apiClient, apiClientPaginated } from './client';
import { CustomerDto, SupplierDto, CreateCustomerRequest, CreateSupplierRequest, PagedData, SupplierOrContact } from '../types';
import { toContactFromCustomer, toContactFromSupplier } from './adapters';

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const parts = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

export async function getCustomers(params?: Record<string, unknown>): Promise<PagedData<SupplierOrContact>> {
  const result = await apiClientPaginated<CustomerDto>(`/api/customers${buildQuery(params)}`);
  return {
    items: result.items.map(toContactFromCustomer),
    pagination: result.pagination,
  };
}

export async function getSuppliers(params?: Record<string, unknown>): Promise<PagedData<SupplierOrContact>> {
  const result = await apiClientPaginated<SupplierDto>(`/api/suppliers${buildQuery(params)}`);
  return {
    items: result.items.map(toContactFromSupplier),
    pagination: result.pagination,
  };
}

export async function getAllContacts(params?: Record<string, unknown>): Promise<SupplierOrContact[]> {
  const [customers, suppliers] = await Promise.all([
    getCustomers(params),
    getSuppliers(params),
  ]);
  return [...customers.items, ...suppliers.items];
}

export async function createCustomer(data: CreateCustomerRequest): Promise<SupplierOrContact> {
  const dto = await apiClient<CustomerDto>('/api/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return toContactFromCustomer(dto);
}

export async function createSupplier(data: CreateSupplierRequest): Promise<SupplierOrContact> {
  const dto = await apiClient<SupplierDto>('/api/suppliers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return toContactFromSupplier(dto);
}
