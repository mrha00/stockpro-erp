using System.Net;
using System.Text.Json;
using InventorySystem.Application.Common;
using InventorySystem.Domain.Exceptions;
using Serilog;

namespace InventorySystem.Api.Middleware;

/// <summary>
/// 全局异常处理中间件
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;

    public ExceptionHandlingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = context.Response;
        response.ContentType = "application/json";

        var apiResponse = exception switch
        {
            ValidationException ex => new ApiResponse
            {
                Code = 400,
                Message = ex.Message,
                ErrorCode = ex.ErrorCode,
                Errors = ex.Errors
            },
            NotFoundException ex => new ApiResponse
            {
                Code = 404,
                Message = ex.Message,
                ErrorCode = ex.ErrorCode
            },
            ConflictException ex => new ApiResponse
            {
                Code = 409,
                Message = ex.Message,
                ErrorCode = ex.ErrorCode
            },
            UnauthorizedException ex => new ApiResponse
            {
                Code = 401,
                Message = ex.Message,
                ErrorCode = ex.ErrorCode
            },
            ForbiddenException ex => new ApiResponse
            {
                Code = 403,
                Message = ex.Message,
                ErrorCode = ex.ErrorCode
            },
            BusinessException ex => new ApiResponse
            {
                Code = ex.StatusCode,
                Message = ex.Message,
                ErrorCode = ex.ErrorCode
            },
            _ => new ApiResponse
            {
                Code = 500,
                Message = "Internal server error",
                ErrorCode = "INTERNAL_ERROR"
            }
        };

        response.StatusCode = apiResponse.Code;

        if (apiResponse.Code >= 500)
        {
            Log.Error(exception, "Unhandled exception occurred: {Message}", exception.Message);
        }

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        await response.WriteAsync(JsonSerializer.Serialize(apiResponse, options));
    }
}
