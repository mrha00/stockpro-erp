/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ========== 前端领域类型（组件使用） ==========

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  categoryId: string;
  cost: number;
  price: number;
  stock: number;
  available: number;
  frozen: number;
  minStock: number;
  status: 'active' | 'draft' | 'inactive';
  location: string;
  lastInbound: string;
  image?: string;
}

export type TransactionType = '销售' | '补货' | '调整' | '退货' | '冻结' | '解冻';
export type TransactionStatus = '已完成' | '处理中' | '待审核' | '草稿';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  productName: string;
  productId: string;
  amount: number;
  value?: number;
  status: TransactionStatus;
}

export interface SupplierOrContact {
  id: string;
  name: string;
  role: 'admin' | 'salesman' | 'warehouse' | 'purchaser' | 'customer' | 'supplier';
  email: string;
  phone: string;
  company: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

export type OrderType = 'sales' | 'purchase';

export interface Order {
  id: string;
  customerName: string;
  date: string;
  items: OrderItem[];
  total: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid' | 'refunded';
  orderStatus: 'completed' | 'processing' | 'pending' | 'cancelled' | 'draft';
  type: OrderType;
}

export interface KPIStats {
  totalInventoryValue: number;
  todaySalesValue: number;
  lowStockAlertsCount: number;
  pendingPurchasesCount: number;
}

// ========== 后端 DTO 镜像类型 ==========

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  success: boolean;
}

export interface PagedData<T> {
  items: T[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Auth
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserDto;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UserDto {
  id: string;
  username: string;
  email: string;
  realName: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

// Products
export interface ProductDto {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  categoryId: string;
  categoryName: string;
  specification: string | null;
  unit: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  maxStock: number;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  stockQuantity: number;
  frozenQuantity?: number;
  availableQuantity?: number;
  createdAt: string;
}

export interface CreateProductRequest {
  name: string;
  sku: string;
  barcode?: string | null;
  categoryId: string;
  specification?: string | null;
  unit?: string;
  costPrice: number;
  salePrice: number;
  minStock?: number;
  maxStock?: number;
  description?: string | null;
  imageUrl?: string | null;
}

export interface UpdateProductRequest {
  name?: string | null;
  barcode?: string | null;
  categoryId?: string | null;
  specification?: string | null;
  unit?: string | null;
  costPrice?: number | null;
  salePrice?: number | null;
  minStock?: number | null;
  maxStock?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean | null;
}

// Inventory
export interface InventoryDto {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  frozenQuantity: number;
  availableQuantity: number;
  totalAmount: number;
  averageCost: number;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  location: string | null;
}

export interface InventoryTransactionDto {
  id: string;
  productId: string;
  productName: string;
  transactionType: string;
  quantity: number;
  unitPrice: number;
  referenceType: string | null;
  referenceNo: string | null;
  remarks: string | null;
  createdAt: string;
  createdByName: string | null;
}

export interface AdjustInventoryRequest {
  productId: string;
  quantity: number;
  adjustType: string;
  reason: string;
}

// Sales Order
export interface SalesOrderItemDto {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  shippedQuantity: number;
}

export interface SalesOrderDto {
  id: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  status: number;
  statusText: string;
  paymentStatus: number;
  paymentStatusText: string;
  totalAmount: number;
  receivedAmount: number;
  orderDate: string;
  shippedDate: string | null;
  shippingAddress: string | null;
  remarks: string | null;
  items: SalesOrderItemDto[];
  createdAt: string;
}

export interface CreateSalesOrderItemRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateSalesOrderRequest {
  customerId: string;
  shippingAddress?: string | null;
  remarks?: string | null;
  items: CreateSalesOrderItemRequest[];
}

// Purchase Order
export interface PurchaseOrderItemDto {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  receivedQuantity: number;
}

export interface PurchaseOrderDto {
  id: string;
  orderNo: string;
  supplierId: string;
  supplierName: string;
  status: number;
  statusText: string;
  paymentStatus: number;
  paymentStatusText: string;
  totalAmount: number;
  paidAmount: number;
  orderDate: string;
  expectedDate: string | null;
  receivedDate: string | null;
  remarks: string | null;
  items: PurchaseOrderItemDto[];
  createdAt: string;
}

// Customer
export interface CustomerDto {
  id: string;
  name: string;
  code: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  customerType: string;
  creditLimit: number;
  remarks: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  code: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  customerType?: string;
  creditLimit?: number;
  remarks?: string | null;
}

// Supplier
export interface SupplierDto {
  id: string;
  name: string;
  code: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  bankName: string | null;
  taxNumber: string | null;
  remarks: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  code: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  bankName?: string | null;
  taxNumber?: string | null;
  remarks?: string | null;
}

// Category
export interface CategoryDto {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  parentName: string | null;
  sortOrder: number;
  description: string | null;
  productCount: number;
  children: CategoryDto[];
}
