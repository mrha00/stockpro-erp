namespace InventorySystem.Domain.Enums;

/// <summary>
/// 付款状态枚举
/// </summary>
public enum PaymentStatus
{
    /// <summary>
    /// 未付款
    /// </summary>
    Unpaid = 0,

    /// <summary>
    /// 部分付款
    /// </summary>
    PartialPaid = 1,

    /// <summary>
    /// 已付款
    /// </summary>
    Paid = 2,

    /// <summary>
    /// 已退款
    /// </summary>
    Refunded = 3
}
