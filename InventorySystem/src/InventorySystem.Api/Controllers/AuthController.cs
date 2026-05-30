using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using InventorySystem.Application.Common;
using InventorySystem.Application.DTOs.Auth;
using InventorySystem.Application.Interfaces;

namespace InventorySystem.Api.Controllers;

/// <summary>
/// 认证控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IWebHostEnvironment _environment;

    private static readonly HashSet<string> AllowedAvatarExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp"
    };

    public AuthController(IAuthService authService, IWebHostEnvironment environment)
    {
        _authService = authService;
        _environment = environment;
    }

    /// <summary>
    /// 用户登录
    /// </summary>
    [HttpPost("login")]
    [EnableRateLimiting("login")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponse>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 401)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _authService.LoginAsync(request, ipAddress, cancellationToken);
        return Ok(ApiResponse<LoginResponse>.SuccessResult(result, "Login successful"));
    }

    /// <summary>
    /// 刷新令牌
    /// </summary>
    [HttpPost("refresh-token")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponse>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 401)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _authService.RefreshTokenAsync(request.RefreshToken, ipAddress, cancellationToken);
        return Ok(ApiResponse<LoginResponse>.SuccessResult(result, "Token refreshed"));
    }

    /// <summary>
    /// 撤销令牌（退出登录）
    /// </summary>
    [HttpPost("revoke-token")]
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 401)]
    public async Task<IActionResult> RevokeToken([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        await _authService.RevokeTokenAsync(request.RefreshToken, cancellationToken);
        return Ok(ApiResponse.SuccessResult("Token revoked"));
    }

    /// <summary>
    /// 修改密码
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await _authService.ChangePasswordAsync(userId, request, cancellationToken);
        return Ok(ApiResponse.SuccessResult("Password changed successfully"));
    }

    /// <summary>
    /// 获取当前登录用户资料
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), 200)]
    public async Task<IActionResult> GetProfile(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var profile = await _authService.GetProfileAsync(userId, cancellationToken);
        return Ok(ApiResponse<UserDto>.SuccessResult(profile));
    }

    /// <summary>
    /// 更新个人资料（姓名、邮箱）
    /// </summary>
    [HttpPut("profile")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), 200)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var profile = await _authService.UpdateProfileAsync(userId, request, cancellationToken);
        return Ok(ApiResponse<UserDto>.SuccessResult(profile, "Profile updated successfully"));
    }

    /// <summary>
    /// 上传头像（jpg/png/gif/webp，最大 2MB）
    /// </summary>
    [HttpPost("avatar")]
    [Authorize]
    [RequestSizeLimit(2 * 1024 * 1024)]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), 200)]
    public async Task<IActionResult> UploadAvatar(IFormFile file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse.ErrorResult(400, "Avatar file is required"));

        if (file.Length > 2 * 1024 * 1024)
            return BadRequest(ApiResponse.ErrorResult(400, "Avatar file must be 2MB or smaller"));

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext) || !AllowedAvatarExtensions.Contains(ext))
            return BadRequest(ApiResponse.ErrorResult(400, "Only JPG, PNG, GIF, WEBP are allowed"));

        var userId = GetCurrentUserId();
        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var avatarDir = Path.Combine(webRoot, "uploads", "avatars");
        Directory.CreateDirectory(avatarDir);

        foreach (var oldFile in Directory.GetFiles(avatarDir, $"{userId}.*"))
        {
            System.IO.File.Delete(oldFile);
        }

        var fileName = $"{userId}{ext.ToLowerInvariant()}";
        var savePath = Path.Combine(avatarDir, fileName);
        await using (var stream = new FileStream(savePath, FileMode.Create))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        var avatarUrl = $"/uploads/avatars/{fileName}?v={DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
        var profile = await _authService.UpdateAvatarAsync(userId, avatarUrl, cancellationToken);
        return Ok(ApiResponse<UserDto>.SuccessResult(profile, "Avatar uploaded successfully"));
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        return claim != null ? Guid.Parse(claim.Value) : throw new UnauthorizedAccessException();
    }
}
