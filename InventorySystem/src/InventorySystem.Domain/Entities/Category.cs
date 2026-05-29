namespace InventorySystem.Domain.Entities;

/// <summary>
/// 商品分类实体
/// </summary>
public class Category : BaseEntity
{
    /// <summary>
    /// 分类名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 分类编码
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// 父分类ID
    /// </summary>
    public Guid? ParentId { get; set; }

    /// <summary>
    /// 父分类
    /// </summary>
    public Category? Parent { get; set; }

    /// <summary>
    /// 子分类
    /// </summary>
    public ICollection<Category> Children { get; set; } = new List<Category>();

    /// <summary>
    /// 排序号
    /// </summary>
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// 描述
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 该分类下的商品
    /// </summary>
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
