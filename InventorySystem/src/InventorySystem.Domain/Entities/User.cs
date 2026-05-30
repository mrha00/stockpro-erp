using InventorySystem.Domain.Enums;

namespace InventorySystem.Domain.Entities;

/// <summary>
/// 用户实体
/// </summary>
public class User : BaseEntity
{
    /// <summary>
    /// 用户名
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 邮箱
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 密码哈希
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// 真实姓名
    /// </summary>
    public string? RealName { get; set; }

    /// <summary>
    /// 头像 URL（相对路径或外链）
    /// </summary>
    public string? AvatarUrl { get; set; }

    /// <summary>
    /// 手机号（加密存储）
    /// </summary>
    public string? Phone { get; set; }

    /// <summary>
    /// 角色
    /// </summary>
    public UserRole Role { get; set; } = UserRole.Salesman;

    /// <summary>
    /// 是否激活
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// 最后登录时间
    /// </summary>
    public DateTime? LastLoginAt { get; set; }

    /// <summary>
    /// 最后登录IP
    /// </summary>
    public string? LastLoginIp { get; set; }

    /// <summary>
    /// 刷新令牌
    /// </summary>
    public string? RefreshToken { get; set; }

    /// <summary>
    /// 刷新令牌过期时间
    /// </summary>
    public DateTime? RefreshTokenExpiry { get; set; }
}
