using FluentAssertions;
using InventorySystem.Application.DTOs.SalesOrders;
using InventorySystem.Domain.Entities;
using InventorySystem.Domain.Enums;
using InventorySystem.Domain.Exceptions;
using InventorySystem.Infrastructure.Data;
using InventorySystem.Infrastructure.Services;
using InventorySystem.UnitTests.Helpers;

namespace InventorySystem.UnitTests.Services;

public class SalesOrderServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly SalesOrderService _sut;

    public SalesOrderServiceTests()
    {
        _context = TestDbContextFactory.Create();
        _sut = new SalesOrderService(_context);
    }

    public void Dispose() => _context.Dispose();

    private async Task<(Customer Customer, Product Product, Guid UserId)> SeedOrderContextAsync()
    {
        var category = new Category { Id = Guid.NewGuid(), Name = "分类", Code = "CAT" };
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "订单商品",
            Sku = "SO-001",
            CategoryId = category.Id,
            Unit = "个",
            CostPrice = 10,
            SalePrice = 25
        };
        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            Name = "订单客户",
            Code = "C-001"
        };
        await _context.Categories.AddAsync(category);
        await _context.Products.AddAsync(product);
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();
        return (customer, product, Guid.NewGuid());
    }

    [Fact]
    public async Task CreateAsync_ValidRequest_ShouldCreateDraftOrder()
    {
        var (customer, product, userId) = await SeedOrderContextAsync();

        var result = await _sut.CreateAsync(new CreateSalesOrderRequest
        {
            CustomerId = customer.Id,
            Items =
            [
                new SalesOrderItemRequest
                {
                    ProductId = product.Id,
                    Quantity = 2,
                    UnitPrice = 25
                }
            ]
        }, userId);

        result.OrderNo.Should().StartWith("SO");
        result.Status.Should().Be(OrderStatus.Draft);
        result.TotalAmount.Should().Be(50);
    }

    [Fact]
    public async Task ApproveAsync_DraftOrder_ShouldSetApproved()
    {
        var (customer, product, userId) = await SeedOrderContextAsync();
        var created = await _sut.CreateAsync(new CreateSalesOrderRequest
        {
            CustomerId = customer.Id,
            Items =
            [
                new SalesOrderItemRequest { ProductId = product.Id, Quantity = 1, UnitPrice = 25 }
            ]
        }, userId);

        var approved = await _sut.ApproveAsync(created.Id, userId);

        approved.Status.Should().Be(OrderStatus.Approved);
    }

    [Fact]
    public async Task CreateAsync_NoItems_ShouldThrowValidationException()
    {
        var (customer, _, userId) = await SeedOrderContextAsync();

        await _sut.Invoking(s => s.CreateAsync(new CreateSalesOrderRequest
            {
                CustomerId = customer.Id,
                Items = []
            }, userId))
            .Should().ThrowAsync<ValidationException>();
    }
}
