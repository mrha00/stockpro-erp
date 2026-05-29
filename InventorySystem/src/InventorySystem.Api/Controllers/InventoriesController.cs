using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.Inventories;
using InventorySystem.Application.Interfaces;

namespace InventorySystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InventoriesController : ControllerBase
{
    private readonly IInventoryService _inventoryService;

    public InventoriesController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    [HttpGet("product/{productId}")]
    [ProducesResponseType(typeof(ApiResponse<InventoryDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> GetByProductId(Guid productId, CancellationToken cancellationToken)
    {
        var result = await _inventoryService.GetByProductIdAsync(productId, cancellationToken);
        if (result == null)
            return NotFound(ApiResponse.ErrorResult(404, "Inventory not found"));
        return Ok(ApiResponse<InventoryDto>.SuccessResult(result));
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResponse<InventoryDto>>), 200)]
    public async Task<IActionResult> GetPaged([FromQuery] InventoryQueryParams queryParams, CancellationToken cancellationToken)
    {
        var result = await _inventoryService.GetPagedAsync(queryParams, cancellationToken);
        return Ok(ApiResponse<PagedResponse<InventoryDto>>.SuccessResult(result));
    }

    [HttpPost("adjust")]
    [Authorize(Roles = "Admin,WarehouseKeeper")]
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<IActionResult> Adjust([FromBody] AdjustInventoryRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await _inventoryService.AdjustAsync(request, userId, cancellationToken);
        return Ok(ApiResponse.SuccessResult("Inventory adjusted successfully"));
    }

    [HttpGet("transactions")]
    [ProducesResponseType(typeof(ApiResponse<PagedResponse<InventoryTransactionDto>>), 200)]
    public async Task<IActionResult> GetTransactions([FromQuery] InventoryTransactionQueryParams queryParams, CancellationToken cancellationToken)
    {
        var result = await _inventoryService.GetTransactionsAsync(queryParams, cancellationToken);
        return Ok(ApiResponse<PagedResponse<InventoryTransactionDto>>.SuccessResult(result));
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null ? Guid.Parse(claim.Value) : throw new UnauthorizedAccessException();
    }
}
