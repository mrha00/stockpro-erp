using System.Diagnostics;
using System.Security.Claims;
using InventorySystem.Application.Interfaces;
using Serilog;

namespace InventorySystem.Api.Middleware;

/// <summary>
/// 审计日志中间件
/// </summary>
public class AuditLogMiddleware
{
    private readonly RequestDelegate _next;

    public AuditLogMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IAuditService auditService)
    {
        // 只记录写操作
        if (context.Request.Method is "POST" or "PUT" or "PATCH" or "DELETE")
        {
            var stopwatch = Stopwatch.StartNew();
            var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = context.User.FindFirst(ClaimTypes.Name)?.Value;

            try
            {
                await _next(context);
                stopwatch.Stop();

                await auditService.LogActionAsync(
                    userId != null ? Guid.Parse(userId) : null,
                    username,
                    context.Request.Method,
                    requestPath: context.Request.Path,
                    requestMethod: context.Request.Method,
                    ipAddress: context.Connection.RemoteIpAddress?.ToString(),
                    userAgent: context.Request.Headers.UserAgent.ToString(),
                    isSuccess: context.Response.StatusCode < 400,
                    duration: stopwatch.ElapsedMilliseconds);
            }
            catch (Exception)
            {
                stopwatch.Stop();

                await auditService.LogActionAsync(
                    userId != null ? Guid.Parse(userId) : null,
                    username,
                    context.Request.Method,
                    requestPath: context.Request.Path,
                    requestMethod: context.Request.Method,
                    ipAddress: context.Connection.RemoteIpAddress?.ToString(),
                    userAgent: context.Request.Headers.UserAgent.ToString(),
                    isSuccess: false,
                    duration: stopwatch.ElapsedMilliseconds);

                throw;
            }
        }
        else
        {
            await _next(context);
        }
    }
}
