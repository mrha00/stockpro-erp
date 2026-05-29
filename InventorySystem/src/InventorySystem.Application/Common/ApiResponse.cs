namespace InventorySystem.Application.Common;

/// <summary>
/// 统一API响应格式
/// </summary>
public class ApiResponse<T>
{
    /// <summary>
    /// 状态码
    /// </summary>
    public int Code { get; set; }

    /// <summary>
    /// 消息
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// 数据
    /// </summary>
    public T? Data { get; set; }

    /// <summary>
    /// 是否成功
    /// </summary>
    public bool Success => Code >= 200 && Code < 300;

    /// <summary>
    /// 业务错误码
    /// </summary>
    public string? ErrorCode { get; set; }

    /// <summary>
    /// 字段级验证错误
    /// </summary>
    public IDictionary<string, string[]>? Errors { get; set; }

    public static ApiResponse<T> SuccessResult(T data, string message = "success")
    {
        return new ApiResponse<T>
        {
            Code = 200,
            Message = message,
            Data = data
        };
    }

    public static ApiResponse<T> CreatedResult(T data, string message = "Created successfully")
    {
        return new ApiResponse<T>
        {
            Code = 201,
            Message = message,
            Data = data
        };
    }

    public static ApiResponse<T> ErrorResult(int code, string message)
    {
        return new ApiResponse<T>
        {
            Code = code,
            Message = message,
            Data = default
        };
    }
}

/// <summary>
/// 分页响应
/// </summary>
public class PagedResponse<T>
{
    /// <summary>
    /// 数据列表
    /// </summary>
    public IReadOnlyList<T> Items { get; set; } = Array.Empty<T>();

    /// <summary>
    /// 分页信息
    /// </summary>
    public PaginationInfo Pagination { get; set; } = new();
}

/// <summary>
/// 分页信息
/// </summary>
public class PaginationInfo
{
    /// <summary>
    /// 当前页
    /// </summary>
    public int Page { get; set; }

    /// <summary>
    /// 每页大小
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// 总数
    /// </summary>
    public int Total { get; set; }

    /// <summary>
    /// 总页数
    /// </summary>
    public int TotalPages { get; set; }
}

/// <summary>
/// 无数据响应
/// </summary>
public class ApiResponse : ApiResponse<object>
{
    public static ApiResponse SuccessResult(string message = "success")
    {
        return new ApiResponse
        {
            Code = 200,
            Message = message
        };
    }

    public new static ApiResponse ErrorResult(int code, string message)
    {
        return new ApiResponse
        {
            Code = code,
            Message = message
        };
    }
}
