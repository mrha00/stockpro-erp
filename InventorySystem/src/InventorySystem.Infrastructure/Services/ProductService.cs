using Microsoft.EntityFrameworkCore;
using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.Products;
using InventorySystem.Application.Interfaces;
using InventorySystem.Domain.Entities;
using InventorySystem.Domain.Exceptions;
using InventorySystem.Infrastructure.Data;

namespace InventorySystem.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly ApplicationDbContext _context;

    public ProductService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProductDto> CreateAsync(CreateProductRequest request, CancellationToken cancellationToken = default)
    {
        if (await _context.Products.AnyAsync(p => p.Sku == request.Sku, cancellationToken))
            throw new ConflictException("Product SKU already exists");

        var category = await _context.Categories.FindAsync(new object[] { request.CategoryId }, cancellationToken)
            ?? throw new NotFoundException("Category not found");

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Sku = request.Sku,
            Barcode = request.Barcode,
            CategoryId = request.CategoryId,
            Specification = request.Specification,
            Unit = request.Unit,
            CostPrice = request.CostPrice,
            SalePrice = request.SalePrice,
            MinStock = request.MinStock,
            MaxStock = request.MaxStock,
            Description = request.Description,
            ImageUrl = request.ImageUrl
        };

        await _context.Products.AddAsync(product, cancellationToken);

        var inventory = new Inventory
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Quantity = 0
        };
        await _context.Inventories.AddAsync(inventory, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(product, category.Name, 0);
    }

    public async Task<ProductDto> UpdateAsync(Guid id, UpdateProductRequest request, CancellationToken cancellationToken = default)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            ?? throw new NotFoundException("Product", id);

        if (request.CategoryId.HasValue)
        {
            var category = await _context.Categories.FindAsync(new object[] { request.CategoryId.Value }, cancellationToken);
            if (category == null)
                throw new NotFoundException("Category not found");
            product.CategoryId = request.CategoryId.Value;
        }

        if (!string.IsNullOrEmpty(request.Name)) product.Name = request.Name;
        if (!string.IsNullOrEmpty(request.Barcode)) product.Barcode = request.Barcode;
        if (!string.IsNullOrEmpty(request.Specification)) product.Specification = request.Specification;
        if (!string.IsNullOrEmpty(request.Unit)) product.Unit = request.Unit;
        if (request.CostPrice.HasValue) product.CostPrice = request.CostPrice.Value;
        if (request.SalePrice.HasValue) product.SalePrice = request.SalePrice.Value;
        if (request.MinStock.HasValue) product.MinStock = request.MinStock.Value;
        if (request.MaxStock.HasValue) product.MaxStock = request.MaxStock.Value;
        if (request.Description != null) product.Description = request.Description;
        if (request.ImageUrl != null) product.ImageUrl = request.ImageUrl;
        if (request.IsActive.HasValue) product.IsActive = request.IsActive.Value;

        await _context.SaveChangesAsync(cancellationToken);

        var inventory = await _context.Inventories.FirstOrDefaultAsync(i => i.ProductId == id, cancellationToken);
        return MapToDto(product, product.Category.Name, inventory?.Quantity ?? 0, inventory);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var product = await _context.Products.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new NotFoundException("Product", id);

        product.IsDeleted = true;
        product.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<ProductDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (product == null) return null;

        var inventory = await _context.Inventories.FirstOrDefaultAsync(i => i.ProductId == id, cancellationToken);
        return MapToDto(product, product.Category.Name, inventory?.Quantity ?? 0, inventory);
    }

    public async Task<PagedResponse<ProductDto>> GetPagedAsync(ProductQueryParams queryParams, CancellationToken cancellationToken = default)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Inventory)
            .AsQueryable();

        if (!string.IsNullOrEmpty(queryParams.Keyword))
            query = query.Where(p => p.Name.Contains(queryParams.Keyword) || p.Sku.Contains(queryParams.Keyword));

        if (queryParams.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == queryParams.CategoryId);

        if (queryParams.IsActive.HasValue)
            query = query.Where(p => p.IsActive == queryParams.IsActive);

        if (queryParams.MinPrice.HasValue)
            query = query.Where(p => p.SalePrice >= queryParams.MinPrice);

        if (queryParams.MaxPrice.HasValue)
            query = query.Where(p => p.SalePrice <= queryParams.MaxPrice);

        if (queryParams.LowStock == true)
            query = query.Where(p => p.Inventory != null && p.MinStock > 0 && p.Inventory.Quantity <= p.MinStock);

        var total = await query.CountAsync(cancellationToken);
        var products = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((queryParams.Page - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .ToListAsync(cancellationToken);

        var items = products.Select(p => MapToDto(p, p.Category.Name, p.Inventory?.Quantity ?? 0, p.Inventory)).ToList();

        return new PagedResponse<ProductDto>
        {
            Items = items,
            Pagination = new PaginationInfo
            {
                Page = queryParams.Page,
                PageSize = queryParams.PageSize,
                Total = total,
                TotalPages = (int)Math.Ceiling(total / (double)queryParams.PageSize)
            }
        };
    }

    private static ProductDto MapToDto(Product product, string categoryName, int stockQuantity, Inventory? inventory = null)
    {
        var frozen = inventory?.FrozenQuantity ?? 0;
        return new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            Sku = product.Sku,
            Barcode = product.Barcode,
            CategoryId = product.CategoryId,
            CategoryName = categoryName,
            Specification = product.Specification,
            Unit = product.Unit,
            CostPrice = product.CostPrice,
            SalePrice = product.SalePrice,
            MinStock = product.MinStock,
            MaxStock = product.MaxStock,
            Description = product.Description,
            ImageUrl = product.ImageUrl,
            IsActive = product.IsActive,
            StockQuantity = stockQuantity,
            FrozenQuantity = frozen,
            AvailableQuantity = stockQuantity - frozen,
            CreatedAt = product.CreatedAt
        };
    }
}
