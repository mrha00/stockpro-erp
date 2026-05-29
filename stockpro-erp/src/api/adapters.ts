import {
  Product, ProductDto, InventoryDto,
  Order, OrderItem, SalesOrderDto, SalesOrderItemDto, PurchaseOrderDto, PurchaseOrderItemDto,
  SupplierOrContact, CustomerDto, SupplierDto,
  Transaction, InventoryTransactionDto, TransactionType, TransactionStatus,
  CategoryDto,
  CreateProductRequest, UpdateProductRequest, CreateSalesOrderRequest, CreateSalesOrderItemRequest,
  CreateCustomerRequest, CreateSupplierRequest,
} from '../types';

// ========== 状态映射表 ==========

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ========== Product 转换 ==========

export function toProduct(dto: ProductDto, inv?: InventoryDto): Product {
  const frozen = dto.frozenQuantity ?? inv?.frozenQuantity ?? 0;
  const quantity = dto.stockQuantity ?? inv?.quantity ?? 0;
  const available = dto.availableQuantity ?? inv?.availableQuantity ?? Math.max(0, quantity - frozen);
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? '',
    sku: dto.sku,
    category: dto.categoryName,
    categoryId: dto.categoryId,
    cost: dto.costPrice,
    price: dto.salePrice,
    stock: quantity,
    available,
    frozen,
    minStock: dto.minStock,
    status: dto.isActive ? 'active' : 'inactive',
    location: inv?.location ?? '',
    lastInbound: formatDate(inv?.lastInboundAt),
    image: dto.imageUrl ?? undefined,
  };
}

export function toCreateProductRequest(p: Partial<Product>, categoryId: string): CreateProductRequest {
  return {
    name: p.name ?? '',
    sku: p.sku ?? `SKU-${Date.now()}`,
    categoryId,
    specification: p.description,
    unit: '个',
    costPrice: p.cost ?? 0,
    salePrice: p.price ?? 0,
    minStock: 0,
    maxStock: 9999,
    description: p.description,
    imageUrl: p.image,
  };
}

export function toUpdateProductRequest(p: Partial<Product>, categoryId?: string): UpdateProductRequest {
  return {
    name: p.name,
    categoryId,
    costPrice: p.cost,
    salePrice: p.price,
    description: p.description,
    isActive: p.status === 'active' ? true : p.status === 'inactive' ? false : undefined,
  };
}

// ========== Order 转换 ==========

function mapStatusText(text: string): Order['orderStatus'] {
  const m: Record<string, Order['orderStatus']> = {
    'Draft': 'draft', 'PendingApproval': 'pending', 'Approved': 'processing',
    'Processing': 'processing', 'Completed': 'completed', 'Cancelled': 'cancelled',
    'draft': 'draft', 'pending': 'pending', 'processing': 'processing',
    'completed': 'completed', 'cancelled': 'cancelled',
  };
  return m[text] ?? 'pending';
}

function mapPayStatusText(text: string): Order['paymentStatus'] {
  const m: Record<string, Order['paymentStatus']> = {
    'Unpaid': 'unpaid', 'PartialPaid': 'partial', 'Paid': 'paid', 'Refunded': 'refunded',
    'unpaid': 'unpaid', 'partial': 'partial', 'paid': 'paid', 'refunded': 'refunded',
  };
  return m[text] ?? 'unpaid';
}

function salesItemsToOrderItems(items: SalesOrderItemDto[]): OrderItem[] {
  return items.map(i => ({
    productId: i.productId,
    name: i.productName,
    qty: i.quantity,
    price: i.unitPrice,
  }));
}

function purchaseItemsToOrderItems(items: PurchaseOrderItemDto[]): OrderItem[] {
  return items.map(i => ({
    productId: i.productId,
    name: i.productName,
    qty: i.quantity,
    price: i.unitPrice,
  }));
}

export function toOrderFromSales(dto: SalesOrderDto): Order {
  return {
    id: dto.id,
    customerName: dto.customerName,
    date: formatDate(dto.orderDate) || formatDate(dto.createdAt),
    items: salesItemsToOrderItems(dto.items),
    total: dto.totalAmount,
    paymentStatus: mapPayStatusText(dto.paymentStatusText),
    orderStatus: mapStatusText(dto.statusText),
    type: 'sales',
  };
}

export function toOrderFromPurchase(dto: PurchaseOrderDto): Order {
  return {
    id: dto.id,
    customerName: dto.supplierName,
    date: formatDate(dto.orderDate) || formatDate(dto.createdAt),
    items: purchaseItemsToOrderItems(dto.items),
    total: dto.totalAmount,
    paymentStatus: mapPayStatusText(dto.paymentStatusText),
    orderStatus: mapStatusText(dto.statusText),
    type: 'purchase',
  };
}

export function toCreateSalesOrderRequest(
  customerId: string,
  items: { productId: string; unitPrice: number; quantity: number }[],
  shippingAddress?: string,
  remarks?: string
): CreateSalesOrderRequest {
  return {
    customerId,
    shippingAddress: shippingAddress ?? null,
    remarks: remarks ?? null,
    items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
  };
}

// ========== Contact 转换 ==========

export function toContactFromCustomer(dto: CustomerDto): SupplierOrContact {
  return {
    id: dto.id,
    name: dto.name,
    role: 'customer',
    email: dto.email ?? '',
    phone: dto.phone ?? '',
    company: dto.customerType || dto.name,
  };
}

export function toContactFromSupplier(dto: SupplierDto): SupplierOrContact {
  return {
    id: dto.id,
    name: dto.name,
    role: 'supplier',
    email: dto.email ?? '',
    phone: dto.phone ?? '',
    company: dto.name,
  };
}

export function toCreateCustomerRequest(c: Partial<SupplierOrContact>): CreateCustomerRequest {
  return {
    name: c.name ?? '',
    code: `C-${Date.now()}`,
    contactPerson: c.name,
    phone: c.phone,
    email: c.email,
    customerType: '普通客户',
    creditLimit: 0,
  };
}

export function toCreateSupplierRequest(c: Partial<SupplierOrContact>): CreateSupplierRequest {
  return {
    name: c.name ?? '',
    code: `S-${Date.now()}`,
    contactPerson: c.name,
    phone: c.phone,
    email: c.email,
  };
}

// ========== Transaction 转换 ==========

const TX_TYPE_MAP: Record<string, TransactionType> = {
  'Inbound': '补货', 'Outbound': '销售', 'Adjust': '调整', 'Freeze': '冻结', 'Unfreeze': '解冻',
  'Sale': '销售', 'Purchase': '补货', 'Return': '退货',
};

export function toTransaction(dto: InventoryTransactionDto): Transaction {
  const absQty = Math.abs(dto.quantity);
  const rawType = dto.transactionType;
  const txType = TX_TYPE_MAP[rawType] ?? '调整';

  return {
    id: dto.id,
    date: formatDate(dto.createdAt),
    type: txType,
    productName: dto.productName,
    productId: dto.productId,
    amount: dto.quantity,
    value: absQty * dto.unitPrice,
    status: '已完成',
  };
}

// ========== Category 转换 ==========

export function buildCategoryMap(categories: CategoryDto[]): Map<string, string> {
  const map = new Map<string, string>();
  function walk(cats: CategoryDto[]) {
    for (const c of cats) {
      map.set(c.id, c.name);
      if (c.children?.length) walk(c.children);
    }
  }
  walk(categories);
  return map;
}

export function toKVOptions(categories: CategoryDto[]): { id: string; name: string }[] {
  const result: { id: string; name: string }[] = [];
  function walk(cats: CategoryDto[]) {
    for (const c of cats) {
      result.push({ id: c.id, name: c.name });
      if (c.children?.length) walk(c.children);
    }
  }
  walk(categories);
  return result;
}
