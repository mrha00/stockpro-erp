using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.PurchaseOrders;
using InventorySystem.Application.Interfaces;
using InventorySystem.Domain.Enums;

namespace InventorySystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PurchaseOrdersController : ControllerBase
{
    private readonly IPurchaseOrderService _purchaseOrderService;

    public PurchaseOrdersController(IPurchaseOrderService purchaseOrderService)
    {
        _purchaseOrderService = purchaseOrderService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<PurchaseOrderDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<IActionResult> Create([FromBody] CreatePurchaseOrderRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await _purchaseOrderService.CreateAsync(request, userId, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<PurchaseOrderDto>.CreatedResult(result, "Purchase order created successfully"));
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<PurchaseOrderDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePurchaseOrderRequest request, CancellationToken cancellationToken)
    {
        var result = await _purchaseOrderService.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<PurchaseOrderDto>.SuccessResult(result, "Purchase order updated successfully"));
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _purchaseOrderService.DeleteAsync(id, cancellationToken);
        return Ok(ApiResponse.SuccessResult("Purchase order deleted successfully"));
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<PurchaseOrderDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _purchaseOrderService.GetByIdAsync(id, cancellationToken);
        if (result == null)
            return NotFound(ApiResponse.ErrorResult(404, "Purchase order not found"));
        return Ok(ApiResponse<PurchaseOrderDto>.SuccessResult(result));
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResponse<PurchaseOrderDto>>), 200)]
    public async Task<IActionResult> GetPaged([FromQuery] PurchaseOrderQueryParams queryParams, CancellationToken cancellationToken)
    {
        var result = await _purchaseOrderService.GetPagedAsync(queryParams, cancellationToken);
        return Ok(ApiResponse<PagedResponse<PurchaseOrderDto>>.SuccessResult(result));
    }

    [HttpPost("{id}/approve")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    [ProducesResponseType(typeof(ApiResponse<PurchaseOrderDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<IActionResult> Approve(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await _purchaseOrderService.ApproveAsync(id, userId, cancellationToken);
        return Ok(ApiResponse<PurchaseOrderDto>.SuccessResult(result, "Purchase order approved"));
    }

    [HttpPost("{id}/receive")]
    [ProducesResponseType(typeof(ApiResponse<PurchaseOrderDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<IActionResult> Receive(Guid id, [FromBody] ReceivePurchaseOrderRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await _purchaseOrderService.ReceiveAsync(id, request, userId, cancellationToken);
        return Ok(ApiResponse<PurchaseOrderDto>.SuccessResult(result, "Purchase order received"));
    }

    [HttpPost("{id}/cancel")]
    [ProducesResponseType(typeof(ApiResponse<PurchaseOrderDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var result = await _purchaseOrderService.CancelAsync(id, cancellationToken);
        return Ok(ApiResponse<PurchaseOrderDto>.SuccessResult(result, "Purchase order cancelled"));
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null ? Guid.Parse(claim.Value) : throw new UnauthorizedAccessException();
    }
}
