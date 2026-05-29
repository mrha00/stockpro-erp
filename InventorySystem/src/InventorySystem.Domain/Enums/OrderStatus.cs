namespace InventorySystem.Domain.Enums;

/// <summary>
/// 订单状态枚举
/// </summary>
public enum OrderStatus
{
    /// <summary>
    /// 草稿
    /// </summary>
    Draft = 0,

    /// <summary>
    /// 待审核
    /// </summary>
    PendingApproval = 1,

    /// <summary>
    /// 已审核
    /// </summary>
    Approved = 2,

    /// <summary>
    /// 执行中
    /// </summary>
    Processing = 3,

    /// <summary>
    /// 已完成
    /// </summary>
    Completed = 4,

    /// <summary>
    /// 已取消
    /// </summary>
    Cancelled = 5
}
