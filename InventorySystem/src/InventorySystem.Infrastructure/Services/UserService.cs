using AutoMapper;
using Microsoft.EntityFrameworkCore;
using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.Auth;
using InventorySystem.Application.DTOs.Users;
using InventorySystem.Application.Interfaces;
using InventorySystem.Domain.Entities;
using InventorySystem.Domain.Exceptions;
using InventorySystem.Infrastructure.Data;

namespace InventorySystem.Infrastructure.Services;

/// <summary>
/// 用户服务实现
/// </summary>
public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public UserService(ApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    public async Task<UserDto> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        // 检查用户名唯一性
        if (await _context.Users.AnyAsync(u => u.Username == request.Username, cancellationToken))
            throw new ConflictException("Username already exists");

        // 检查邮箱唯一性
        if (await _context.Users.AnyAsync(u => u.Email == request.Email, cancellationToken))
            throw new ConflictException("Email already exists");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            RealName = request.RealName,
            Phone = request.Phone,
            Role = request.Role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.Users.AddAsync(user, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogActionAsync(
            user.Id, user.Username, "CreateUser",
            "User", user.Id,
            newValues: System.Text.Json.JsonSerializer.Serialize(request),
            cancellationToken: cancellationToken);

        return MapToDto(user);
    }

    public async Task<UserDto> UpdateAsync(Guid id, UpdateUserRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new NotFoundException("User", id);

        var oldValues = System.Text.Json.JsonSerializer.Serialize(user);

        if (!string.IsNullOrEmpty(request.Email) && request.Email != user.Email)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email && u.Id != id, cancellationToken))
                throw new ConflictException("Email already exists");
            user.Email = request.Email;
        }

        if (!string.IsNullOrEmpty(request.RealName))
            user.RealName = request.RealName;

        if (!string.IsNullOrEmpty(request.Phone))
            user.Phone = request.Phone;

        if (request.Role.HasValue)
            user.Role = request.Role.Value;

        if (request.IsActive.HasValue)
            user.IsActive = request.IsActive.Value;

        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogActionAsync(
            user.Id, user.Username, "UpdateUser",
            "User", user.Id,
            oldValues: oldValues,
            newValues: System.Text.Json.JsonSerializer.Serialize(user),
            cancellationToken: cancellationToken);

        return MapToDto(user);
    }

    public async Task DeleteAsync(Guid id, Guid? deletedBy = null, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new NotFoundException("User", id);

        user.IsDeleted = true;
        user.DeletedAt = DateTime.UtcNow;
        user.DeletedBy = deletedBy;

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogActionAsync(
            deletedBy, null, "DeleteUser",
            "User", user.Id,
            oldValues: System.Text.Json.JsonSerializer.Serialize(user),
            cancellationToken: cancellationToken);
    }

    public async Task<UserDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FindAsync(new object[] { id }, cancellationToken);
        return user == null ? null : MapToDto(user);
    }

    public async Task<PagedResponse<UserDto>> GetPagedAsync(UserQueryParams queryParams, CancellationToken cancellationToken = default)
    {
        var query = _context.Users.AsQueryable();

        if (!string.IsNullOrEmpty(queryParams.Keyword))
        {
            query = query.Where(u =>
                u.Username.Contains(queryParams.Keyword) ||
                u.Email.Contains(queryParams.Keyword) ||
                (u.RealName != null && u.RealName.Contains(queryParams.Keyword)));
        }

        if (queryParams.Role.HasValue)
            query = query.Where(u => u.Role == queryParams.Role.Value);

        if (queryParams.IsActive.HasValue)
            query = query.Where(u => u.IsActive == queryParams.IsActive.Value);

        var total = await query.CountAsync(cancellationToken);

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((queryParams.Page - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResponse<UserDto>
        {
            Items = users.Select(MapToDto).ToList(),
            Pagination = new PaginationInfo
            {
                Page = queryParams.Page,
                PageSize = queryParams.PageSize,
                Total = total,
                TotalPages = (int)Math.Ceiling(total / (double)queryParams.PageSize)
            }
        };
    }

    private static UserDto MapToDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            RealName = user.RealName,
            AvatarUrl = user.AvatarUrl,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };
    }
}
