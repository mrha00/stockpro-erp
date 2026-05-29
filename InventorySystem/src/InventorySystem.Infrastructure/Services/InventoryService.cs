using Microsoft.EntityFrameworkCore;
using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.Inventories;
using InventorySystem.Application.Interfaces;
using InventorySystem.Domain.Entities;
using InventorySystem.Domain.Exceptions;
using InventorySystem.Infrastructure.Data;

namespace InventorySystem.Infrastructure.Services;

public class InventoryService : IInventoryService
{
    private readonly ApplicationDbContext _context;

    public InventoryService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<InventoryDto?> GetByProductIdAsync(Guid productId, CancellationToken cancellationToken = default)
    {
        var inventory = await _context.Inventories
            .Include(i => i.Product)
            .FirstOrDefaultAsync(i => i.ProductId == productId, cancellationToken);

        if (inventory == null) return null;

        return MapToDto(inventory);
    }

    public async Task<PagedResponse<InventoryDto>> GetPagedAsync(InventoryQueryParams queryParams, CancellationToken cancellationToken = default)
    {
        var query = _context.Inventories
            .Include(i => i.Product)
            .AsQueryable();

        if (!string.IsNullOrEmpty(queryParams.Keyword))
            query = query.Where(i => i.Product.Name.Contains(queryParams.Keyword) || i.Product.Sku.Contains(queryParams.Keyword));

        if (queryParams.LowStock == true)
            query = query.Where(i => i.Quantity <= i.Product.MinStock && i.Product.MinStock > 0);

        if (queryParams.OverStock == true)
            query = query.Where(i => i.Quantity >= i.Product.MaxStock && i.Product.MaxStock > 0);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(i => i.Product.Name)
            .Skip((queryParams.Page - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResponse<InventoryDto>
        {
            Items = items.Select(MapToDto).ToList(),
            Pagination = new PaginationInfo
            {
                Page = queryParams.Page,
                PageSize = queryParams.PageSize,
                Total = total,
                TotalPages = (int)Math.Ceiling(total / (double)queryParams.PageSize)
            }
        };
    }

    public async Task AdjustAsync(AdjustInventoryRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var product = await _context.Products.FindAsync(new object[] { request.ProductId }, cancellationToken)
                ?? throw new NotFoundException("Product", request.ProductId);

            var inventory = await _context.Inventories
                .FirstOrDefaultAsync(i => i.ProductId == request.ProductId, cancellationToken);

            if (inventory == null)
            {
                inventory = new Inventory
                {
                    Id = Guid.NewGuid(),
                    ProductId = request.ProductId,
                    Quantity = 0
                };
                await _context.Inventories.AddAsync(inventory, cancellationToken);
            }

            var transactionType = "Adjust";
            var transactionQty = request.Quantity;

            switch (request.AdjustType)
            {
                case "Freeze":
                    if (inventory.AvailableQuantity < request.Quantity)
                        throw new BusinessException("可用库存不足，无法执行冻结操作", "INSUFFICIENT_AVAILABLE");
                    inventory.FrozenQuantity += request.Quantity;
                    transactionType = "Freeze";
                    break;

                case "Unfreeze":
                    if (inventory.FrozenQuantity < request.Quantity)
                        throw new BusinessException("冻结库存不足，无法执行解冻操作", "INSUFFICIENT_FROZEN");
                    inventory.FrozenQuantity -= request.Quantity;
                    transactionType = "Unfreeze";
                    break;

                case "Inbound":
                    inventory.Quantity += request.Quantity;
                    inventory.LastInboundAt = DateTime.UtcNow;
                    transactionType = "Inbound";
                    break;

                case "Outbound":
                    if (inventory.AvailableQuantity < request.Quantity)
                        throw new BusinessException("可用库存不足，无法执行出库操作", "INSUFFICIENT_AVAILABLE");
                    inventory.Quantity -= request.Quantity;
                    inventory.LastOutboundAt = DateTime.UtcNow;
                    transactionQty = -request.Quantity;
                    transactionType = "Outbound";
                    break;

                default:
                    if (inventory.Quantity + request.Quantity < 0)
                        throw new BusinessException("库存不足以执行此调整", "INSUFFICIENT_STOCK");
                    inventory.Quantity += request.Quantity;
                    break;
            }

            await _context.InventoryTransactions.AddAsync(new InventoryTransaction
            {
                Id = Guid.NewGuid(),
                ProductId = request.ProductId,
                TransactionType = transactionType,
                Quantity = transactionQty,
                UnitPrice = product.CostPrice,
                Remarks = request.Reason,
                CreatedBy = userId
            }, cancellationToken);

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<PagedResponse<InventoryTransactionDto>> GetTransactionsAsync(InventoryTransactionQueryParams queryParams, CancellationToken cancellationToken = default)
    {
        var query = _context.InventoryTransactions
            .Include(t => t.Product)
            .AsQueryable();

        if (queryParams.ProductId.HasValue)
            query = query.Where(t => t.ProductId == queryParams.ProductId);

        if (!string.IsNullOrEmpty(queryParams.TransactionType))
            query = query.Where(t => t.TransactionType == queryParams.TransactionType);

        if (queryParams.StartDate.HasValue)
            query = query.Where(t => t.CreatedAt >= queryParams.StartDate);

        if (queryParams.EndDate.HasValue)
            query = query.Where(t => t.CreatedAt <= queryParams.EndDate);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((queryParams.Page - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResponse<InventoryTransactionDto>
        {
            Items = items.Select(t => new InventoryTransactionDto
            {
                Id = t.Id,
                ProductId = t.ProductId,
                ProductName = t.Product?.Name ?? string.Empty,
                TransactionType = t.TransactionType,
                Quantity = t.Quantity,
                UnitPrice = t.UnitPrice,
                ReferenceType = t.ReferenceType,
                ReferenceNo = t.ReferenceNo,
                Remarks = t.Remarks,
                CreatedAt = t.CreatedAt
            }).ToList(),
            Pagination = new PaginationInfo
            {
                Page = queryParams.Page,
                PageSize = queryParams.PageSize,
                Total = total,
                TotalPages = (int)Math.Ceiling(total / (double)queryParams.PageSize)
            }
        };
    }

    private static InventoryDto MapToDto(Inventory inventory)
    {
        return new InventoryDto
        {
            Id = inventory.Id,
            ProductId = inventory.ProductId,
            ProductName = inventory.Product?.Name ?? string.Empty,
            ProductSku = inventory.Product?.Sku ?? string.Empty,
            Quantity = inventory.Quantity,
            FrozenQuantity = inventory.FrozenQuantity,
            AvailableQuantity = inventory.AvailableQuantity,
            TotalAmount = inventory.TotalAmount,
            AverageCost = inventory.AverageCost,
            LastInboundAt = inventory.LastInboundAt,
            LastOutboundAt = inventory.LastOutboundAt,
            Location = inventory.Location
        };
    }
}
