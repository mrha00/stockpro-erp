using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using InventorySystem.Application.DTOs.Inventories;
using InventorySystem.Domain.Entities;
using InventorySystem.Domain.Exceptions;
using InventorySystem.Infrastructure.Data;
using InventorySystem.Infrastructure.Services;

namespace InventorySystem.UnitTests.Services;

public class InventoryServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly ApplicationDbContext _context;
    private readonly InventoryService _sut;

    public InventoryServiceTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(_connection)
            .Options;
        _context = new ApplicationDbContext(options);
        _context.Database.EnsureCreated();
        _sut = new InventoryService(_context);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    private async Task<Product> SeedProductAsync(int initialQty = 50)
    {
        var category = new Category { Id = Guid.NewGuid(), Name = "测试", Code = "T1" };
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "库存测试商品",
            Sku = "INV-001",
            CategoryId = category.Id,
            Unit = "个",
            CostPrice = 10,
            SalePrice = 20,
            MinStock = 5
        };
        await _context.Categories.AddAsync(category);
        await _context.Products.AddAsync(product);
        await _context.Inventories.AddAsync(new Inventory
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Quantity = initialQty
        });
        await _context.SaveChangesAsync();
        return product;
    }

    [Fact]
    public async Task AdjustAsync_Inbound_ShouldIncreaseQuantity()
    {
        var product = await SeedProductAsync(50);
        var userId = Guid.NewGuid();

        await _sut.AdjustAsync(new AdjustInventoryRequest
        {
            ProductId = product.Id,
            Quantity = 10,
            AdjustType = "Inbound",
            Reason = "采购入库"
        }, userId);

        var inventory = await _context.Inventories.FirstAsync(i => i.ProductId == product.Id);
        inventory.Quantity.Should().Be(60);
    }

    [Fact]
    public async Task AdjustAsync_Outbound_ShouldDecreaseQuantity()
    {
        var product = await SeedProductAsync(50);
        var userId = Guid.NewGuid();

        await _sut.AdjustAsync(new AdjustInventoryRequest
        {
            ProductId = product.Id,
            Quantity = 5,
            AdjustType = "Outbound",
            Reason = "销售出库"
        }, userId);

        var inventory = await _context.Inventories.FirstAsync(i => i.ProductId == product.Id);
        inventory.Quantity.Should().Be(45);
    }

    [Fact]
    public async Task AdjustAsync_OutboundInsufficient_ShouldThrowBusinessException()
    {
        var product = await SeedProductAsync(3);
        var userId = Guid.NewGuid();

        await _sut.Invoking(s => s.AdjustAsync(new AdjustInventoryRequest
            {
                ProductId = product.Id,
                Quantity = 10,
                AdjustType = "Outbound"
            }, userId))
            .Should().ThrowAsync<BusinessException>();
    }
}
