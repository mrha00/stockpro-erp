using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.Categories;

namespace InventorySystem.Application.Interfaces;

public interface ICategoryService
{
    Task<CategoryDto> CreateAsync(CreateCategoryRequest request, CancellationToken cancellationToken = default);
    Task<CategoryDto> UpdateAsync(Guid id, UpdateCategoryRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<CategoryDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<CategoryDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<PagedResponse<CategoryDto>> GetPagedAsync(CategoryQueryParams queryParams, CancellationToken cancellationToken = default);
}
