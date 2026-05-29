using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.Inventories;

namespace InventorySystem.Application.Interfaces;

public interface IInventoryService
{
    Task<InventoryDto?> GetByProductIdAsync(Guid productId, CancellationToken cancellationToken = default);
    Task<PagedResponse<InventoryDto>> GetPagedAsync(InventoryQueryParams queryParams, CancellationToken cancellationToken = default);
    Task AdjustAsync(AdjustInventoryRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<PagedResponse<InventoryTransactionDto>> GetTransactionsAsync(InventoryTransactionQueryParams queryParams, CancellationToken cancellationToken = default);
}
