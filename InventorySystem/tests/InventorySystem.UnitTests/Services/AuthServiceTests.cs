using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Moq;
using InventorySystem.Application.DTOs.Auth;
using InventorySystem.Application.Interfaces;
using InventorySystem.Domain.Entities;
using InventorySystem.Domain.Enums;
using InventorySystem.Domain.Exceptions;
using InventorySystem.Infrastructure.Data;
using InventorySystem.Infrastructure.Services;
using InventorySystem.UnitTests.Helpers;

namespace InventorySystem.UnitTests.Services;

public class AuthServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly AuthService _sut;
    private readonly Mock<IAuditService> _auditMock = new();

    public AuthServiceTests()
    {
        _context = TestDbContextFactory.Create();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "TestSecretKeyMustBeAtLeast32CharactersLong!",
                ["Jwt:Issuer"] = "InventorySystem",
                ["Jwt:Audience"] = "InventorySystem",
                ["Jwt:ExpirationInMinutes"] = "60"
            })
            .Build();
        _sut = new AuthService(_context, configuration, _auditMock.Object);
    }

    public void Dispose() => _context.Dispose();

    [Fact]
    public async Task LoginAsync_ValidCredentials_ShouldReturnTokens()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "admin",
            Email = "admin@test.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(DatabaseSeeder.DemoPassword),
            Role = UserRole.Admin,
            IsActive = true
        };
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        var result = await _sut.LoginAsync(
            new LoginRequest { Username = "admin", Password = DatabaseSeeder.DemoPassword },
            "127.0.0.1");

        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.User.Username.Should().Be("admin");
    }

    [Fact]
    public async Task LoginAsync_InvalidPassword_ShouldThrowUnauthorized()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(DatabaseSeeder.DemoPassword),
            IsActive = true
        };
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        await _sut.Invoking(s => s.LoginAsync(
                new LoginRequest { Username = "admin", Password = "wrong" },
                "127.0.0.1"))
            .Should().ThrowAsync<UnauthorizedException>();
    }

    [Fact]
    public async Task RefreshTokenAsync_ValidToken_ShouldReturnNewTokens()
    {
        var refreshToken = "valid-refresh-token";
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "admin",
            Email = "admin@test.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(DatabaseSeeder.DemoPassword),
            Role = UserRole.Admin,
            IsActive = true,
            RefreshToken = refreshToken,
            RefreshTokenExpiry = DateTime.UtcNow.AddDays(1)
        };
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        var result = await _sut.RefreshTokenAsync(refreshToken, "127.0.0.1");

        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBe(refreshToken);
    }
}
