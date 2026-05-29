namespace InventorySystem.Domain.Entities;

/// <summary>
/// 审计日志实体
/// </summary>
public class AuditLog
{
    /// <summary>
    /// 主键ID
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// 用户ID
    /// </summary>
    public Guid? UserId { get; set; }

    /// <summary>
    /// 用户名
    /// </summary>
    public string? Username { get; set; }

    /// <summary>
    /// 操作类型：Create/Update/Delete/Login/Logout等
    /// </summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// 实体类型
    /// </summary>
    public string? EntityType { get; set; }

    /// <summary>
    /// 实体ID
    /// </summary>
    public Guid? EntityId { get; set; }

    /// <summary>
    /// 旧值（JSON）
    /// </summary>
    public string? OldValues { get; set; }

    /// <summary>
    /// 新值（JSON）
    /// </summary>
    public string? NewValues { get; set; }

    /// <summary>
    /// IP地址
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// UserAgent
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// 请求路径
    /// </summary>
    public string? RequestPath { get; set; }

    /// <summary>
    /// 请求方法
    /// </summary>
    public string? RequestMethod { get; set; }

    /// <summary>
    /// 操作时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 是否成功
    /// </summary>
    public bool IsSuccess { get; set; } = true;

    /// <summary>
    /// 错误信息
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// 执行时长（毫秒）
    /// </summary>
    public long Duration { get; set; }
}
