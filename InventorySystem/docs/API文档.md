# 进销存管理系统 API 文档

## 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [认证授权](#认证授权)
- [统一响应格式](#统一响应格式)
- [API 端点](#api-端点)
  - [认证模块](#认证模块)
  - [用户管理](#用户管理)
  - [分类管理](#分类管理)
  - [商品管理](#商品管理)
  - [供应商管理](#供应商管理)
  - [客户管理](#客户管理)
  - [采购单管理](#采购单管理)
  - [销售单管理](#销售单管理)
  - [库存管理](#库存管理)
- [数据模型](#数据模型)
- [错误码说明](#错误码说明)
- [前端对接指南](#前端对接指南)

---

## 项目概述

进销存管理系统后端 API，基于 ASP.NET Core 8.0 构建，采用 Clean Architecture 分层架构。

**核心功能：**
- 用户认证与权限管理
- 商品分类管理
- 商品信息管理
- 供应商/客户管理
- 采购单管理（入库）
- 销售单管理（出库）
- 库存管理与流水记录

---

## 技术栈

| 组件 | 技术 | 版本 |
|------|------|------|
| 框架 | ASP.NET Core | 8.0 |
| ORM | Entity Framework Core | 8.0 |
| 数据库 | SQL Server | - |
| 认证 | JWT Bearer | - |
| 验证 | FluentValidation | 11.x |
| 日志 | Serilog | 3.x |
| 文档 | Swagger/OpenAPI | 6.x |

---

## 项目结构

```
InventorySystem/
├── src/
│   ├── InventorySystem.Domain/          # 领域层（实体、枚举、异常）
│   ├── InventorySystem.Application/     # 应用层（接口、DTO、验证器）
│   ├── InventorySystem.Infrastructure/  # 基础设施层（EF Core、服务实现）
│   └── InventorySystem.Api/             # API层（控制器、中间件）
└── tests/
    └── InventorySystem.UnitTests/       # 单元测试
```

---

## 认证授权

### 认证方式

使用 JWT Bearer Token 认证，所有需要认证的接口需在请求头中携带：

```
Authorization: Bearer <access_token>
```

### 角色权限

| 角色 | 说明 | 权限范围 |
|------|------|----------|
| Admin | 管理员 | 全部权限 |
| Purchaser | 采购员 | 采购相关操作 |
| Salesman | 销售员 | 销售相关操作 |
| WarehouseKeeper | 仓管员 | 库存相关操作 |

### Token 获取

通过 `/api/auth/login` 接口获取，返回 `accessToken` 和 `refreshToken`。

---

## 统一响应格式

### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

### 分页响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "错误信息",
  "data": null
}
```

---

## API 端点

### 认证模块

#### 用户登录

```
POST /api/auth/login
```

**请求体：**
```json
{
  "username": "string",
  "password": "string"
}
```

**响应：**
```json
{
  "code": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "abc123...",
    "expiresAt": "2024-01-01T12:00:00Z",
    "user": {
      "id": "guid",
      "username": "admin",
      "email": "admin@example.com",
      "realName": "管理员",
      "role": "Admin",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### 刷新令牌

```
POST /api/auth/refresh-token
```

**请求体：**
```json
{
  "refreshToken": "string"
}
```

#### 修改密码

```
POST /api/auth/change-password
Authorization: Bearer <token>
```

**请求体：**
```json
{
  "oldPassword": "string",
  "newPassword": "string"
}
```

---

### 用户管理

#### 获取用户列表

```
GET /api/users
Authorization: Bearer <token>
```

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| pageSize | int | 否 | 每页条数，默认20 |
| keyword | string | 否 | 搜索关键词（用户名/邮箱） |
| role | enum | 否 | 角色筛选 |
| isActive | bool | 否 | 状态筛选 |

#### 创建用户（仅管理员）

```
POST /api/users
Authorization: Bearer <token>
```

**请求体：**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "realName": "string",
  "phone": "string",
  "role": "Admin|Purchaser|Salesman|WarehouseKeeper"
}
```

#### 更新用户

```
PUT /api/users/{id}
Authorization: Bearer <token>
```

#### 删除用户（仅管理员）

```
DELETE /api/users/{id}
Authorization: Bearer <token>
```

---

### 分类管理

#### 获取分类列表（树形）

```
GET /api/categories
Authorization: Bearer <token>
```

#### 获取分类分页

```
GET /api/categories/paged
Authorization: Bearer <token>
```

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| keyword | string | 否 | 搜索关键词 |
| parentId | guid | 否 | 父分类ID |

#### 创建分类

```
POST /api/categories
Authorization: Bearer <token>
```

**请求体：**
```json
{
  "name": "电子产品",
  "code": "ELEC",
  "parentId": null,
  "sortOrder": 1,
  "description": "电子类产品"
}
```

#### 更新分类

```
PUT /api/categories/{id}
Authorization: Bearer <token>
```

#### 删除分类

```
DELETE /api/categories/{id}
Authorization: Bearer <token>
```

---

### 商品管理

#### 获取商品列表

```
GET /api/products
Authorization: Bearer <token>
```

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| keyword | string | 否 | 搜索关键词（名称/SKU） |
| categoryId | guid | 否 | 分类ID |
| isActive | bool | 否 | 是否上架 |
| minPrice | decimal | 否 | 最低价格 |
| maxPrice | decimal | 否 | 最高价格 |
| lowStock | bool | 否 | 是否低库存 |

#### 创建商品

```
POST /api/products
Authorization: Bearer <token>
```

**请求体：**
```json
{
  "name": "iPhone 15",
  "sku": "APL-IP15-001",
  "barcode": "123456789",
  "categoryId": "guid",
  "specification": "256GB",
  "unit": "台",
  "costPrice": 5000,
  "salePrice": 6999,
  "minStock": 10,
  "maxStock": 1000,
  "description": "苹果手机",
  "imageUrl": "https://..."
}
```

**响应：**
```json
{
  "code": 201,
  "message": "Product created successfully",
  "data": {
    "id": "guid",
    "name": "iPhone 15",
    "sku": "APL-IP15-001",
    "barcode": "123456789",
    "categoryId": "guid",
    "categoryName": "电子产品",
    "specification": "256GB",
    "unit": "台",
    "costPrice": 5000,
    "salePrice": 6999,
    "minStock": 10,
    "maxStock": 1000,
    "description": "苹果手机",
    "imageUrl": "https://...",
    "isActive": true,
    "stockQuantity": 0,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### 更新商品

```
PUT /api/products/{id}
Authorization: Bearer <token>
```

#### 删除商品

```
DELETE /api/products/{id}
Authorization: Bearer <token>
```

---

### 供应商管理

#### 获取供应商列表

```
GET /api/suppliers
Authorization: Bearer <token>
```

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| keyword | string | 否 | 搜索关键词 |
| isActive | bool | 否 | 是否启用 |

#### 创建供应商

```
POST /api/suppliers
Authorization: Bearer <token>
```

**请求体：**
```json
{
  "name": "深圳苹果供应链",
  "code": "SUP-APL-001",
  "contactPerson": "张三",
  "phone": "13800138000",
  "email": "supplier@example.com",
  "address": "深圳市南山区",
  "bankAccount": "6222021234567890123",
  "bankName": "工商银行",
  "taxNumber": "91440300XXXXXXXX",
  "remarks": "备注信息"
}
```

#### 更新供应商

```
PUT /api/suppliers/{id}
Authorization: Bearer <token>
```

#### 删除供应商

```
DELETE /api/suppliers/{id}
Authorization: Bearer <token>
```

---

### 客户管理

#### 获取客户列表

```
GET /api/customers
Authorization: Bearer <token>
```

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| keyword | string | 否 | 搜索关键词 |
| customerType | string | 否 | 客户类型 |
| isActive | bool | 否 | 是否启用 |

#### 创建客户

```
POST /api/customers
Authorization: Bearer <token>
```

**请求体：**
```json
{
  "name": "北京数码商城",
  "code": "CUS-001",
  "contactPerson": "李四",
  "phone": "13900139000",
  "email": "customer@example.com",
  "address": "北京市朝阳区",
  "customerType": "VIP客户",
  "creditLimit": 100000,
  "remarks": "备注信息"
}
```

#### 更新客户

```
PUT /api/customers/{id}
Authorization: Bearer <token>
```

#### 删除客户

```
DELETE /api/customers/{id}
Authorization: Bearer <token>
```

---

### 采购单管理

#### 获取采购单列表

```
GET /api/purchaseorders
Authorization: Bearer <token>
```

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| orderNo | string | 否 | 单号搜索 |
| supplierId | guid | 否 | 供应商ID |
| status | enum | 否 | 状态筛选 |
| paymentStatus | enum | 否 | 付款状态 |
| startDate | date | 否 | 开始日期 |
| endDate | date | 否 | 结束日期 |

#### 创建采购单

```
POST /api/purchaseorders
Authorization: Bearer <token>
```

**请求体：**
```json
{
  "supplierId": "guid",
  "expectedDate": "2024-02-01T00:00:00Z",
  "remarks": "备注",
  "items": [
    {
      "productId": "guid",
      "quantity": 100,
      "unitPrice": 5000
    },
    {
      "productId": "guid",
      "quantity": 50,
      "unitPrice": 3000
    }
  ]
}
```

**响应：**
```json
{
  "code": 201,
  "message": "Purchase order created successfully",
  "data": {
    "id": "guid",
    "orderNo": "PO20240101001",
    "supplierId": "guid",
    "supplierName": "深圳苹果供应链",
    "status": "Draft",
    "statusText": "Draft",
    "paymentStatus": "Unpaid",
    "paymentStatusText": "Unpaid",
    "totalAmount": 650000,
    "paidAmount": 0,
    "orderDate": "2024-01-01T00:00:00Z",
    "expectedDate": "2024-02-01T00:00:00Z",
    "receivedDate": null,
    "remarks": "备注",
    "items": [
      {
        "id": "guid",
        "productId": "guid",
        "productName": "iPhone 15",
        "productSku": "APL-IP15-001",
        "quantity": 100,
        "unitPrice": 5000,
        "subtotal": 500000,
        "receivedQuantity": 0
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### 审核采购单（仅管理员）

```
POST /api/purchaseorders/{id}/approve
Authorization: Bearer <token>
```

#### 采购单收货入库

```
POST /api/purchaseorders/{id}/receive
Authorization: Bearer <token>
```

**请求体：**
```json
{
  "items": [
    {
      "productId": "guid",
      "quantity": 100
    }
  ]
}
```

#### 取消采购单

```
POST /api/purchaseorders/{id}/cancel
Authorization: Bearer <token>
```

---

### 销售单管理

#### 获取销售单列表

```
GET /api/salesorders
Authorization: Bearer <token>
```

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| orderNo | string | 否 | 单号搜索 |
| customerId | guid | 否 | 客户ID |
| status | enum | 否 | 状态筛选 |
| paymentStatus | enum | 否 | 付款状态 |
| startDate | date | 否 | 开始日期 |
| endDate | date | 否 | 结束日期 |

#### 创建销售单

```
POST /api/salesorders
Authorization: Bearer <token>
```

**请求体：**
```json
{
  "customerId": "guid",
  "shippingAddress": "北京市朝阳区xxx",
  "remarks": "备注",
  "items": [
    {
      "productId": "guid",
      "quantity": 10,
      "unitPrice": 6999
    }
  ]
}
```

#### 审核销售单（仅管理员）

```
POST /api/salesorders/{id}/approve
Authorization: Bearer <token>
```

#### 销售单发货出库

```
POST /api/salesorders/{id}/ship
Authorization: Bearer <token>
```

**请求体：**
```json
{
  "items": [
    {
      "productId": "guid",
      "quantity": 10
    }
  ]
}
```

#### 取消销售单

```
POST /api/salesorders/{id}/cancel
Authorization: Bearer <token>
```

---

### 库存管理

#### 获取库存列表

```
GET /api/inventories
Authorization: Bearer <token>
```

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| keyword | string | 否 | 搜索关键词（商品名/SKU） |
| lowStock | bool | 否 | 是否低库存 |
| overStock | bool | 否 | 是否超库存 |

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "guid",
        "productId": "guid",
        "productName": "iPhone 15",
        "productSku": "APL-IP15-001",
        "quantity": 100,
        "frozenQuantity": 10,
        "availableQuantity": 90,
        "totalAmount": 500000,
        "averageCost": 5000,
        "lastInboundAt": "2024-01-15T10:30:00Z",
        "lastOutboundAt": "2024-01-16T14:20:00Z",
        "location": "A-01-01"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

#### 获取单个商品库存

```
GET /api/inventories/product/{productId}
Authorization: Bearer <token>
```

#### 库存调整（仅管理员/仓管员）

```
POST /api/inventories/adjust
Authorization: Bearer <token>
```

**请求体：**
```json
{
  "productId": "guid",
  "quantity": -5,
  "reason": "盘点损耗"
}
```

#### 获取库存流水

```
GET /api/inventories/transactions
Authorization: Bearer <token>
```

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| productId | guid | 否 | 商品ID |
| transactionType | string | 否 | 类型（Inbound/Outbound/Adjust） |
| startDate | date | 否 | 开始日期 |
| endDate | date | 否 | 结束日期 |

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "guid",
        "productId": "guid",
        "productName": "iPhone 15",
        "transactionType": "Inbound",
        "quantity": 100,
        "unitPrice": 5000,
        "referenceType": "PurchaseOrder",
        "referenceNo": "PO20240101001",
        "remarks": null,
        "createdAt": "2024-01-15T10:30:00Z",
        "createdByName": "管理员"
      }
    ],
    "pagination": { ... }
  }
}
```

---

## 数据模型

### 订单状态枚举

```typescript
enum OrderStatus {
  Draft = 0,           // 草稿
  PendingApproval = 1, // 待审核
  Approved = 2,        // 已审核
  Processing = 3,      // 执行中
  Completed = 4,       // 已完成
  Cancelled = 5        // 已取消
}
```

### 付款状态枚举

```typescript
enum PaymentStatus {
  Unpaid = 0,      // 未付款
  PartialPaid = 1, // 部分付款
  Paid = 2,        // 已付款
  Refunded = 3     // 已退款
}
```

### 用户角色枚举

```typescript
enum UserRole {
  Admin = 0,            // 管理员
  Purchaser = 1,        // 采购员
  Salesman = 2,         // 销售员
  WarehouseKeeper = 3   // 仓管员
}
```

---

## 错误码说明

| HTTP状态码 | 错误码 | 说明 |
|-----------|--------|------|
| 400 | VALIDATION_ERROR | 参数验证失败 |
| 400 | BUSINESS_ERROR | 业务逻辑错误 |
| 400 | INSUFFICIENT_STOCK | 库存不足 |
| 401 | UNAUTHORIZED | 未授权 |
| 403 | FORBIDDEN | 权限不足 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | CONFLICT | 数据冲突（重复） |
| 429 | - | 请求过于频繁 |
| 500 | - | 服务器内部错误 |

---

## 前端对接指南

### 1. 登录流程

```typescript
// 1. 调用登录接口
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

const { data } = await response.json();

// 2. 存储 Token
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);

// 3. 后续请求携带 Token
fetch('/api/products', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});
```

### 2. Token 刷新

```typescript
// 401 时自动刷新
if (response.status === 401) {
  const refreshResponse = await fetch('/api/auth/refresh-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refreshToken: localStorage.getItem('refreshToken')
    })
  });
  
  const { data } = await refreshResponse.json();
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  // 重试原请求
}
```

### 3. 分页请求

```typescript
const params = new URLSearchParams({
  page: 1,
  pageSize: 20,
  keyword: '搜索词'
});

const response = await fetch(`/api/products?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data } = await response.json();
// data.items - 数据列表
// data.pagination - 分页信息
```

### 4. 表单验证规则

```typescript
// 用户名：3-50位，字母数字下划线
// 密码：6-100位，包含大小写字母和数字
// 邮箱：标准邮箱格式
// 手机号：1开头的11位数字
// SKU：唯一标识
// 编码：唯一标识
```

### 5. 推荐前端技术栈

| 类型 | 推荐 |
|------|------|
| 框架 | React / Vue 3 |
| UI库 | Ant Design / Element Plus |
| 状态管理 | Zustand / Pinia |
| HTTP客户端 | Axios |
| 表单 | React Hook Form / VeeValidate |
| 表格 | TanStack Table |

---

## 运行说明

```powershell
# 克隆项目
cd G:\Item\InventorySystem

# 还原依赖
dotnet restore

# 运行项目
dotnet run --project src/InventorySystem.Api

# 访问 Swagger
http://localhost:5000/swagger

# 运行测试
dotnet test
```

---

## 联系方式

如有问题，请联系后端开发人员。
