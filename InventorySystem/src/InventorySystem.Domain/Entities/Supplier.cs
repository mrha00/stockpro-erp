namespace InventorySystem.Domain.Entities;

/// <summary>
/// 供应商实体
/// </summary>
public class Supplier : BaseEntity
{
    /// <summary>
    /// 供应商名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 供应商编码
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// 联系人
    /// </summary>
    public string? ContactPerson { get; set; }

    /// <summary>
    /// 联系电话（加密存储）
    /// </summary>
    public string? Phone { get; set; }

    /// <summary>
    /// 邮箱
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// 地址
    /// </summary>
    public string? Address { get; set; }

    /// <summary>
    /// 银行账号（加密存储）
    /// </summary>
    public string? BankAccount { get; set; }

    /// <summary>
    /// 开户行
    /// </summary>
    public string? BankName { get; set; }

    /// <summary>
    /// 税号
    /// </summary>
    public string? TaxNumber { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remarks { get; set; }

    /// <summary>
    /// 是否激活
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// 采购单
    /// </summary>
    public ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();
}
