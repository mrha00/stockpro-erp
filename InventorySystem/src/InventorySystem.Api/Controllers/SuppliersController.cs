using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.Suppliers;
using InventorySystem.Application.Interfaces;

namespace InventorySystem.Api.Controllers;

/// <summary>
/// 供应商管理
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SuppliersController : ControllerBase
{
    private readonly ISupplierService _supplierService;

    public SuppliersController(ISupplierService supplierService)
    {
        _supplierService = supplierService;
    }

    /// <summary>
    /// 创建供应商
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<SupplierDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<IActionResult> Create([FromBody] CreateSupplierRequest request, CancellationToken cancellationToken)
    {
        var result = await _supplierService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<SupplierDto>.CreatedResult(result, "Supplier created successfully"));
    }

    /// <summary>
    /// 更新供应商信息
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<SupplierDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSupplierRequest request, CancellationToken cancellationToken)
    {
        var result = await _supplierService.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<SupplierDto>.SuccessResult(result, "Supplier updated successfully"));
    }

    /// <summary>
    /// 删除供应商
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _supplierService.DeleteAsync(id, cancellationToken);
        return Ok(ApiResponse.SuccessResult("Supplier deleted successfully"));
    }

    /// <summary>
    /// 根据ID获取供应商详情
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<SupplierDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _supplierService.GetByIdAsync(id, cancellationToken);
        if (result == null)
            return NotFound(ApiResponse.ErrorResult(404, "Supplier not found"));
        return Ok(ApiResponse<SupplierDto>.SuccessResult(result));
    }

    /// <summary>
    /// 分页获取供应商列表
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResponse<SupplierDto>>), 200)]
    public async Task<IActionResult> GetPaged([FromQuery] SupplierQueryParams queryParams, CancellationToken cancellationToken)
    {
        var result = await _supplierService.GetPagedAsync(queryParams, cancellationToken);
        return Ok(ApiResponse<PagedResponse<SupplierDto>>.SuccessResult(result));
    }
}
