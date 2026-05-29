using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using InventorySystem.Application.DTOs.Products;
using InventorySystem.Domain.Exceptions;
using InventorySystem.Infrastructure.Data;
using InventorySystem.Infrastructure.Services;
using InventorySystem.UnitTests.Helpers;

namespace InventorySystem.UnitTests.Services;

public class ProductServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ProductService _sut;

    public ProductServiceTests()
    {
        _context = TestDbContextFactory.Create();
        _sut = new ProductService(_context);
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    [Fact]
    public async Task CreateAsync_ValidRequest_ShouldCreateProduct()
    {
        var category = new Domain.Entities.Category
        {
            Id = Guid.NewGuid(),
            Name = "测试分类",
            Code = "CAT-001"
        };
        await _context.Categories.AddAsync(category);
        await _context.SaveChangesAsync();

        var request = new CreateProductRequest
        {
            Name = "新商品",
            Sku = "SKU-001",
            CategoryId = category.Id,
            Unit = "个",
            CostPrice = 100,
            SalePrice = 150
        };

        var result = await _sut.CreateAsync(request);

        result.Should().NotBeNull();
        result.Name.Should().Be(request.Name);
        result.Sku.Should().Be(request.Sku);

        var inventory = await _context.Inventories.FirstOrDefaultAsync(i => i.ProductId == result.Id);
        inventory.Should().NotBeNull();
        inventory!.Quantity.Should().Be(0);
    }

    [Fact]
    public async Task CreateAsync_DuplicateSku_ShouldThrowConflictException()
    {
        var category = new Domain.Entities.Category
        {
            Id = Guid.NewGuid(),
            Name = "测试分类",
            Code = "CAT-001"
        };
        await _context.Categories.AddAsync(category);

        var product = new Domain.Entities.Product
        {
            Id = Guid.NewGuid(),
            Name = "已有商品",
            Sku = "EXIST-SKU",
            CategoryId = category.Id,
            Unit = "个",
            CostPrice = 100,
            SalePrice = 150
        };
        await _context.Products.AddAsync(product);
        await _context.SaveChangesAsync();

        var request = new CreateProductRequest
        {
            Name = "新商品",
            Sku = "EXIST-SKU",
            CategoryId = category.Id,
            Unit = "个",
            CostPrice = 100,
            SalePrice = 150
        };

        await _sut.Invoking(s => s.CreateAsync(request))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task GetPagedAsync_WithKeyword_ShouldFilterResults()
    {
        var category = new Domain.Entities.Category
        {
            Id = Guid.NewGuid(),
            Name = "测试分类",
            Code = "CAT-001"
        };
        await _context.Categories.AddAsync(category);

        var products = new List<Domain.Entities.Product>
        {
            new() { Id = Guid.NewGuid(), Name = "苹果手机", Sku = "APL-001", CategoryId = category.Id, Unit = "个", CostPrice = 5000, SalePrice = 6000 },
            new() { Id = Guid.NewGuid(), Name = "苹果电脑", Sku = "APL-002", CategoryId = category.Id, Unit = "台", CostPrice = 10000, SalePrice = 12000 },
            new() { Id = Guid.NewGuid(), Name = "华为手机", Sku = "HW-001", CategoryId = category.Id, Unit = "个", CostPrice = 4000, SalePrice = 5000 }
        };
        await _context.Products.AddRangeAsync(products);
        await _context.SaveChangesAsync();

        var queryParams = new ProductQueryParams
        {
            Keyword = "苹果",
            Page = 1,
            PageSize = 20
        };

        var result = await _sut.GetPagedAsync(queryParams);

        result.Items.Should().HaveCount(2);
        result.Items.Should().AllSatisfy(p => p.Name.Should().Contain("苹果"));
    }

    [Fact]
    public async Task GetPagedAsync_LowStockFilter_ShouldFilterAtDatabaseLevel()
    {
        var category = new Domain.Entities.Category
        {
            Id = Guid.NewGuid(),
            Name = "测试分类",
            Code = "CAT-LOW"
        };
        await _context.Categories.AddAsync(category);

        var lowStockProduct = new Domain.Entities.Product
        {
            Id = Guid.NewGuid(),
            Name = "低库存商品",
            Sku = "LOW-001",
            CategoryId = category.Id,
            Unit = "个",
            CostPrice = 10,
            SalePrice = 20,
            MinStock = 10
        };
        var normalProduct = new Domain.Entities.Product
        {
            Id = Guid.NewGuid(),
            Name = "正常库存商品",
            Sku = "NORM-001",
            CategoryId = category.Id,
            Unit = "个",
            CostPrice = 10,
            SalePrice = 20,
            MinStock = 5
        };
        await _context.Products.AddRangeAsync(lowStockProduct, normalProduct);
        await _context.Inventories.AddRangeAsync(
            new Domain.Entities.Inventory { Id = Guid.NewGuid(), ProductId = lowStockProduct.Id, Quantity = 8 },
            new Domain.Entities.Inventory { Id = Guid.NewGuid(), ProductId = normalProduct.Id, Quantity = 50 });
        await _context.SaveChangesAsync();

        var result = await _sut.GetPagedAsync(new ProductQueryParams { LowStock = true, Page = 1, PageSize = 20 });

        result.Items.Should().HaveCount(1);
        result.Items[0].Sku.Should().Be("LOW-001");
        result.Pagination.Total.Should().Be(1);
    }
}
