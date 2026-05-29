using FluentValidation;
using InventorySystem.Application.DTOs.Inventories;

namespace InventorySystem.Application.Validators;

public class AdjustInventoryRequestValidator : AbstractValidator<AdjustInventoryRequest>
{
    private static readonly string[] AllowedTypes = ["Freeze", "Unfreeze", "Inbound", "Outbound", "Adjust"];

    public AdjustInventoryRequestValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.Quantity).GreaterThan(0);
        RuleFor(x => x.AdjustType)
            .NotEmpty()
            .Must(t => AllowedTypes.Contains(t, StringComparer.OrdinalIgnoreCase))
            .WithMessage("AdjustType must be Freeze, Unfreeze, Inbound, Outbound, or Adjust");
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(500);
    }
}
