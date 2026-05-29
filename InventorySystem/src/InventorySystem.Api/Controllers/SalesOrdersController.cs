using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.SalesOrders;
using InventorySystem.Application.Interfaces;
using InventorySystem.Domain.Enums;

namespace InventorySystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SalesOrdersController : ControllerBase
{
    private readonly ISalesOrderService _salesOrderService;

    public SalesOrdersController(ISalesOrderService salesOrderService)
    {
        _salesOrderService = salesOrderService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<SalesOrderDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<IActionResult> Create([FromBody] CreateSalesOrderRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await _salesOrderService.CreateAsync(request, userId, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<SalesOrderDto>.CreatedResult(result, "Sales order created successfully"));
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<SalesOrderDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSalesOrderRequest request, CancellationToken cancellationToken)
    {
        var result = await _salesOrderService.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<SalesOrderDto>.SuccessResult(result, "Sales order updated successfully"));
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _salesOrderService.DeleteAsync(id, cancellationToken);
        return Ok(ApiResponse.SuccessResult("Sales order deleted successfully"));
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<SalesOrderDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _salesOrderService.GetByIdAsync(id, cancellationToken);
        if (result == null)
            return NotFound(ApiResponse.ErrorResult(404, "Sales order not found"));
        return Ok(ApiResponse<SalesOrderDto>.SuccessResult(result));
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResponse<SalesOrderDto>>), 200)]
    public async Task<IActionResult> GetPaged([FromQuery] SalesOrderQueryParams queryParams, CancellationToken cancellationToken)
    {
        var result = await _salesOrderService.GetPagedAsync(queryParams, cancellationToken);
        return Ok(ApiResponse<PagedResponse<SalesOrderDto>>.SuccessResult(result));
    }

    [HttpPost("{id}/approve")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    [ProducesResponseType(typeof(ApiResponse<SalesOrderDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<IActionResult> Approve(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await _salesOrderService.ApproveAsync(id, userId, cancellationToken);
        return Ok(ApiResponse<SalesOrderDto>.SuccessResult(result, "Sales order approved"));
    }

    [HttpPost("{id}/ship")]
    [ProducesResponseType(typeof(ApiResponse<SalesOrderDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<IActionResult> Ship(Guid id, [FromBody] ShipSalesOrderRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await _salesOrderService.ShipAsync(id, request, userId, cancellationToken);
        return Ok(ApiResponse<SalesOrderDto>.SuccessResult(result, "Sales order shipped"));
    }

    [HttpPost("{id}/cancel")]
    [ProducesResponseType(typeof(ApiResponse<SalesOrderDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await _salesOrderService.CancelAsync(id, userId, cancellationToken);
        return Ok(ApiResponse<SalesOrderDto>.SuccessResult(result, "Sales order cancelled"));
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null ? Guid.Parse(claim.Value) : throw new UnauthorizedAccessException();
    }
}
