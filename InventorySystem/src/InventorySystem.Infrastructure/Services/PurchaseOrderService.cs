using Microsoft.EntityFrameworkCore;
using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.PurchaseOrders;
using InventorySystem.Application.Interfaces;
using InventorySystem.Domain.Entities;
using InventorySystem.Domain.Enums;
using InventorySystem.Domain.Exceptions;
using InventorySystem.Infrastructure.Data;

namespace InventorySystem.Infrastructure.Services;

public class PurchaseOrderService : IPurchaseOrderService
{
    private readonly ApplicationDbContext _context;

    public PurchaseOrderService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PurchaseOrderDto> CreateAsync(CreatePurchaseOrderRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var supplier = await _context.Suppliers.FindAsync(new object[] { request.SupplierId }, cancellationToken)
            ?? throw new NotFoundException("Supplier not found");

        if (!request.Items.Any())
            throw new ValidationException("Items", "Order must have at least one item");

        var productIds = request.Items.Select(i => i.ProductId).ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync(cancellationToken);

        foreach (var item in request.Items)
        {
            if (!products.Any(p => p.Id == item.ProductId))
                throw new NotFoundException($"Product {item.ProductId} not found");
        }

        var orderNo = await GenerateOrderNoAsync("PO", cancellationToken);

        var order = new PurchaseOrder
        {
            Id = Guid.NewGuid(),
            OrderNo = orderNo,
            SupplierId = request.SupplierId,
            Status = OrderStatus.Draft,
            PaymentStatus = PaymentStatus.Unpaid,
            TotalAmount = request.Items.Sum(i => i.Quantity * i.UnitPrice),
            OrderDate = DateTime.UtcNow,
            ExpectedDate = request.ExpectedDate,
            Remarks = request.Remarks,
            CreatedBy = userId
        };

        foreach (var item in request.Items)
        {
            order.Items.Add(new PurchaseOrderItem
            {
                Id = Guid.NewGuid(),
                PurchaseOrderId = order.Id,
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice
            });
        }

        await _context.PurchaseOrders.AddAsync(order, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(order);
    }

    public async Task<PurchaseOrderDto> UpdateAsync(Guid id, UpdatePurchaseOrderRequest request, CancellationToken cancellationToken = default)
    {
        var order = await _context.PurchaseOrders.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new NotFoundException("PurchaseOrder", id);

        if (order.Status != OrderStatus.Draft)
            throw new BusinessException("Only draft orders can be updated", "INVALID_STATUS");

        if (request.ExpectedDate.HasValue) order.ExpectedDate = request.ExpectedDate;
        if (request.Remarks != null) order.Remarks = request.Remarks;

        await _context.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("PurchaseOrder", id);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var order = await _context.PurchaseOrders.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new NotFoundException("PurchaseOrder", id);

        if (order.Status != OrderStatus.Draft)
            throw new BusinessException("Only draft orders can be deleted", "INVALID_STATUS");

        order.IsDeleted = true;
        order.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<PurchaseOrderDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var order = await _context.PurchaseOrders
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .Include(o => o.Supplier)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);

        return order == null ? null : MapToDto(order);
    }

    public async Task<PagedResponse<PurchaseOrderDto>> GetPagedAsync(PurchaseOrderQueryParams queryParams, CancellationToken cancellationToken = default)
    {
        var query = _context.PurchaseOrders
            .Include(o => o.Supplier)
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .AsQueryable();

        if (!string.IsNullOrEmpty(queryParams.OrderNo))
            query = query.Where(o => o.OrderNo.Contains(queryParams.OrderNo));

        if (queryParams.SupplierId.HasValue)
            query = query.Where(o => o.SupplierId == queryParams.SupplierId);

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

        return new PagedResponse<PurchaseOrderDto>
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

    public async Task<PurchaseOrderDto> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var order = await _context.PurchaseOrders.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new NotFoundException("PurchaseOrder", id);

        if (order.Status != OrderStatus.Draft && order.Status != OrderStatus.PendingApproval)
            throw new BusinessException("Order cannot be approved in current status", "INVALID_STATUS");

        order.Status = OrderStatus.Approved;
        order.ApprovedBy = userId;
        order.ApprovedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("PurchaseOrder", id);
    }

    public async Task<PurchaseOrderDto> ReceiveAsync(Guid id, ReceivePurchaseOrderRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        await using var dbTransaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var order = await _context.PurchaseOrders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id, cancellationToken)
                ?? throw new NotFoundException("PurchaseOrder", id);

            if (order.Status != OrderStatus.Approved && order.Status != OrderStatus.Processing)
                throw new BusinessException("Order cannot be received in current status", "INVALID_STATUS");

            foreach (var receiveItem in request.Items)
            {
                var orderItem = order.Items.FirstOrDefault(i => i.ProductId == receiveItem.ProductId)
                    ?? throw new NotFoundException($"Product {receiveItem.ProductId} not found in order");

                if (orderItem.ReceivedQuantity + receiveItem.Quantity > orderItem.Quantity)
                    throw new BusinessException($"Received quantity exceeds ordered quantity for product {receiveItem.ProductId}", "QUANTITY_EXCEEDED");

                orderItem.ReceivedQuantity += receiveItem.Quantity;

                var inventory = await _context.Inventories
                    .FirstOrDefaultAsync(i => i.ProductId == receiveItem.ProductId, cancellationToken);

                if (inventory == null)
                {
                    inventory = new Inventory
                    {
                        Id = Guid.NewGuid(),
                        ProductId = receiveItem.ProductId,
                        Quantity = receiveItem.Quantity
                    };
                    await _context.Inventories.AddAsync(inventory, cancellationToken);
                }
                else
                {
                    inventory.Quantity += receiveItem.Quantity;
                    inventory.TotalAmount += receiveItem.Quantity * orderItem.UnitPrice;
                }

                inventory.LastInboundAt = DateTime.UtcNow;

                await _context.InventoryTransactions.AddAsync(new InventoryTransaction
                {
                    Id = Guid.NewGuid(),
                    ProductId = receiveItem.ProductId,
                    TransactionType = "Inbound",
                    Quantity = receiveItem.Quantity,
                    UnitPrice = orderItem.UnitPrice,
                    ReferenceType = "PurchaseOrder",
                    ReferenceId = order.Id,
                    ReferenceNo = order.OrderNo,
                    CreatedBy = userId
                }, cancellationToken);
            }

            var allReceived = order.Items.All(i => i.ReceivedQuantity >= i.Quantity);
            order.Status = allReceived ? OrderStatus.Completed : OrderStatus.Processing;
            if (allReceived) order.ReceivedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            await dbTransaction.CommitAsync(cancellationToken);
            return await GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("PurchaseOrder", id);
        }
        catch
        {
            await dbTransaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<PurchaseOrderDto> CancelAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var order = await _context.PurchaseOrders.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new NotFoundException("PurchaseOrder", id);

        if (order.Status == OrderStatus.Completed)
            throw new BusinessException("Completed orders cannot be cancelled", "INVALID_STATUS");

        order.Status = OrderStatus.Cancelled;
        await _context.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("PurchaseOrder", id);
    }

    private async Task<string> GenerateOrderNoAsync(string prefix, CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 5; attempt++)
        {
            var today = DateTime.UtcNow.ToString("yyyyMMdd");
            var lastOrder = await _context.PurchaseOrders
                .Where(o => o.OrderNo.StartsWith($"{prefix}{today}"))
                .OrderByDescending(o => o.OrderNo)
                .FirstOrDefaultAsync(cancellationToken);

            var sequence = 1;
            if (lastOrder != null && int.TryParse(lastOrder.OrderNo[^4..], out var seq))
                sequence = seq + 1 + attempt;

            var orderNo = $"{prefix}{today}{sequence:D4}";
            if (!await _context.PurchaseOrders.AnyAsync(o => o.OrderNo == orderNo, cancellationToken))
                return orderNo;
        }

        return $"{prefix}{DateTime.UtcNow:yyyyMMddHHmmss}{Random.Shared.Next(1000, 9999)}";
    }

    private static PurchaseOrderDto MapToDto(PurchaseOrder order)
    {
        return new PurchaseOrderDto
        {
            Id = order.Id,
            OrderNo = order.OrderNo,
            SupplierId = order.SupplierId,
            SupplierName = order.Supplier?.Name ?? string.Empty,
            Status = order.Status,
            StatusText = order.Status.ToString(),
            PaymentStatus = order.PaymentStatus,
            PaymentStatusText = order.PaymentStatus.ToString(),
            TotalAmount = order.TotalAmount,
            PaidAmount = order.PaidAmount,
            OrderDate = order.OrderDate,
            ExpectedDate = order.ExpectedDate,
            ReceivedDate = order.ReceivedDate,
            Remarks = order.Remarks,
            Items = order.Items.Select(i => new PurchaseOrderItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product?.Name ?? string.Empty,
                ProductSku = i.Product?.Sku ?? string.Empty,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                Subtotal = i.Quantity * i.UnitPrice,
                ReceivedQuantity = i.ReceivedQuantity
            }).ToList(),
            CreatedAt = order.CreatedAt
        };
    }
}
