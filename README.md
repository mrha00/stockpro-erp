# StockPro 进销存管理系统

一个基于 .NET 8 和 React 的全栈企业级进销存管理系统。

## ✨ 项目特性

- 🔐 **JWT 双令牌认证** + RBAC 权限控制
- 📦 **完整的进销存业务流程**（商品/订单/库存/客户/供应商）
- 🗑️ **软删除 + 审计日志**，支持数据追溯
- 📊 **实时库存监控**与低库存预警
- 📈 **销售数据可视化**报表
- 🌐 **中英文国际化**支持
- 🐳 **Docker 容器化**部署
- 🔄 **GitHub Actions CI/CD** 流水线

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      前端 (React SPA)                        │
│  React 19 + TypeScript + Vite + Tailwind CSS                │
│  Recharts (图表) + Lucide (图标) + i18n (国际化)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   后端 (.NET 8 Web API)                      │
│  ASP.NET Core + EF Core + JWT + Serilog + FluentValidation  │
│  DDD 四层架构 (Api / Application / Domain / Infrastructure) │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    数据层 (SQL Server)                        │
│  EF Core Code-First + 软删除 + 审计日志 + 索引优化           │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ 技术栈

### 后端
- **.NET 8** - 最新的 LTS 版本
- **ASP.NET Core Web API** - RESTful API 框架
- **Entity Framework Core** - ORM 框架
- **SQL Server 2022** - 关系型数据库
- **JWT** - 身份认证
- **Serilog** - 结构化日志
- **FluentValidation** - 数据验证
- **BCrypt** - 密码加密

### 前端
- **React 19** - 用户界面库
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **Recharts** - 图表库
- **Lucide React** - 图标库

### DevOps
- **Docker** - 容器化
- **GitHub Actions** - CI/CD
- **Nginx** - 反向代理

## 📁 项目结构

```
.
├── InventorySystem/          # 后端 .NET API
│   ├── src/
│   │   ├── InventorySystem.Api/            # API 层
│   │   ├── InventorySystem.Application/    # 应用层
│   │   ├── InventorySystem.Domain/         # 领域层
│   │   └── InventorySystem.Infrastructure/ # 基础设施层
│   └── tests/
│       └── InventorySystem.UnitTests/      # 单元测试
│
├── stockpro-erp/             # 前端 React 应用
│   ├── src/
│   │   ├── api/              # API 客户端
│   │   ├── components/       # React 组件
│   │   ├── i18n/             # 国际化
│   │   └── types.ts          # 类型定义
│   └── package.json
│
└── docs/                     # 项目文档
    ├── API文档.md
    ├── 生产上线指南.md
    ├── 项目代码审查报告.md
    └── StockPro简历项目完善流程.md
```

## 🚀 快速开始

### 前置条件

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/)
- [SQL Server 2022](https://www.microsoft.com/en-us/sql-server) 或 Docker

### 方式一：Docker Compose（推荐）

```bash
# 克隆项目
git clone https://github.com/yourusername/stockpro.git
cd stockpro

# 启动所有服务
docker-compose up -d

# 访问应用
# 前端：http://localhost:3000
# API：http://localhost:5251
```

### 方式二：本地开发

```bash
# 1. 启动数据库（Docker）
docker-compose up sqlserver -d

# 2. 启动后端
cd InventorySystem
dotnet run --project src/InventorySystem.Api

# 3. 启动前端（新终端）
cd stockpro-erp
npm install
npm run dev
```

### 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 测试用户 | test | test123 |

## 📚 文档

- [API 接口文档](docs/API文档.md) - 完整的 API 接口说明
- [生产上线指南](docs/生产上线指南.md) - 部署到生产环境的详细指南
- [项目代码审查报告](docs/项目代码审查报告.md) - 代码质量分析报告
- [简历项目完善流程](docs/StockPro简历项目完善流程.md) - 面试准备指南

## 🧪 测试

### 后端测试

```bash
cd InventorySystem
dotnet test
```

### 前端测试

```bash
cd stockpro-erp
npm run test
```

## 🔧 配置说明

### 环境变量

创建 `appsettings.Local.json`（不提交到 Git）：

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=InventorySystem;User Id=sa;Password=YourPassword"
  },
  "Jwt": {
    "Secret": "YourSecureJwtSecretKeyMustBeAtLeast32CharactersLong!"
  }
}
```

### CORS 配置

在 `appsettings.json` 中配置允许的前端域名：

```json
{
  "Cors": {
    "AllowedOrigins": ["http://localhost:3000"]
  }
}
```

## 📦 核心功能

### 1. 认证授权
- JWT 双令牌认证（Access Token + Refresh Token）
- RBAC 角色权限控制（Admin/WarehouseKeeper/Salesman）
- 密码加密存储（BCrypt）

### 2. 商品管理
- 商品 CRUD 操作
- 分类管理
- 价格管理（成本价/售价）
- 库存阈值设置

### 3. 订单管理
- 销售订单/采购订单
- 订单状态流转（草稿→待审批→处理中→已完成）
- 自动库存扣减

### 4. 库存管理
- 入库/出库/盘点
- 库存冻结/解冻
- 交易记录追溯
- 低库存预警

### 5. 客户供应商管理
- 客户信息管理
- 供应商信息管理
- 联系方式管理

### 6. 数据报表
- 实时仪表盘
- 销售趋势分析
- 库存分布统计
- KPI 指标监控

## 🛡️ 安全特性

- ✅ JWT 令牌认证
- ✅ RBAC 权限控制
- ✅ 密码 BCrypt 加密
- ✅ API 限流防护
- ✅ CORS 跨域配置
- ✅ SQL 注入防护（EF Core）
- ✅ XSS 防护（安全头）
- ✅ 审计日志记录

## 📈 性能优化

- 数据库索引优化
- 分页查询
- 异步编程
- 响应缓存
- 静态资源 CDN

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情

## 👨‍💻 作者

Your Name - [your.email@example.com](mailto:your.email@example.com)

## 🙏 致谢

- [ASP.NET Core](https://docs.microsoft.com/en-us/aspnet/core/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/)

---

**⭐ 如果这个项目对你有帮助，请给一个 Star！**
