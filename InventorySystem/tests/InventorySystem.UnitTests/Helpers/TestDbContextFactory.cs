using Microsoft.EntityFrameworkCore;
using InventorySystem.Domain.Entities;
using InventorySystem.Domain.Enums;
using InventorySystem.Infrastructure.Data;

namespace InventorySystem.UnitTests.Helpers;

public static class TestDbContextFactory
{
    public static ApplicationDbContext Create()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new ApplicationDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }

    public static async Task<ApplicationDbContext> CreateWithSeedDataAsync()
    {
        var context = Create();

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = "电子产品",
            Code = "ELEC",
            SortOrder = 1
        };
        await context.Categories.AddAsync(category);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "测试商品",
            Sku = "TEST-001",
            CategoryId = category.Id,
            Unit = "个",
            CostPrice = 100,
            SalePrice = 150,
            MinStock = 10,
            MaxStock = 1000
        };
        await context.Products.AddAsync(product);

        var inventory = new Inventory
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Quantity = 50,
            TotalAmount = 5000
        };
        await context.Inventories.AddAsync(inventory);

        var supplier = new Supplier
        {
            Id = Guid.NewGuid(),
            Name = "测试供应商",
            Code = "SUP-001",
            ContactPerson = "张三",
            Phone = "13800138000"
        };
        await context.Suppliers.AddAsync(supplier);

        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            Name = "测试客户",
            Code = "CUS-001",
            ContactPerson = "李四",
            Phone = "13900139000"
        };
        await context.Customers.AddAsync(customer);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "testuser",
            Email = "test@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test123456"),
            Role = UserRole.Admin,
            IsActive = true
        };
        await context.Users.AddAsync(user);

        await context.SaveChangesAsync();
        return context;
    }
}
