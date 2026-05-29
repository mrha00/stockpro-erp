using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.Users;
using InventorySystem.Application.DTOs.Auth;

namespace InventorySystem.Application.Interfaces;

/// <summary>
/// 用户服务接口
/// </summary>
public interface IUserService
{
    /// <summary>
    /// 创建用户
    /// </summary>
    Task<UserDto> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新用户
    /// </summary>
    Task<UserDto> UpdateAsync(Guid id, UpdateUserRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 删除用户
    /// </summary>
    Task DeleteAsync(Guid id, Guid? deletedBy = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根据ID获取用户
    /// </summary>
    Task<UserDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 分页查询用户
    /// </summary>
    Task<PagedResponse<UserDto>> GetPagedAsync(UserQueryParams queryParams, CancellationToken cancellationToken = default);
}
