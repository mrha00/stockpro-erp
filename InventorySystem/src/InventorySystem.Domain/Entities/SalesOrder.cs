using InventorySystem.Domain.Enums;

namespace InventorySystem.Domain.Entities;

/// <summary>
/// 销售单实体
/// </summary>
public class SalesOrder : BaseEntity
{
    /// <summary>
    /// 销售单号
    /// </summary>
    public string OrderNo { get; set; } = string.Empty;

    /// <summary>
    /// 客户ID
    /// </summary>
    public Guid CustomerId { get; set; }

    /// <summary>
    /// 客户
    /// </summary>
    public Customer Customer { get; set; } = null!;

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
    /// 已收金额
    /// </summary>
    public decimal ReceivedAmount { get; set; } = 0;

    /// <summary>
    /// 下单日期
    /// </summary>
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 发货日期
    /// </summary>
    public DateTime? ShippedDate { get; set; }

    /// <summary>
    /// 审核人ID
    /// </summary>
    public Guid? ApprovedBy { get; set; }

    /// <summary>
    /// 审核时间
    /// </summary>
    public DateTime? ApprovedAt { get; set; }

    /// <summary>
    /// 收货地址
    /// </summary>
    public string? ShippingAddress { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remarks { get; set; }

    /// <summary>
    /// 销售单明细
    /// </summary>
    public ICollection<SalesOrderItem> Items { get; set; } = new List<SalesOrderItem>();
}

/// <summary>
/// 销售单明细实体
/// </summary>
public class SalesOrderItem : BaseEntity
{
    /// <summary>
    /// 销售单ID
    /// </summary>
    public Guid SalesOrderId { get; set; }

    /// <summary>
    /// 销售单
    /// </summary>
    public SalesOrder SalesOrder { get; set; } = null!;

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
    /// 已发数量
    /// </summary>
    public int ShippedQuantity { get; set; } = 0;

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remarks { get; set; }
}
