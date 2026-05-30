using InventorySystem.Application.DTOs.Auth;

namespace InventorySystem.Application.Interfaces;

/// <summary>
/// 认证服务接口
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// 用户登录
    /// </summary>
    Task<LoginResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刷新令牌
    /// </summary>
    Task<LoginResponse> RefreshTokenAsync(string refreshToken, string? ipAddress, CancellationToken cancellationToken = default);

    /// <summary>
    /// 撤销令牌
    /// </summary>
    Task RevokeTokenAsync(string refreshToken, CancellationToken cancellationToken = default);

    /// <summary>
    /// 修改密码
    /// </summary>
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken cancellationToken = default);

    Task<UserDto> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<UserDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken = default);

    Task<UserDto> UpdateAvatarAsync(Guid userId, string avatarUrl, CancellationToken cancellationToken = default);

    /// <summary>
    /// 验证令牌有效性
    /// </summary>
    Task<bool> ValidateTokenAsync(string token, CancellationToken cancellationToken = default);
}
