using SCMS.Application.Clubs;
using SCMS.Application.Common;
using SCMS.Domain.Enums;
using SCMS.Tests.TestDoubles;

namespace SCMS.Tests.Application;

public sealed class ClubServiceTests
{
    [Fact]
    public async Task GetClubsAsync_UsesLeaderScopeAndMapsOnlyApprovedMembers()
    {
        var repository = new FakeClubRepository();
        var club = TestData.ActiveClub();
        var president = TestData.User(displayName: "Zoe President", email: "zoe@example.edu");
        var member = TestData.User(displayName: "Amy Member", email: "amy@example.edu");
        var pending = TestData.User(displayName: "Pending Student", email: "pending@example.edu");
        TestData.AddMembership(club, president, ClubMembershipRole.President);
        TestData.AddMembership(club, member, ClubMembershipRole.Member);
        TestData.AddMembership(club, pending, ClubMembershipRole.Member, ClubMembershipStatus.Pending);
        repository.ClubsToList = [club];
        var currentUser = TestData.CurrentUser(AppRole.ClubLeader);
        var service = new ClubService(repository);

        var clubs = await service.GetClubsAsync(currentUser, "robot", "Engineering", CancellationToken.None);

        var dto = Assert.Single(clubs);
        Assert.Equal(club.Id, dto.Id);
        Assert.Equal(currentUser.Id, repository.LastListRequest?.CurrentUserId);
        Assert.True(repository.LastListRequest?.OnlyOwnedClubs);
        Assert.Equal("robot", repository.LastListRequest?.Search);
        Assert.Equal("Engineering", repository.LastListRequest?.Category);
        Assert.Collection(
            dto.Members,
            first =>
            {
                Assert.Equal(member.Id, first.UserId);
                Assert.Equal(ClubMembershipRole.Member, first.Role);
            },
            second =>
            {
                Assert.Equal(president.Id, second.UserId);
                Assert.Equal(ClubMembershipRole.President, second.Role);
            });
    }

    [Fact]
    public async Task CreateClubAsync_WhenUserIsNotAdmin_ReturnsForbiddenAndSkipsRepository()
    {
        var repository = new FakeClubRepository();
        var service = new ClubService(repository);

        var result = await service.CreateClubAsync(
            TestData.CurrentUser(AppRole.Member),
            new CreateClubRequest("Robotics", null, null, null),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.Forbidden);
        Assert.Null(repository.AddedClub);
        Assert.Equal(0, repository.SaveChangesCount);
    }

    [Fact]
    public async Task CreateClubAsync_WhenRequestIsInvalid_ReturnsValidationErrors()
    {
        var repository = new FakeClubRepository();
        var service = new ClubService(repository);

        var result = await service.CreateClubAsync(
            TestData.CurrentUser(AppRole.Admin),
            new CreateClubRequest(
                "",
                new string('x', 151),
                null,
                null,
                (ClubStatus)999),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.Validation);
        Assert.Contains("name", result.Error!.Errors!.Keys);
        Assert.Contains("slug", result.Error.Errors.Keys);
        Assert.Contains("status", result.Error.Errors.Keys);
        Assert.Null(repository.AddedClub);
    }

    [Fact]
    public async Task CreateClubAsync_WhenSlugAlreadyExists_ReturnsConflict()
    {
        var repository = new FakeClubRepository
        {
            SlugExists = true
        };
        var service = new ClubService(repository);

        var result = await service.CreateClubAsync(
            TestData.CurrentUser(AppRole.Admin),
            new CreateClubRequest("Robotics Club", null, null, null),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.Conflict);
        Assert.Equal("robotics-club", repository.LastSlugCheck?.Slug);
        Assert.Null(repository.AddedClub);
    }

    [Fact]
    public async Task CreateClubAsync_WhenValid_NormalizesAndPersistsClub()
    {
        var repository = new FakeClubRepository();
        var service = new ClubService(repository);

        var result = await service.CreateClubAsync(
            TestData.CurrentUser(AppRole.Admin),
            new CreateClubRequest(
                "  Robotics & AI!  ",
                null,
                "  Build robots.  ",
                "  Engineering  ",
                ClubStatus.Active,
                "  Discord  ",
                "  https://example.edu/robotics  "),
            CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.NotNull(repository.AddedClub);
        Assert.Equal("Robotics & AI!", repository.AddedClub.Name);
        Assert.Equal("robotics-ai", repository.AddedClub.Slug);
        Assert.Equal("Build robots.", repository.AddedClub.Description);
        Assert.Equal("Engineering", repository.AddedClub.Category);
        Assert.Equal("Discord", repository.AddedClub.GroupPlatform);
        Assert.Equal("https://example.edu/robotics", repository.AddedClub.GroupLink);
        Assert.Equal(ClubStatus.Active, repository.AddedClub.Status);
        Assert.Equal(1, repository.SaveChangesCount);
        Assert.Equal(repository.AddedClub.Id, result.Value!.Id);
    }

    [Fact]
    public async Task UpdateClubAsync_WhenClubDoesNotExist_ReturnsNotFound()
    {
        var repository = new FakeClubRepository();
        var service = new ClubService(repository);

        var result = await service.UpdateClubAsync(
            TestData.CurrentUser(AppRole.Admin),
            Guid.NewGuid(),
            new UpdateClubRequest("Robotics", null, null, null, ClubStatus.Active),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.NotFound);
        Assert.Equal(0, repository.SaveChangesCount);
    }

    [Fact]
    public async Task UpdateClubAsync_WhenCreatedByUserDoesNotExist_ReturnsValidation()
    {
        var repository = new FakeClubRepository
        {
            ClubForUpdate = TestData.ActiveClub(),
            UserExists = false
        };
        var service = new ClubService(repository);

        var result = await service.UpdateClubAsync(
            TestData.CurrentUser(AppRole.Admin),
            repository.ClubForUpdate.Id,
            new UpdateClubRequest(
                "Robotics",
                "robotics",
                null,
                null,
                ClubStatus.Active,
                CreatedByUserId: Guid.NewGuid()),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.Validation);
        Assert.Contains(nameof(UpdateClubRequest.CreatedByUserId), result.Error!.Errors!.Keys);
        Assert.Equal(0, repository.SaveChangesCount);
    }

    [Fact]
    public async Task UpdateClubAsync_WhenValid_NormalizesEmptyFieldsAndSaves()
    {
        var club = TestData.ActiveClub();
        var repository = new FakeClubRepository
        {
            ClubForUpdate = club
        };
        var service = new ClubService(repository);

        var result = await service.UpdateClubAsync(
            TestData.CurrentUser(AppRole.Admin),
            club.Id,
            new UpdateClubRequest(
                "  Updated Club  ",
                " Updated Club!!! ",
                " ",
                "  Community  ",
                ClubStatus.Archived,
                CreatedByUserId: Guid.Empty,
                GroupPlatform: " ",
                GroupLink: "  https://example.edu/updated  "),
            CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal("Updated Club", club.Name);
        Assert.Equal("updated-club", club.Slug);
        Assert.Null(club.Description);
        Assert.Equal("Community", club.Category);
        Assert.Null(club.GroupPlatform);
        Assert.Equal("https://example.edu/updated", club.GroupLink);
        Assert.Equal(ClubStatus.Archived, club.Status);
        Assert.Null(club.CreatedByUserId);
        Assert.Equal(1, repository.SaveChangesCount);
    }

    private static void AssertFailure<T>(ServiceResult<T> result, ServiceErrorType errorType)
    {
        Assert.False(result.Succeeded);
        Assert.NotNull(result.Error);
        Assert.Equal(errorType, result.Error.Type);
    }
}
