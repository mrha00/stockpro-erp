using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.SalesOrders;

namespace InventorySystem.Application.Interfaces;

public interface ISalesOrderService
{
    Task<SalesOrderDto> CreateAsync(CreateSalesOrderRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<SalesOrderDto> UpdateAsync(Guid id, UpdateSalesOrderRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<SalesOrderDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResponse<SalesOrderDto>> GetPagedAsync(SalesOrderQueryParams queryParams, CancellationToken cancellationToken = default);
    Task<SalesOrderDto> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<SalesOrderDto> ShipAsync(Guid id, ShipSalesOrderRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<SalesOrderDto> CancelAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
}
