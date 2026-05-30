using InventorySystem.Domain.Entities;
using InventorySystem.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace InventorySystem.Infrastructure.Data;

/// <summary>
/// 演示环境种子数据（密码统一 123456）
/// </summary>
public static class DatabaseSeeder
{
    public const string DemoPassword = "123456";

    public static async Task SeedAsync(ApplicationDbContext context, ILogger logger, CancellationToken cancellationToken = default)
    {
        if (await context.Users.AnyAsync(cancellationToken))
        {
            logger.LogInformation("Seed skipped: users already exist");
            return;
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(DemoPassword);

        var users = new[]
        {
            CreateUser("admin", "admin@stockpro.local", "系统管理员", UserRole.Admin, passwordHash),
            CreateUser("purchase", "purchase@stockpro.local", "采购员", UserRole.Purchaser, passwordHash),
            CreateUser("sale", "sale@stockpro.local", "销售员", UserRole.Salesman, passwordHash),
            CreateUser("stock", "stock@stockpro.local", "仓管员", UserRole.WarehouseKeeper, passwordHash),
        };
        await context.Users.AddRangeAsync(users, cancellationToken);

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = "电子数码",
            Code = "ELEC",
            SortOrder = 1,
            Description = "演示分类"
        };
        await context.Categories.AddAsync(category, cancellationToken);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "无线鼠标",
            Sku = "DEMO-MOUSE-001",
            CategoryId = category.Id,
            Unit = "个",
            CostPrice = 45,
            SalePrice = 89,
            MinStock = 10,
            MaxStock = 500,
            IsActive = true
        };
        await context.Products.AddAsync(product, cancellationToken);

        await context.Inventories.AddAsync(new Inventory
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Quantity = 120,
            TotalAmount = 5400
        }, cancellationToken);

        await context.Suppliers.AddAsync(new Supplier
        {
            Id = Guid.NewGuid(),
            Name = "华南供应链",
            Code = "SUP-001",
            ContactPerson = "张经理",
            Phone = "13800001001"
        }, cancellationToken);

        await context.Customers.AddAsync(new Customer
        {
            Id = Guid.NewGuid(),
            Name = "示例客户有限公司",
            Code = "CUS-001",
            ContactPerson = "李总",
            Phone = "13900002002",
            CustomerType = "VIP客户"
        }, cancellationToken);

        await context.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Demo seed data created (login: admin / {Password})", DemoPassword);
    }

    private static User CreateUser(string username, string email, string realName, UserRole role, string passwordHash) =>
        new()
        {
            Id = Guid.NewGuid(),
            Username = username,
            Email = email,
            RealName = realName,
            Role = role,
            PasswordHash = passwordHash,
            IsActive = true
        };
}
