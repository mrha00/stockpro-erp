using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.Customers;
using InventorySystem.Application.Interfaces;

namespace InventorySystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<IActionResult> Create([FromBody] CreateCustomerRequest request, CancellationToken cancellationToken)
    {
        var result = await _customerService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<CustomerDto>.CreatedResult(result, "Customer created successfully"));
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCustomerRequest request, CancellationToken cancellationToken)
    {
        var result = await _customerService.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<CustomerDto>.SuccessResult(result, "Customer updated successfully"));
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _customerService.DeleteAsync(id, cancellationToken);
        return Ok(ApiResponse.SuccessResult("Customer deleted successfully"));
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _customerService.GetByIdAsync(id, cancellationToken);
        if (result == null)
            return NotFound(ApiResponse.ErrorResult(404, "Customer not found"));
        return Ok(ApiResponse<CustomerDto>.SuccessResult(result));
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResponse<CustomerDto>>), 200)]
    public async Task<IActionResult> GetPaged([FromQuery] CustomerQueryParams queryParams, CancellationToken cancellationToken)
    {
        var result = await _customerService.GetPagedAsync(queryParams, cancellationToken);
        return Ok(ApiResponse<PagedResponse<CustomerDto>>.SuccessResult(result));
    }
}
