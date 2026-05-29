using Microsoft.EntityFrameworkCore;
using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.SalesOrders;
using InventorySystem.Application.Interfaces;
using InventorySystem.Domain.Entities;
using InventorySystem.Domain.Enums;
using InventorySystem.Domain.Exceptions;
using InventorySystem.Infrastructure.Data;

namespace InventorySystem.Infrastructure.Services;

public class SalesOrderService : ISalesOrderService
{
    private readonly ApplicationDbContext _context;

    public SalesOrderService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SalesOrderDto> CreateAsync(CreateSalesOrderRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var customer = await _context.Customers.FindAsync(new object[] { request.CustomerId }, cancellationToken)
            ?? throw new NotFoundException("Customer not found");

        if (!request.Items.Any())
            throw new ValidationException("Items", "Order must have at least one item");

        var productIds = request.Items.Select(i => i.ProductId).ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync(cancellationToken);

        foreach (var item in request.Items)
        {
            if (products.All(p => p.Id != item.ProductId))
                throw new NotFoundException($"Product {item.ProductId} not found");
        }

        var orderNo = await GenerateOrderNoAsync("SO", cancellationToken);

        var order = new SalesOrder
        {
            Id = Guid.NewGuid(),
            OrderNo = orderNo,
            CustomerId = request.CustomerId,
            Status = OrderStatus.Draft,
            PaymentStatus = PaymentStatus.Unpaid,
            TotalAmount = request.Items.Sum(i => i.Quantity * i.UnitPrice),
            OrderDate = DateTime.UtcNow,
            ShippingAddress = request.ShippingAddress,
            Remarks = request.Remarks,
            CreatedBy = userId
        };

        foreach (var item in request.Items)
        {
            order.Items.Add(new SalesOrderItem
            {
                Id = Guid.NewGuid(),
                SalesOrderId = order.Id,
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice
            });
        }

        await _context.SalesOrders.AddAsync(order, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(order);
    }

    public async Task<SalesOrderDto> UpdateAsync(Guid id, UpdateSalesOrderRequest request, CancellationToken cancellationToken = default)
    {
        var order = await _context.SalesOrders.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new NotFoundException("SalesOrder", id);

        if (order.Status != OrderStatus.Draft)
            throw new BusinessException("Only draft orders can be updated", "INVALID_STATUS");

        if (request.ShippingAddress != null) order.ShippingAddress = request.ShippingAddress;
        if (request.Remarks != null) order.Remarks = request.Remarks;

        await _context.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("SalesOrder", id);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var order = await _context.SalesOrders.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new NotFoundException("SalesOrder", id);

        if (order.Status != OrderStatus.Draft)
            throw new BusinessException("Only draft orders can be deleted", "INVALID_STATUS");

        order.IsDeleted = true;
        order.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<SalesOrderDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var order = await _context.SalesOrders
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .Include(o => o.Customer)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);

        return order == null ? null : MapToDto(order);
    }

    public async Task<PagedResponse<SalesOrderDto>> GetPagedAsync(SalesOrderQueryParams queryParams, CancellationToken cancellationToken = default)
    {
        var query = _context.SalesOrders
            .Include(o => o.Customer)
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .AsQueryable();

        if (!string.IsNullOrEmpty(queryParams.OrderNo))
            query = query.Where(o => o.OrderNo.Contains(queryParams.OrderNo));

        if (queryParams.CustomerId.HasValue)
            query = query.Where(o => o.CustomerId == queryParams.CustomerId);

        if (queryParams.Status.HasValue)
            query = query.Where(o => o.Status == queryParams.Status);

        if (queryParams.PaymentStatus.HasValue)
            query = query.Where(o => o.PaymentStatus == queryParams.PaymentStatus);

        if (queryParams.StartDate.HasValue)
            query = query.Where(o => o.OrderDate >= queryParams.StartDate);

        if (queryParams.EndDate.HasValue)
            query = query.Where(o => o.OrderDate <= queryParams.EndDate);

        var total = await query.CountAsync(cancellationToken);
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((queryParams.Page - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResponse<SalesOrderDto>
        {
            Items = orders.Select(MapToDto).ToList(),
            Pagination = new PaginationInfo
            {
                Page = queryParams.Page,
                PageSize = queryParams.PageSize,
                Total = total,
                TotalPages = (int)Math.Ceiling(total / (double)queryParams.PageSize)
            }
        };
    }

    public async Task<SalesOrderDto> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var order = await _context.SalesOrders.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new NotFoundException("SalesOrder", id);

        if (order.Status != OrderStatus.Draft && order.Status != OrderStatus.PendingApproval)
            throw new BusinessException("Order cannot be approved in current status", "INVALID_STATUS");

        order.Status = OrderStatus.Approved;
        order.ApprovedBy = userId;
        order.ApprovedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("SalesOrder", id);
    }

    public async Task<SalesOrderDto> ShipAsync(Guid id, ShipSalesOrderRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        await using var dbTransaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var order = await _context.SalesOrders
                .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(o => o.Id == id, cancellationToken)
                ?? throw new NotFoundException("SalesOrder", id);

            if (order.Status != OrderStatus.Approved && order.Status != OrderStatus.Processing)
                throw new BusinessException("Order cannot be shipped in current status", "INVALID_STATUS");

            foreach (var shipItem in request.Items)
            {
                var orderItem = order.Items.FirstOrDefault(i => i.ProductId == shipItem.ProductId)
                    ?? throw new NotFoundException($"Product {shipItem.ProductId} not found in order");

                if (orderItem.ShippedQuantity + shipItem.Quantity > orderItem.Quantity)
                    throw new BusinessException($"Shipped quantity exceeds ordered quantity for product {shipItem.ProductId}", "QUANTITY_EXCEEDED");

                var inventory = await _context.Inventories
                    .FirstOrDefaultAsync(i => i.ProductId == shipItem.ProductId, cancellationToken)
                    ?? throw new NotFoundException($"Inventory not found for product {shipItem.ProductId}");

                if (inventory.AvailableQuantity < shipItem.Quantity)
                    throw new InsufficientStockException(orderItem.Product?.Name ?? shipItem.ProductId.ToString(), inventory.AvailableQuantity, shipItem.Quantity);

                orderItem.ShippedQuantity += shipItem.Quantity;
                inventory.Quantity -= shipItem.Quantity;
                inventory.LastOutboundAt = DateTime.UtcNow;

                await _context.InventoryTransactions.AddAsync(new InventoryTransaction
                {
                    Id = Guid.NewGuid(),
                    ProductId = shipItem.ProductId,
                    TransactionType = "Outbound",
                    Quantity = -shipItem.Quantity,
                    UnitPrice = orderItem.UnitPrice,
                    ReferenceType = "SalesOrder",
                    ReferenceId = order.Id,
                    ReferenceNo = order.OrderNo,
                    CreatedBy = userId
                }, cancellationToken);
            }

            var allShipped = order.Items.All(i => i.ShippedQuantity >= i.Quantity);
            order.Status = allShipped ? OrderStatus.Completed : OrderStatus.Processing;
            if (allShipped) order.ShippedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            await dbTransaction.CommitAsync(cancellationToken);
            return MapToDto(order);
        }
        catch
        {
            await dbTransaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<SalesOrderDto> CancelAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        await using var dbTransaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var order = await _context.SalesOrders
                .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(o => o.Id == id, cancellationToken)
                ?? throw new NotFoundException("SalesOrder", id);

            if (order.Status == OrderStatus.Completed)
                throw new BusinessException("Completed orders cannot be cancelled", "INVALID_STATUS");

            foreach (var item in order.Items.Where(i => i.ShippedQuantity > 0))
            {
                var inventory = await _context.Inventories
                    .FirstOrDefaultAsync(i => i.ProductId == item.ProductId, cancellationToken);

                if (inventory != null)
                {
                    inventory.Quantity += item.ShippedQuantity;
                    await _context.InventoryTransactions.AddAsync(new InventoryTransaction
                    {
                        Id = Guid.NewGuid(),
                        ProductId = item.ProductId,
                        TransactionType = "Inbound",
                        Quantity = item.ShippedQuantity,
                        UnitPrice = item.UnitPrice,
                        ReferenceType = "SalesOrderCancel",
                        ReferenceId = order.Id,
                        ReferenceNo = order.OrderNo,
                        Remarks = "Order cancellation stock rollback",
                        CreatedBy = userId
                    }, cancellationToken);
                }

                item.ShippedQuantity = 0;
            }

            order.Status = OrderStatus.Cancelled;
            await _context.SaveChangesAsync(cancellationToken);
            await dbTransaction.CommitAsync(cancellationToken);
            return MapToDto(order);
        }
        catch
        {
            await dbTransaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private async Task<string> GenerateOrderNoAsync(string prefix, CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 5; attempt++)
        {
            var today = DateTime.UtcNow.ToString("yyyyMMdd");
            var lastOrder = await _context.SalesOrders
                .Where(o => o.OrderNo.StartsWith($"{prefix}{today}"))
                .OrderByDescending(o => o.OrderNo)
                .FirstOrDefaultAsync(cancellationToken);

            var sequence = 1;
            if (lastOrder != null && int.TryParse(lastOrder.OrderNo[^4..], out var seq))
                sequence = seq + 1 + attempt;

            var orderNo = $"{prefix}{today}{sequence:D4}";
            if (!await _context.SalesOrders.AnyAsync(o => o.OrderNo == orderNo, cancellationToken))
                return orderNo;
        }

        return $"{prefix}{DateTime.UtcNow:yyyyMMddHHmmss}{Random.Shared.Next(1000, 9999)}";
    }

    private static SalesOrderDto MapToDto(SalesOrder order)
    {
        return new SalesOrderDto
        {
            Id = order.Id,
            OrderNo = order.OrderNo,
            CustomerId = order.CustomerId,
            CustomerName = order.Customer?.Name ?? string.Empty,
            Status = order.Status,
            StatusText = order.Status.ToString(),
            PaymentStatus = order.PaymentStatus,
            PaymentStatusText = order.PaymentStatus.ToString(),
            TotalAmount = order.TotalAmount,
            ReceivedAmount = order.ReceivedAmount,
            OrderDate = order.OrderDate,
            ShippedDate = order.ShippedDate,
            ShippingAddress = order.ShippingAddress,
            Remarks = order.Remarks,
            Items = order.Items.Select(i => new SalesOrderItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product?.Name ?? string.Empty,
                ProductSku = i.Product?.Sku ?? string.Empty,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                Subtotal = i.Quantity * i.UnitPrice,
                ShippedQuantity = i.ShippedQuantity
            }).ToList(),
            CreatedAt = order.CreatedAt
        };
    }
}
