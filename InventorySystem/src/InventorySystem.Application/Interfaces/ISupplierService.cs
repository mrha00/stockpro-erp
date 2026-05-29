using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.Suppliers;

namespace InventorySystem.Application.Interfaces;

public interface ISupplierService
{
    Task<SupplierDto> CreateAsync(CreateSupplierRequest request, CancellationToken cancellationToken = default);
    Task<SupplierDto> UpdateAsync(Guid id, UpdateSupplierRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<SupplierDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResponse<SupplierDto>> GetPagedAsync(SupplierQueryParams queryParams, CancellationToken cancellationToken = default);
}
