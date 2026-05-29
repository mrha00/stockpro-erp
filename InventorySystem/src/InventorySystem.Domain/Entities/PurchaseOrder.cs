using InventorySystem.Domain.Enums;

namespace InventorySystem.Domain.Entities;

/// <summary>
/// 采购单实体
/// </summary>
public class PurchaseOrder : BaseEntity
{
    /// <summary>
    /// 采购单号
    /// </summary>
    public string OrderNo { get; set; } = string.Empty;

    /// <summary>
    /// 供应商ID
    /// </summary>
    public Guid SupplierId { get; set; }

    /// <summary>
    /// 供应商
    /// </summary>
    public Supplier Supplier { get; set; } = null!;

    /// <summary>
    /// 订单状态
    /// </summary>
    public OrderStatus Status { get; set; } = OrderStatus.Draft;

    /// <summary>
    /// 付款状态
    /// </summary>
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Unpaid;

    /// <summary>
    /// 总金额
    /// </summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// 已付金额
    /// </summary>
    public decimal PaidAmount { get; set; } = 0;

    /// <summary>
    /// 下单日期
    /// </summary>
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 预计到货日期
    /// </summary>
    public DateTime? ExpectedDate { get; set; }

    /// <summary>
    /// 实际到货日期
    /// </summary>
    public DateTime? ReceivedDate { get; set; }

    /// <summary>
    /// 审核人ID
    /// </summary>
    public Guid? ApprovedBy { get; set; }

    /// <summary>
    /// 审核时间
    /// </summary>
    public DateTime? ApprovedAt { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remarks { get; set; }

    /// <summary>
    /// 采购单明细
    /// </summary>
    public ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
}

/// <summary>
/// 采购单明细实体
/// </summary>
public class PurchaseOrderItem : BaseEntity
{
    /// <summary>
    /// 采购单ID
    /// </summary>
    public Guid PurchaseOrderId { get; set; }

    /// <summary>
    /// 采购单
    /// </summary>
    public PurchaseOrder PurchaseOrder { get; set; } = null!;

    /// <summary>
    /// 商品ID
    /// </summary>
    public Guid ProductId { get; set; }

    /// <summary>
    /// 商品
    /// </summary>
    public Product Product { get; set; } = null!;

    /// <summary>
    /// 数量
    /// </summary>
    public int Quantity { get; set; }

    /// <summary>
    /// 单价
    /// </summary>
    public decimal UnitPrice { get; set; }

    /// <summary>
    /// 小计金额
    /// </summary>
    public decimal Subtotal => Quantity * UnitPrice;

    /// <summary>
    /// 已收数量
    /// </summary>
    public int ReceivedQuantity { get; set; } = 0;

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remarks { get; set; }
}
