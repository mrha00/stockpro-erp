namespace InventorySystem.Domain.Exceptions;

/// <summary>
/// 业务异常基类
/// </summary>
public class BusinessException : Exception
{
    /// <summary>
    /// 错误码
    /// </summary>
    public string ErrorCode { get; }

    /// <summary>
    /// HTTP状态码
    /// </summary>
    public int StatusCode { get; }

    public BusinessException(string message, string errorCode = "BUSINESS_ERROR", int statusCode = 400)
        : base(message)
    {
        ErrorCode = errorCode;
        StatusCode = statusCode;
    }
}

/// <summary>
/// 资源不存在异常
/// </summary>
public class NotFoundException : BusinessException
{
    public NotFoundException(string message)
        : base(message, "NOT_FOUND", 404)
    {
    }

    public NotFoundException(string entityName, object id)
        : base($"{entityName} with id '{id}' was not found.", "NOT_FOUND", 404)
    {
    }
}

/// <summary>
/// 冲突异常（如重复数据）
/// </summary>
public class ConflictException : BusinessException
{
    public ConflictException(string message)
        : base(message, "CONFLICT", 409)
    {
    }
}

/// <summary>
/// 验证异常
/// </summary>
public class ValidationException : BusinessException
{
    /// <summary>
    /// 验证错误列表
    /// </summary>
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException(IDictionary<string, string[]> errors)
        : base("Validation failed.", "VALIDATION_ERROR", 400)
    {
        Errors = errors;
    }

    public ValidationException(string field, string message)
        : base(message, "VALIDATION_ERROR", 400)
    {
        Errors = new Dictionary<string, string[]>
        {
            { field, new[] { message } }
        };
    }
}

/// <summary>
/// 未授权异常
/// </summary>
public class UnauthorizedException : BusinessException
{
    public UnauthorizedException(string message = "Unauthorized")
        : base(message, "UNAUTHORIZED", 401)
    {
    }
}

/// <summary>
/// 禁止访问异常
/// </summary>
public class ForbiddenException : BusinessException
{
    public ForbiddenException(string message = "Forbidden")
        : base(message, "FORBIDDEN", 403)
    {
    }
}

/// <summary>
/// 库存不足异常
/// </summary>
public class InsufficientStockException : BusinessException
{
    public InsufficientStockException(string productName, int available, int requested)
        : base($"Insufficient stock for '{productName}'. Available: {available}, Requested: {requested}",
            "INSUFFICIENT_STOCK", 400)
    {
    }
}
