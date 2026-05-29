namespace InventorySystem.Domain.Entities;

/// <summary>
/// 库存实体
/// </summary>
public class Inventory : BaseEntity
{
    /// <summary>
    /// 商品ID
    /// </summary>
    public Guid ProductId { get; set; }

    /// <summary>
    /// 商品
    /// </summary>
    public Product Product { get; set; } = null!;

    /// <summary>
    /// 当前库存数量
    /// </summary>
    public int Quantity { get; set; } = 0;

    /// <summary>
    /// 冻结数量（已分配未出库）
    /// </summary>
    public int FrozenQuantity { get; set; } = 0;

    /// <summary>
    /// 可用库存 = Quantity - FrozenQuantity
    /// </summary>
    public int AvailableQuantity => Quantity - FrozenQuantity;

    /// <summary>
    /// 库存金额
    /// </summary>
    public decimal TotalAmount { get; set; } = 0;

    /// <summary>
    /// 平均成本价
    /// </summary>
    public decimal AverageCost => Quantity > 0 ? TotalAmount / Quantity : 0;

    /// <summary>
    /// 最后入库时间
    /// </summary>
    public DateTime? LastInboundAt { get; set; }

    /// <summary>
    /// 最后出库时间
    /// </summary>
    public DateTime? LastOutboundAt { get; set; }

    /// <summary>
    /// 库位
    /// </summary>
    public string? Location { get; set; }

    /// <summary>
    /// 库存流水
    /// </summary>
    public ICollection<InventoryTransaction> Transactions { get; set; } = new List<InventoryTransaction>();
}

/// <summary>
/// 库存流水实体
/// </summary>
public class InventoryTransaction : BaseEntity
{
    /// <summary>
    /// 商品ID
    /// </summary>
    public Guid ProductId { get; set; }

    /// <summary>
    /// 商品
    /// </summary>
    public Product Product { get; set; } = null!;

    /// <summary>
    /// 交易类型：Inbound/Outbound/Adjust
    /// </summary>
    public string TransactionType { get; set; } = string.Empty;

    /// <summary>
    /// 数量（正数入库，负数出库）
    /// </summary>
    public int Quantity { get; set; }

    /// <summary>
    /// 单价
    /// </summary>
    public decimal UnitPrice { get; set; }

    /// <summary>
    /// 关联单据类型
    /// </summary>
    public string? ReferenceType { get; set; }

    /// <summary>
    /// 关联单据ID
    /// </summary>
    public Guid? ReferenceId { get; set; }

    /// <summary>
    /// 关联单据编号
    /// </summary>
    public string? ReferenceNo { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remarks { get; set; }
}
