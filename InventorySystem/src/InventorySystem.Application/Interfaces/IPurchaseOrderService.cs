using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.PurchaseOrders;

namespace InventorySystem.Application.Interfaces;

public interface IPurchaseOrderService
{
    Task<PurchaseOrderDto> CreateAsync(CreatePurchaseOrderRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<PurchaseOrderDto> UpdateAsync(Guid id, UpdatePurchaseOrderRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PurchaseOrderDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResponse<PurchaseOrderDto>> GetPagedAsync(PurchaseOrderQueryParams queryParams, CancellationToken cancellationToken = default);
    Task<PurchaseOrderDto> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<PurchaseOrderDto> ReceiveAsync(Guid id, ReceivePurchaseOrderRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<PurchaseOrderDto> CancelAsync(Guid id, CancellationToken cancellationToken = default);
}
