using SCMS.Application.Users;
using SCMS.Domain.Enums;
using SCMS.Tests.TestDoubles;

namespace SCMS.Tests.Application;

public sealed class UserServiceTests
{
    [Fact]
    public async Task GetOrCreateCurrentUserAsync_WhenUserDoesNotExist_CreatesMemberWithNormalizedProfile()
    {
        var repository = new FakeUserRepository();
        repository.QueueUserByEntraObjectId(null);
        var service = new UserService(repository);

        var result = await service.GetOrCreateCurrentUserAsync(
            new CurrentUserRequest(
                "entra-1",
                "  ada@example.edu  ",
                "  Ada Lovelace  ",
                "  Ada  ",
                "  Lovelace  "),
            repairStaleClubLeaderRole: false,
            CancellationToken.None);

        Assert.NotNull(repository.AddedUser);
        Assert.Equal("entra-1", repository.AddedUser.EntraObjectId);
        Assert.Equal("ada@example.edu", repository.AddedUser.Email);
        Assert.Equal("Ada Lovelace", repository.AddedUser.DisplayName);
        Assert.Equal("Ada", repository.AddedUser.FirstName);
        Assert.Equal("Lovelace", repository.AddedUser.LastName);
        Assert.Equal(AppRole.Member, repository.AddedUser.Role);
        Assert.Equal(UserStatus.Active, repository.AddedUser.Status);
        Assert.NotNull(repository.AddedUser.LastLoginAt);
        Assert.Equal(1, repository.SaveChangesCount);
        Assert.Equal(UserRoleLabels.Member, result.Role);
    }

    [Fact]
    public async Task GetOrCreateCurrentUserAsync_WhenExistingProfileChanged_UpdatesAndSaves()
    {
        var user = TestData.User(
            email: "old@example.edu",
            displayName: "Old Name");
        user.EntraObjectId = "entra-2";
        user.FirstName = "Old";
        user.LastName = "Name";
        var repository = new FakeUserRepository();
        repository.QueueUserByEntraObjectId(user);
        var service = new UserService(repository);

        var result = await service.GetOrCreateCurrentUserAsync(
            new CurrentUserRequest(
                "entra-2",
                "  new@example.edu  ",
                "  New Name  ",
                "  New  ",
                null),
            repairStaleClubLeaderRole: false,
            CancellationToken.None);

        Assert.Equal("new@example.edu", user.Email);
        Assert.Equal("New Name", user.DisplayName);
        Assert.Equal("New", user.FirstName);
        Assert.Null(user.LastName);
        Assert.Equal(1, repository.SaveChangesCount);
        Assert.Equal("new@example.edu", result.Email);
        Assert.Equal("New Name", result.DisplayName);
    }

    [Fact]
    public async Task GetOrCreateCurrentUserAsync_WhenExistingProfileUnchanged_DoesNotSave()
    {
        var user = TestData.User(email: "same@example.edu", displayName: "Same User");
        user.EntraObjectId = "entra-3";
        user.FirstName = "Same";
        user.LastName = "User";
        var repository = new FakeUserRepository();
        repository.QueueUserByEntraObjectId(user);
        var service = new UserService(repository);

        var result = await service.GetOrCreateCurrentUserAsync(
            new CurrentUserRequest("entra-3", "same@example.edu", "Same User", "Same", "User"),
            repairStaleClubLeaderRole: false,
            CancellationToken.None);

        Assert.Equal(0, repository.SaveChangesCount);
        Assert.Equal(user.Id, result.Id);
    }

    [Fact]
    public async Task GetOrCreateCurrentUserAsync_WhenCreateConflicts_ReloadsAndUpdatesExistingUser()
    {
        var existing = TestData.User(email: "old@example.edu", displayName: "Old User");
        existing.EntraObjectId = "entra-4";
        var repository = new FakeUserRepository
        {
            ThrowConflictOnFirstSave = true
        };
        repository.QueueUserByEntraObjectId(null);
        repository.QueueUserByEntraObjectId(existing);
        var service = new UserService(repository);

        var result = await service.GetOrCreateCurrentUserAsync(
            new CurrentUserRequest("entra-4", "new@example.edu", "New User", null, null),
            repairStaleClubLeaderRole: false,
            CancellationToken.None);

        Assert.Equal(2, repository.GetByEntraObjectIdCount);
        Assert.Equal(2, repository.SaveChangesCount);
        Assert.Equal("new@example.edu", existing.Email);
        Assert.Equal("New User", existing.DisplayName);
        Assert.Equal(existing.Id, result.Id);
    }

    [Fact]
    public async Task GetOrCreateCurrentUserAsync_WhenClubLeaderOwnsNoActiveClubs_DemotesToMember()
    {
        var user = TestData.User(AppRole.ClubLeader, email: "leader@example.edu", displayName: "Leader User");
        user.EntraObjectId = "entra-5";
        user.FirstName = "Student";
        user.LastName = "User";
        var repository = new FakeUserRepository
        {
            UserOwnsAnyActiveClub = false
        };
        repository.QueueUserByEntraObjectId(user);
        var service = new UserService(repository);

        var result = await service.GetOrCreateCurrentUserAsync(
            new CurrentUserRequest("entra-5", "leader@example.edu", "Leader User", "Student", "User"),
            repairStaleClubLeaderRole: true,
            CancellationToken.None);

        Assert.Equal(AppRole.Member, user.Role);
        Assert.Equal(UserRoleLabels.Member, result.Role);
        Assert.Equal(1, repository.SaveChangesCount);
    }

    [Fact]
    public async Task GetOrCreateCurrentUserAsync_WhenClubLeaderStillOwnsActiveClub_KeepsRole()
    {
        var user = TestData.User(AppRole.ClubLeader, email: "leader@example.edu", displayName: "Leader User");
        user.EntraObjectId = "entra-6";
        user.FirstName = "Student";
        user.LastName = "User";
        var repository = new FakeUserRepository
        {
            UserOwnsAnyActiveClub = true
        };
        repository.QueueUserByEntraObjectId(user);
        var service = new UserService(repository);

        var result = await service.GetOrCreateCurrentUserAsync(
            new CurrentUserRequest("entra-6", "leader@example.edu", "Leader User", "Student", "User"),
            repairStaleClubLeaderRole: true,
            CancellationToken.None);

        Assert.Equal(AppRole.ClubLeader, user.Role);
        Assert.Equal(UserRoleLabels.ClubLeader, result.Role);
        Assert.Equal(0, repository.SaveChangesCount);
    }
}
