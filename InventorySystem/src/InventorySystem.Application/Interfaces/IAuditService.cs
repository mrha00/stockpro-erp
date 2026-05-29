using InventorySystem.Domain.Entities;

namespace InventorySystem.Application.Interfaces;

/// <summary>
/// 审计日志服务接口
/// </summary>
public interface IAuditService
{
    /// <summary>
    /// 记录审计日志
    /// </summary>
    Task LogAsync(AuditLog log, CancellationToken cancellationToken = default);

    /// <summary>
    /// 记录操作日志
    /// </summary>
    Task LogActionAsync(
        Guid? userId,
        string? username,
        string action,
        string? entityType = null,
        Guid? entityId = null,
        string? oldValues = null,
        string? newValues = null,
        string? ipAddress = null,
        string? userAgent = null,
        string? requestPath = null,
        string? requestMethod = null,
        bool isSuccess = true,
        string? errorMessage = null,
        long duration = 0,
        CancellationToken cancellationToken = default);
}
