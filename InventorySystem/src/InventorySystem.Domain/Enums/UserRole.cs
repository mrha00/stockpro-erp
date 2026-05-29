namespace InventorySystem.Domain.Enums;

/// <summary>
/// 用户角色枚举
/// </summary>
public enum UserRole
{
    /// <summary>
    /// 管理员 - 全部权限
    /// </summary>
    Admin = 0,

    /// <summary>
    /// 采购员 - 采购相关权限
    /// </summary>
    Purchaser = 1,

    /// <summary>
    /// 销售员 - 销售相关权限
    /// </summary>
    Salesman = 2,

    /// <summary>
    /// 仓管员 - 库存相关权限
    /// </summary>
    WarehouseKeeper = 3
}
