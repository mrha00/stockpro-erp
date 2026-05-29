using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Threading.RateLimiting;
using InventorySystem.Api.Middleware;
using InventorySystem.Application.Interfaces;
using InventorySystem.Application.Validators;
using InventorySystem.Domain.Entities;
using InventorySystem.Domain.Enums;
using InventorySystem.Infrastructure.Data;
using InventorySystem.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration
    .AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

// 配置 Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/log-.txt", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 30)
    .CreateLogger();

builder.Host.UseSerilog();

// 配置数据库上下文
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 配置服务
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ISupplierService, SupplierService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IPurchaseOrderService, PurchaseOrderService>();
builder.Services.AddScoped<ISalesOrderService, SalesOrderService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();

// 配置 FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

// 配置 JWT 认证
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");
var key = Encoding.UTF8.GetBytes(jwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = builder.Environment.IsProduction();
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// 配置 CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:3000" };
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowConfiguredOrigins", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// 配置限流
builder.Services.AddRateLimiter(options =>
{
    // 固定窗口限流
    options.AddFixedWindowLimiter("fixed", limiterOptions =>
    {
        limiterOptions.PermitLimit = 100;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 10;
    });

    // 滑动窗口限流（用于登录接口）
    options.AddSlidingWindowLimiter("login", limiterOptions =>
    {
        limiterOptions.PermitLimit = 5;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.SegmentsPerWindow = 6;
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 2;
    });

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// 配置控制器
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// 配置 Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Inventory System API",
        Version = "v1",
        Description = "进销存管理系统 API"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// 配置中间件管道
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 全局异常处理
app.UseMiddleware<ExceptionHandlingMiddleware>();

// HTTPS 重定向
app.UseHttpsRedirection();

// CORS
app.UseCors("AllowConfiguredOrigins");

// 限流
app.UseRateLimiter();

// 认证授权
app.UseAuthentication();
app.UseAuthorization();

// 审计日志
app.UseMiddleware<AuditLogMiddleware>();

// 路由
app.MapControllers();

// 启动时自动迁移数据库（开发环境）
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await dbContext.Database.MigrateAsync();

    // 种子数据：创建默认管理员账户和分类
    if (!await dbContext.Users.AnyAsync())
    {
        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            Username = "admin",
            Email = "admin@inventory.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            RealName = "系统管理员",
            Role = UserRole.Admin,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        dbContext.Users.Add(adminUser);

        // 创建测试用户
        var testUser = new User
        {
            Id = Guid.NewGuid(),
            Username = "test",
            Email = "test@inventory.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("test123"),
            RealName = "测试用户",
            Role = UserRole.Salesman,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        dbContext.Users.Add(testUser);

        var categories = new[]
        {
            new Category { Id = Guid.NewGuid(), Name = "电子数码", Code = "ELEC", SortOrder = 1 },
            new Category { Id = Guid.NewGuid(), Name = "办公用品", Code = "OFFICE", SortOrder = 2 },
            new Category { Id = Guid.NewGuid(), Name = "五金工具", Code = "TOOLS", SortOrder = 3 },
            new Category { Id = Guid.NewGuid(), Name = "服装鞋帽", Code = "APPAREL", SortOrder = 4 },
            new Category { Id = Guid.NewGuid(), Name = "家居用品", Code = "HOME", SortOrder = 5 },
        };
        dbContext.Categories.AddRange(categories);

        // 创建产品
        var products = new[]
        {
            new Product { Id = Guid.NewGuid(), Name = "ThinkPad X1 Carbon 笔记本电脑", Sku = "TP-X1C", CategoryId = categories[0].Id, Unit = "台", SalePrice = 9999.00m, CostPrice = 7500.00m, MinStock = 5, MaxStock = 50, Barcode = "6901234567890", Description = "14英寸轻薄商务笔记本，Intel Core i7处理器" },
            new Product { Id = Guid.NewGuid(), Name = "Dell U2723QE 4K显示器", Sku = "DELL-U27", CategoryId = categories[0].Id, Unit = "台", SalePrice = 3999.00m, CostPrice = 2800.00m, MinStock = 10, MaxStock = 100, Barcode = "6901234567891", Description = "27英寸4K IPS显示器，USB-C接口" },
            new Product { Id = Guid.NewGuid(), Name = "Logitech MX Master 3S 鼠标", Sku = "LOG-MXM3", CategoryId = categories[0].Id, Unit = "个", SalePrice = 799.00m, CostPrice = 550.00m, MinStock = 20, MaxStock = 200, Barcode = "6901234567892", Description = "无线蓝牙鼠标，静音点击，电磁滚轮" },
            new Product { Id = Guid.NewGuid(), Name = "Logitech MX Keys S 键盘", Sku = "LOG-MXKS", CategoryId = categories[0].Id, Unit = "个", SalePrice = 899.00m, CostPrice = 620.00m, MinStock = 15, MaxStock = 150, Barcode = "6901234567893", Description = "无线蓝牙键盘，背光，多设备切换" },
            new Product { Id = Guid.NewGuid(), Name = "HP LaserJet Pro M404dn 激光打印机", Sku = "HP-M404", CategoryId = categories[1].Id, Unit = "台", SalePrice = 2999.00m, CostPrice = 2100.00m, MinStock = 5, MaxStock = 30, Barcode = "6901234567894", Description = "黑白激光打印机，自动双面打印" },
            new Product { Id = Guid.NewGuid(), Name = "A4复印纸（80g）", Sku = "PAPER-A4", CategoryId = categories[1].Id, Unit = "箱", SalePrice = 120.00m, CostPrice = 85.00m, MinStock = 50, MaxStock = 500, Barcode = "6901234567895", Description = "80克A4复印纸，500张/包，5包/箱" },
            new Product { Id = Guid.NewGuid(), Name = "Stanley 史丹利工具套装", Sku = "STL-SET", CategoryId = categories[2].Id, Unit = "套", SalePrice = 399.00m, CostPrice = 280.00m, MinStock = 10, MaxStock = 100, Barcode = "6901234567896", Description = "45件家用工具套装，含螺丝刀、扳手等" },
            new Product { Id = Guid.NewGuid(), Name = "安全帽（黄色）", Sku = "SAFETY-HAT", CategoryId = categories[2].Id, Unit = "顶", SalePrice = 35.00m, CostPrice = 22.00m, MinStock = 100, MaxStock = 1000, Barcode = "6901234567897", Description = "ABS工程塑料安全帽，符合GB2811标准" },
            new Product { Id = Guid.NewGuid(), Name = "Bosch 博世电钻 GBM 13 RE", Sku = "BSCH-GBM13", CategoryId = categories[2].Id, Unit = "台", SalePrice = 599.00m, CostPrice = 420.00m, MinStock = 8, MaxStock = 50, Barcode = "6901234567898", Description = "600W冲击钻，13mm夹头，无级调速" },
            new Product { Id = Guid.NewGuid(), Name = "办公椅（人体工学）", Sku = "CHAIR-ERG", CategoryId = categories[4].Id, Unit = "把", SalePrice = 1299.00m, CostPrice = 900.00m, MinStock = 10, MaxStock = 80, Barcode = "6901234567899", Description = "人体工学办公椅，可调节扶手、腰靠" },
        };
        dbContext.Products.AddRange(products);

        // 创建客户
        var customers = new[]
        {
            new Customer { Id = Guid.NewGuid(), Name = "先锋科技零售连锁", Code = "CUST-001", ContactPerson = "李经理", Phone = "13800138001", Email = "li@xianfeng.com", Address = "北京市朝阳区科技路100号", CreditLimit = 500000.00m, CustomerType = "VIP客户" },
            new Customer { Id = Guid.NewGuid(), Name = "顺风智慧仓储物流", Code = "CUST-002", ContactPerson = "王总监", Phone = "13900139002", Email = "wang@shunfeng.com", Address = "上海市浦东新区物流园区A区", CreditLimit = 1000000.00m, CustomerType = "大客户" },
            new Customer { Id = Guid.NewGuid(), Name = "金盛百货商场", Code = "CUST-003", ContactPerson = "张采购", Phone = "13700137003", Email = "zhang@jinsheng.com", Address = "广州市天河区商业街88号", CreditLimit = 300000.00m, CustomerType = "普通客户" },
            new Customer { Id = Guid.NewGuid(), Name = "个体采购商 周先生", Code = "CUST-004", ContactPerson = "周先生", Phone = "13600136004", Email = "zhou@personal.com", Address = "深圳市南山区科技园", CreditLimit = 50000.00m, CustomerType = "个人客户" },
        };
        dbContext.Customers.AddRange(customers);

        // 创建供应商
        var suppliers = new[]
        {
            new Supplier { Id = Guid.NewGuid(), Name = "联想集团供应链", Code = "SUPP-001", ContactPerson = "刘经理", Phone = "13800138011", Email = "liu@lenovo.com", Address = "北京市海淀区中关村", Remarks = "月结30天" },
            new Supplier { Id = Guid.NewGuid(), Name = "深圳华强电子", Code = "SUPP-002", ContactPerson = "陈主管", Phone = "13900139012", Email = "chen@huaqiang.com", Address = "深圳市福田区华强北", Remarks = "月结45天" },
            new Supplier { Id = Guid.NewGuid(), Name = "宁波博世工具代理", Code = "SUPP-003", ContactPerson = "赵经理", Phone = "13700137013", Email = "zhao@bosch-dealer.com", Address = "宁波市海曙区工业区", Remarks = "月结30天" },
        };
        dbContext.Suppliers.AddRange(suppliers);

        await dbContext.SaveChangesAsync();

        // 创建库存记录
        var inventoryRecords = products.Select(p => new Inventory
        {
            Id = Guid.NewGuid(),
            ProductId = p.Id,
            Quantity = Random.Shared.Next(50, 200),
            FrozenQuantity = Random.Shared.Next(0, 10),
            Location = $"A{Random.Shared.Next(1, 10)}-{Random.Shared.Next(1, 20):D2}",
            LastInboundAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 30)),
            LastOutboundAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 15)),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }).ToArray();
        dbContext.Inventories.AddRange(inventoryRecords);

        // 创建库存交易记录
        var transactions = new[]
        {
            new InventoryTransaction { Id = Guid.NewGuid(), ProductId = products[0].Id, TransactionType = "Inbound", Quantity = 50, UnitPrice = products[0].CostPrice, Remarks = "初始入库", CreatedAt = DateTime.UtcNow.AddDays(-30) },
            new InventoryTransaction { Id = Guid.NewGuid(), ProductId = products[1].Id, TransactionType = "Inbound", Quantity = 100, UnitPrice = products[1].CostPrice, Remarks = "初始入库", CreatedAt = DateTime.UtcNow.AddDays(-30) },
            new InventoryTransaction { Id = Guid.NewGuid(), ProductId = products[0].Id, TransactionType = "Outbound", Quantity = -5, UnitPrice = products[0].SalePrice, Remarks = "销售出库", CreatedAt = DateTime.UtcNow.AddDays(-15) },
            new InventoryTransaction { Id = Guid.NewGuid(), ProductId = products[2].Id, TransactionType = "Inbound", Quantity = 200, UnitPrice = products[2].CostPrice, Remarks = "采购入库", CreatedAt = DateTime.UtcNow.AddDays(-25) },
            new InventoryTransaction { Id = Guid.NewGuid(), ProductId = products[5].Id, TransactionType = "Outbound", Quantity = -20, UnitPrice = products[5].SalePrice, Remarks = "销售出库", CreatedAt = DateTime.UtcNow.AddDays(-10) },
            new InventoryTransaction { Id = Guid.NewGuid(), ProductId = products[3].Id, TransactionType = "Adjust", Quantity = 5, UnitPrice = products[3].CostPrice, Remarks = "盘点调整", CreatedAt = DateTime.UtcNow.AddDays(-5) },
            new InventoryTransaction { Id = Guid.NewGuid(), ProductId = products[9].Id, TransactionType = "Inbound", Quantity = 30, UnitPrice = products[9].CostPrice, Remarks = "补货入库", CreatedAt = DateTime.UtcNow.AddDays(-3) },
        };
        dbContext.InventoryTransactions.AddRange(transactions);

        await dbContext.SaveChangesAsync();
        Log.Information("Seed data created: users, categories, products, customers, suppliers, inventory, and transactions");
    }
}

try
{
    Log.Information("Starting Inventory System API");
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
