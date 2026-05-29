using Microsoft.EntityFrameworkCore;
using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.Categories;
using InventorySystem.Application.Interfaces;
using InventorySystem.Domain.Entities;
using InventorySystem.Domain.Exceptions;
using InventorySystem.Infrastructure.Data;

namespace InventorySystem.Infrastructure.Services;

public class CategoryService : ICategoryService
{
    private readonly ApplicationDbContext _context;

    public CategoryService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryRequest request, CancellationToken cancellationToken = default)
    {
        if (await _context.Categories.AnyAsync(c => c.Code == request.Code, cancellationToken))
            throw new ConflictException("Category code already exists");

        if (request.ParentId.HasValue)
        {
            var parent = await _context.Categories.FindAsync(new object[] { request.ParentId.Value }, cancellationToken);
            if (parent == null)
                throw new NotFoundException("Parent category not found");
        }

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Code = request.Code,
            ParentId = request.ParentId,
            SortOrder = request.SortOrder,
            Description = request.Description
        };

        await _context.Categories.AddAsync(category, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(category);
    }

    public async Task<CategoryDto> UpdateAsync(Guid id, UpdateCategoryRequest request, CancellationToken cancellationToken = default)
    {
        var category = await _context.Categories.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new NotFoundException("Category", id);

        if (!string.IsNullOrEmpty(request.Code) && request.Code != category.Code)
        {
            if (await _context.Categories.AnyAsync(c => c.Code == request.Code && c.Id != id, cancellationToken))
                throw new ConflictException("Category code already exists");
            category.Code = request.Code;
        }

        if (!string.IsNullOrEmpty(request.Name)) category.Name = request.Name;
        if (request.ParentId.HasValue) category.ParentId = request.ParentId;
        if (request.SortOrder.HasValue) category.SortOrder = request.SortOrder.Value;
        if (request.Description != null) category.Description = request.Description;

        await _context.SaveChangesAsync(cancellationToken);
        return MapToDto(category);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var category = await _context.Categories
            .Include(c => c.Children)
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            ?? throw new NotFoundException("Category", id);

        if (category.Children.Any())
            throw new BusinessException("Cannot delete category with subcategories", "HAS_CHILDREN");

        if (category.Products.Any())
            throw new BusinessException("Cannot delete category with products", "HAS_PRODUCTS");

        category.IsDeleted = true;
        category.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<CategoryDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var category = await _context.Categories
            .Include(c => c.Parent)
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        return category == null ? null : MapToDto(category);
    }

    public async Task<List<CategoryDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var categories = await _context.Categories
            .Include(c => c.Parent)
            .Include(c => c.Products)
            .OrderBy(c => c.SortOrder)
            .ToListAsync(cancellationToken);

        return categories.Select(MapToDto).ToList();
    }

    public async Task<PagedResponse<CategoryDto>> GetPagedAsync(CategoryQueryParams queryParams, CancellationToken cancellationToken = default)
    {
        var query = _context.Categories
            .Include(c => c.Parent)
            .Include(c => c.Products)
            .AsQueryable();

        if (!string.IsNullOrEmpty(queryParams.Keyword))
            query = query.Where(c => c.Name.Contains(queryParams.Keyword) || c.Code.Contains(queryParams.Keyword));

        if (queryParams.ParentId.HasValue)
            query = query.Where(c => c.ParentId == queryParams.ParentId);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(c => c.SortOrder)
            .Skip((queryParams.Page - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResponse<CategoryDto>
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

    private static CategoryDto MapToDto(Category category)
    {
        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Code = category.Code,
            ParentId = category.ParentId,
            ParentName = category.Parent?.Name,
            SortOrder = category.SortOrder,
            Description = category.Description,
            ProductCount = category.Products?.Count ?? 0
        };
    }
}
