using System.Linq.Expressions;
using InventorySystem.Domain.Entities;

namespace InventorySystem.Infrastructure.Repositories;

/// <summary>
/// 通用仓储接口
/// </summary>
public interface IRepository<T> where T : BaseEntity
{
    /// <summary>
    /// 根据ID获取
    /// </summary>
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取所有
    /// </summary>
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 根据条件查询
    /// </summary>
    Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根据条件查询单个
    /// </summary>
    Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);

    /// <summary>
    /// 检查是否存在
    /// </summary>
    Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取数量
    /// </summary>
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 分页查询
    /// </summary>
    Task<(IReadOnlyList<T> Items, int Total)> GetPagedAsync(
        int page,
        int pageSize,
        Expression<Func<T, bool>>? predicate = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 添加
    /// </summary>
    Task<T> AddAsync(T entity, CancellationToken cancellationToken = default);

    /// <summary>
    /// 批量添加
    /// </summary>
    Task AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新
    /// </summary>
    Task UpdateAsync(T entity, CancellationToken cancellationToken = default);

    /// <summary>
    /// 批量更新
    /// </summary>
    Task UpdateRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);

    /// <summary>
    /// 删除（软删除）
    /// </summary>
    Task DeleteAsync(T entity, Guid? deletedBy = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 批量删除
    /// </summary>
    Task DeleteRangeAsync(IEnumerable<T> entities, Guid? deletedBy = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取可查询的IQueryable
    /// </summary>
    IQueryable<T> GetQueryable();
}
