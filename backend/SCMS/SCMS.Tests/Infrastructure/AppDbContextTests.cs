using Microsoft.EntityFrameworkCore;
using SCMS.Domain.Entities;
using SCMS.Domain.Enums;
using SCMS.Infrastructure.Persistence;
using SCMS.Tests.TestDoubles;

namespace SCMS.Tests.Infrastructure;

public sealed class AppDbContextTests
{
    [Fact]
    public async Task SaveChangesAsync_WhenAddingEntity_PopulatesAuditFields()
    {
        await using var dbContext = CreateDbContext();
        var user = new User
        {
            EntraObjectId = "entra-audit",
            Email = "audit@example.edu",
            DisplayName = "Audit User",
            Role = AppRole.Member,
            Status = UserStatus.Active
        };

        await dbContext.Users.AddAsync(user);
        await dbContext.SaveChangesAsync();

        Assert.NotEqual(Guid.Empty, user.Id);
        Assert.False(user.IsDeleted);
        Assert.Null(user.DeletedAt);
        Assert.NotEqual(default, user.CreatedAt);
        Assert.NotEqual(default, user.UpdatedAt);
    }

    [Fact]
    public async Task SaveChangesAsync_WhenRemovingEntity_SoftDeletesAndQueryFilterHidesIt()
    {
        await using var dbContext = CreateDbContext();
        var club = TestData.ActiveClub();
        await dbContext.Clubs.AddAsync(club);
        await dbContext.SaveChangesAsync();

        dbContext.Clubs.Remove(club);
        await dbContext.SaveChangesAsync();

        Assert.True(club.IsDeleted);
        Assert.NotNull(club.DeletedAt);
        Assert.Empty(await dbContext.Clubs.ToListAsync());
        var storedClub = await dbContext.Clubs.IgnoreQueryFilters().SingleAsync();
        Assert.Equal(club.Id, storedClub.Id);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }
}
