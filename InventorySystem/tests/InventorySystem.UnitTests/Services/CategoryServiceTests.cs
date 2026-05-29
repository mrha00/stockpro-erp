using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using InventorySystem.Application.DTOs.Categories;
using InventorySystem.Domain.Exceptions;
using InventorySystem.Infrastructure.Data;
using InventorySystem.Infrastructure.Services;
using InventorySystem.UnitTests.Helpers;

namespace InventorySystem.UnitTests.Services;

public class CategoryServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly CategoryService _sut;

    public CategoryServiceTests()
    {
        _context = TestDbContextFactory.Create();
        _sut = new CategoryService(_context);
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    [Fact]
    public async Task CreateAsync_ValidRequest_ShouldCreateCategory()
    {
        var request = new CreateCategoryRequest
        {
            Name = "新分类",
            Code = "NEW-001",
            SortOrder = 1,
            Description = "测试分类"
        };

        var result = await _sut.CreateAsync(request);

        result.Should().NotBeNull();
        result.Name.Should().Be(request.Name);
        result.Code.Should().Be(request.Code);

        var categoryInDb = await _context.Categories.FindAsync(result.Id);
        categoryInDb.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateAsync_DuplicateCode_ShouldThrowConflictException()
    {
        var category = new Domain.Entities.Category
        {
            Id = Guid.NewGuid(),
            Name = "已有分类",
            Code = "EXIST-001"
        };
        await _context.Categories.AddAsync(category);
        await _context.SaveChangesAsync();

        var request = new CreateCategoryRequest
        {
            Name = "新分类",
            Code = "EXIST-001"
        };

        await _sut.Invoking(s => s.CreateAsync(request))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task GetByIdAsync_ExistingId_ShouldReturnCategory()
    {
        var category = new Domain.Entities.Category
        {
            Id = Guid.NewGuid(),
            Name = "测试分类",
            Code = "TEST-001"
        };
        await _context.Categories.AddAsync(category);
        await _context.SaveChangesAsync();

        var result = await _sut.GetByIdAsync(category.Id);

        result.Should().NotBeNull();
        result!.Name.Should().Be(category.Name);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ShouldReturnNull()
    {
        var result = await _sut.GetByIdAsync(Guid.NewGuid());

        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateAsync_ValidRequest_ShouldUpdateCategory()
    {
        var category = new Domain.Entities.Category
        {
            Id = Guid.NewGuid(),
            Name = "原名称",
            Code = "OLD-001"
        };
        await _context.Categories.AddAsync(category);
        await _context.SaveChangesAsync();

        var request = new UpdateCategoryRequest
        {
            Name = "新名称"
        };

        var result = await _sut.UpdateAsync(category.Id, request);

        result.Should().NotBeNull();
        result.Name.Should().Be("新名称");
        result.Code.Should().Be("OLD-001");
    }

    [Fact]
    public async Task DeleteAsync_ExistingCategory_ShouldSoftDelete()
    {
        var category = new Domain.Entities.Category
        {
            Id = Guid.NewGuid(),
            Name = "待删除",
            Code = "DEL-001"
        };
        await _context.Categories.AddAsync(category);
        await _context.SaveChangesAsync();

        await _sut.DeleteAsync(category.Id);

        var categoryInDb = await _context.Categories.IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Id == category.Id);
        categoryInDb.Should().NotBeNull();
        categoryInDb!.IsDeleted.Should().BeTrue();
    }
}
