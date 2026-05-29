using FluentValidation;
using InventorySystem.Application.DTOs.Auth;

namespace InventorySystem.Application.Validators;

/// <summary>
/// 登录请求验证器
/// </summary>
public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Username is required")
            .MinimumLength(3).WithMessage("Username must be at least 3 characters")
            .MaximumLength(50).WithMessage("Username cannot exceed 50 characters");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters");
    }
}

/// <summary>
/// 刷新令牌请求验证器
/// </summary>
public class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequest>
{
    public RefreshTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("RefreshToken is required");
    }
}

/// <summary>
/// 修改密码请求验证器
/// </summary>
public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.OldPassword)
            .NotEmpty().WithMessage("OldPassword is required");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("NewPassword is required")
            .MinimumLength(6).WithMessage("NewPassword must be at least 6 characters")
            .MaximumLength(100).WithMessage("NewPassword cannot exceed 100 characters")
            .Matches(@"[A-Z]").WithMessage("NewPassword must contain at least one uppercase letter")
            .Matches(@"[a-z]").WithMessage("NewPassword must contain at least one lowercase letter")
            .Matches(@"[0-9]").WithMessage("NewPassword must contain at least one digit")
            .Matches(@"[^a-zA-Z0-9]").WithMessage("NewPassword must contain at least one special character");
    }
}
