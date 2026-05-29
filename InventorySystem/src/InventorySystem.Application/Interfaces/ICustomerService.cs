using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.Customers;

namespace InventorySystem.Application.Interfaces;

public interface ICustomerService
{
    Task<CustomerDto> CreateAsync(CreateCustomerRequest request, CancellationToken cancellationToken = default);
    Task<CustomerDto> UpdateAsync(Guid id, UpdateCustomerRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<CustomerDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResponse<CustomerDto>> GetPagedAsync(CustomerQueryParams queryParams, CancellationToken cancellationToken = default);
}
