namespace InventorySystem.Domain.Entities;

/// <summary>
/// 商品实体
/// </summary>
public class Product : BaseEntity
{
    /// <summary>
    /// 商品名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 商品编码（SKU）
    /// </summary>
    public string Sku { get; set; } = string.Empty;

    /// <summary>
    /// 条形码
    /// </summary>
    public string? Barcode { get; set; }

    /// <summary>
    /// 分类ID
    /// </summary>
    public Guid CategoryId { get; set; }

    /// <summary>
    /// 分类
    /// </summary>
    public Category Category { get; set; } = null!;

    /// <summary>
    /// 规格
    /// </summary>
    public string? Specification { get; set; }

    /// <summary>
    /// 单位
    /// </summary>
    public string Unit { get; set; } = "个";

    /// <summary>
    /// 进价
    /// </summary>
    public decimal CostPrice { get; set; }

    /// <summary>
    /// 售价
    /// </summary>
    public decimal SalePrice { get; set; }

    /// <summary>
    /// 最低库存
    /// </summary>
    public int MinStock { get; set; } = 0;

    /// <summary>
    /// 最高库存
    /// </summary>
    public int MaxStock { get; set; } = 9999;

    /// <summary>
    /// 商品描述
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 商品图片URL
    /// </summary>
    public string? ImageUrl { get; set; }

    /// <summary>
    /// 是否上架
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// 库存信息
    /// </summary>
    public Inventory? Inventory { get; set; }
}
