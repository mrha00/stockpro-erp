using Microsoft.EntityFrameworkCore;
using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.Suppliers;
using InventorySystem.Application.Interfaces;
using InventorySystem.Domain.Entities;
using InventorySystem.Domain.Exceptions;
using InventorySystem.Infrastructure.Data;

namespace InventorySystem.Infrastructure.Services;

public class SupplierService : ISupplierService
{
    private readonly ApplicationDbContext _context;

    public SupplierService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SupplierDto> CreateAsync(CreateSupplierRequest request, CancellationToken cancellationToken = default)
    {
        if (await _context.Suppliers.AnyAsync(s => s.Code == request.Code, cancellationToken))
            throw new ConflictException("Supplier code already exists");

        var supplier = new Supplier
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Code = request.Code,
            ContactPerson = request.ContactPerson,
            Phone = request.Phone,
            Email = request.Email,
            Address = request.Address,
            BankAccount = request.BankAccount,
            BankName = request.BankName,
            TaxNumber = request.TaxNumber,
            Remarks = request.Remarks
        };

        await _context.Suppliers.AddAsync(supplier, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(supplier);
    }

    public async Task<SupplierDto> UpdateAsync(Guid id, UpdateSupplierRequest request, CancellationToken cancellationToken = default)
    {
        var supplier = await _context.Suppliers.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new NotFoundException("Supplier", id);

        if (!string.IsNullOrEmpty(request.Name)) supplier.Name = request.Name;
        if (!string.IsNullOrEmpty(request.ContactPerson)) supplier.ContactPerson = request.ContactPerson;
        if (!string.IsNullOrEmpty(request.Phone)) supplier.Phone = request.Phone;
        if (!string.IsNullOrEmpty(request.Email)) supplier.Email = request.Email;
        if (!string.IsNullOrEmpty(request.Address)) supplier.Address = request.Address;
        if (!string.IsNullOrEmpty(request.BankAccount)) supplier.BankAccount = request.BankAccount;
        if (!string.IsNullOrEmpty(request.BankName)) supplier.BankName = request.BankName;
        if (!string.IsNullOrEmpty(request.TaxNumber)) supplier.TaxNumber = request.TaxNumber;
        if (request.Remarks != null) supplier.Remarks = request.Remarks;
        if (request.IsActive.HasValue) supplier.IsActive = request.IsActive.Value;

        await _context.SaveChangesAsync(cancellationToken);
        return MapToDto(supplier);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var supplier = await _context.Suppliers.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new NotFoundException("Supplier", id);

        supplier.IsDeleted = true;
        supplier.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<SupplierDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var supplier = await _context.Suppliers.FindAsync(new object[] { id }, cancellationToken);
        return supplier == null ? null : MapToDto(supplier);
    }

    public async Task<PagedResponse<SupplierDto>> GetPagedAsync(SupplierQueryParams queryParams, CancellationToken cancellationToken = default)
    {
        var query = _context.Suppliers.AsQueryable();

        if (!string.IsNullOrEmpty(queryParams.Keyword))
            query = query.Where(s => s.Name.Contains(queryParams.Keyword) || s.Code.Contains(queryParams.Keyword));

        if (queryParams.IsActive.HasValue)
            query = query.Where(s => s.IsActive == queryParams.IsActive);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((queryParams.Page - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResponse<SupplierDto>
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

    private static SupplierDto MapToDto(Supplier supplier)
    {
        return new SupplierDto
        {
            Id = supplier.Id,
            Name = supplier.Name,
            Code = supplier.Code,
            ContactPerson = supplier.ContactPerson,
            Phone = supplier.Phone,
            Email = supplier.Email,
            Address = supplier.Address,
            BankName = supplier.BankName,
            TaxNumber = supplier.TaxNumber,
            Remarks = supplier.Remarks,
            IsActive = supplier.IsActive,
            CreatedAt = supplier.CreatedAt
        };
    }
}
