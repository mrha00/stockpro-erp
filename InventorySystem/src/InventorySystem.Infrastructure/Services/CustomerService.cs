using Microsoft.EntityFrameworkCore;
using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.Customers;
using InventorySystem.Application.Interfaces;
using InventorySystem.Domain.Entities;
using InventorySystem.Domain.Exceptions;
using InventorySystem.Infrastructure.Data;

namespace InventorySystem.Infrastructure.Services;

public class CustomerService : ICustomerService
{
    private readonly ApplicationDbContext _context;

    public CustomerService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CustomerDto> CreateAsync(CreateCustomerRequest request, CancellationToken cancellationToken = default)
    {
        if (await _context.Customers.AnyAsync(c => c.Code == request.Code, cancellationToken))
            throw new ConflictException("Customer code already exists");

        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Code = request.Code,
            ContactPerson = request.ContactPerson,
            Phone = request.Phone,
            Email = request.Email,
            Address = request.Address,
            CustomerType = request.CustomerType,
            CreditLimit = request.CreditLimit,
            Remarks = request.Remarks
        };

        await _context.Customers.AddAsync(customer, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(customer);
    }

    public async Task<CustomerDto> UpdateAsync(Guid id, UpdateCustomerRequest request, CancellationToken cancellationToken = default)
    {
        var customer = await _context.Customers.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new NotFoundException("Customer", id);

        if (!string.IsNullOrEmpty(request.Name)) customer.Name = request.Name;
        if (!string.IsNullOrEmpty(request.ContactPerson)) customer.ContactPerson = request.ContactPerson;
        if (!string.IsNullOrEmpty(request.Phone)) customer.Phone = request.Phone;
        if (!string.IsNullOrEmpty(request.Email)) customer.Email = request.Email;
        if (!string.IsNullOrEmpty(request.Address)) customer.Address = request.Address;
        if (!string.IsNullOrEmpty(request.CustomerType)) customer.CustomerType = request.CustomerType;
        if (request.CreditLimit.HasValue) customer.CreditLimit = request.CreditLimit.Value;
        if (request.Remarks != null) customer.Remarks = request.Remarks;
        if (request.IsActive.HasValue) customer.IsActive = request.IsActive.Value;

        await _context.SaveChangesAsync(cancellationToken);
        return MapToDto(customer);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var customer = await _context.Customers.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new NotFoundException("Customer", id);

        customer.IsDeleted = true;
        customer.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<CustomerDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var customer = await _context.Customers.FindAsync(new object[] { id }, cancellationToken);
        return customer == null ? null : MapToDto(customer);
    }

    public async Task<PagedResponse<CustomerDto>> GetPagedAsync(CustomerQueryParams queryParams, CancellationToken cancellationToken = default)
    {
        var query = _context.Customers.AsQueryable();

        if (!string.IsNullOrEmpty(queryParams.Keyword))
            query = query.Where(c => c.Name.Contains(queryParams.Keyword) || c.Code.Contains(queryParams.Keyword));

        if (!string.IsNullOrEmpty(queryParams.CustomerType))
            query = query.Where(c => c.CustomerType == queryParams.CustomerType);

        if (queryParams.IsActive.HasValue)
            query = query.Where(c => c.IsActive == queryParams.IsActive);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((queryParams.Page - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResponse<CustomerDto>
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

    private static CustomerDto MapToDto(Customer customer)
    {
        return new CustomerDto
        {
            Id = customer.Id,
            Name = customer.Name,
            Code = customer.Code,
            ContactPerson = customer.ContactPerson,
            Phone = customer.Phone,
            Email = customer.Email,
            Address = customer.Address,
            CustomerType = customer.CustomerType,
            CreditLimit = customer.CreditLimit,
            Remarks = customer.Remarks,
            IsActive = customer.IsActive,
            CreatedAt = customer.CreatedAt
        };
    }
}
