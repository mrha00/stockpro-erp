using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.Products;

namespace InventorySystem.Application.Interfaces;

public interface IProductService
{
    Task<ProductDto> CreateAsync(CreateProductRequest request, CancellationToken cancellationToken = default);
    Task<ProductDto> UpdateAsync(Guid id, UpdateProductRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ProductDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResponse<ProductDto>> GetPagedAsync(ProductQueryParams queryParams, CancellationToken cancellationToken = default);
}
