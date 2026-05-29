namespace InventorySystem.Application.DTOs.Inventories;

public class InventoryDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int FrozenQuantity { get; set; }
    public int AvailableQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal AverageCost { get; set; }
    public DateTime? LastInboundAt { get; set; }
    public DateTime? LastOutboundAt { get; set; }
    public string? Location { get; set; }
}

public class InventoryTransactionDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string TransactionType { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string? ReferenceType { get; set; }
    public string? ReferenceNo { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedByName { get; set; }
}

public class AdjustInventoryRequest
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    /// <summary>
    /// 调节类型: Freeze/Unfreeze/Inbound/Outbound
    /// </summary>
    public string AdjustType { get; set; } = "Inbound";
    public string Reason { get; set; } = string.Empty;
}

public class InventoryQueryParams
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Keyword { get; set; }
    public bool? LowStock { get; set; }
    public bool? OverStock { get; set; }
}

public class InventoryTransactionQueryParams
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public Guid? ProductId { get; set; }
    public string? TransactionType { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
