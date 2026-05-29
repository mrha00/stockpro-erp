import { apiClient, apiClientPaginated } from './client';
import { Product, ProductDto, PagedData, CreateProductRequest, UpdateProductRequest, CategoryDto } from '../types';
import { toProduct, toCreateProductRequest, toUpdateProductRequest } from './adapters';

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const parts = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

export async function getProducts(params?: Record<string, unknown>): Promise<PagedData<Product>> {
  const result = await apiClientPaginated<ProductDto>(`/api/products${buildQuery(params)}`);
  return {
    items: result.items.map(dto => toProduct(dto)),
    pagination: result.pagination,
  };
}

export async function getProduct(id: string): Promise<Product> {
  const [dto, inv] = await Promise.all([
    apiClient<ProductDto>(`/api/products/${id}`),
    apiClient<import('../types').InventoryDto>(`/api/inventories/product/${id}`).catch(() => null),
  ]);
  return toProduct(dto, inv ?? undefined);
}

export async function createProduct(data: Partial<Product>, categoryId: string): Promise<Product> {
  const req = toCreateProductRequest(data, categoryId);
  const dto = await apiClient<ProductDto>('/api/products', {
    method: 'POST',
    body: JSON.stringify(req),
  });
  return toProduct(dto);
}

export async function updateProduct(id: string, data: Partial<Product>, categoryId?: string): Promise<Product> {
  const req = toUpdateProductRequest(data, categoryId);
  const dto = await apiClient<ProductDto>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(req),
  });
  return toProduct(dto);
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient<void>(`/api/products/${id}`, { method: 'DELETE' });
}

export async function getCategories(): Promise<CategoryDto[]> {
  return apiClient<CategoryDto[]>('/api/categories');
}

export async function getCategoryOptions(): Promise<{ id: string; name: string }[]> {
  const categories = await getCategories();
  return categories.map(c => ({ id: c.id, name: c.name }));
}
