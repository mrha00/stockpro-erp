using InventorySystem.Domain.Enums;

namespace InventorySystem.Application.DTOs.SalesOrders;

public class CreateSalesOrderRequest
{
    public Guid CustomerId { get; set; }
    public string? ShippingAddress { get; set; }
    public string? Remarks { get; set; }
    public List<SalesOrderItemRequest> Items { get; set; } = new();
}

public class SalesOrderItemRequest
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

public class UpdateSalesOrderRequest
{
    public string? ShippingAddress { get; set; }
    public string? Remarks { get; set; }
}

public class SalesOrderDto
{
    public Guid Id { get; set; }
    public string OrderNo { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public OrderStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public PaymentStatus PaymentStatus { get; set; }
    public string PaymentStatusText { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal ReceivedAmount { get; set; }
    public DateTime OrderDate { get; set; }
    public DateTime? ShippedDate { get; set; }
    public string? ShippingAddress { get; set; }
    public string? Remarks { get; set; }
    public List<SalesOrderItemDto> Items { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class SalesOrderItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
    public int ShippedQuantity { get; set; }
}

public class SalesOrderQueryParams
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? OrderNo { get; set; }
    public Guid? CustomerId { get; set; }
    public OrderStatus? Status { get; set; }
    public PaymentStatus? PaymentStatus { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class ShipSalesOrderRequest
{
    public List<ShipItemRequest> Items { get; set; } = new();
}

public class ShipItemRequest
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
}
