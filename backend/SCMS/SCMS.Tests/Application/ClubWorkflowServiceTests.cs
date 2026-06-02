using SCMS.Application.ClubWorkflows;
using SCMS.Application.Common;
using SCMS.Domain.Enums;
using SCMS.Tests.TestDoubles;

namespace SCMS.Tests.Application;

public sealed class ClubWorkflowServiceTests
{
    [Fact]
    public async Task SubmitClubProposalAsync_WhenRequestIsInvalid_ReturnsValidation()
    {
        var repository = new FakeClubWorkflowRepository();
        var service = new ClubWorkflowService(repository);

        var result = await service.SubmitClubProposalAsync(
            TestData.CurrentUser(),
            new SubmitClubProposalRequest("", new string('x', 101), ""),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.Validation);
        Assert.Contains(nameof(SubmitClubProposalRequest.Name), result.Error!.Errors!.Keys);
        Assert.Contains(nameof(SubmitClubProposalRequest.Category), result.Error.Errors.Keys);
        Assert.Contains(nameof(SubmitClubProposalRequest.Mission), result.Error.Errors.Keys);
        Assert.Empty(repository.AddedClubs);
    }

    [Fact]
    public async Task SubmitClubProposalAsync_WhenCurrentUserIsMissing_ReturnsNotFound()
    {
        var repository = new FakeClubWorkflowRepository();
        var service = new ClubWorkflowService(repository);

        var result = await service.SubmitClubProposalAsync(
            TestData.CurrentUser(),
            new SubmitClubProposalRequest("Chess Club", "Games", "Play chess."),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.NotFound);
        Assert.Empty(repository.AddedClubs);
    }

    [Fact]
    public async Task SubmitClubProposalAsync_WhenSlugExists_ReturnsConflict()
    {
        var proposer = TestData.User();
        var repository = new FakeClubWorkflowRepository
        {
            GetUserById = _ => proposer,
            SlugExists = _ => true
        };
        var service = new ClubWorkflowService(repository);

        var result = await service.SubmitClubProposalAsync(
            TestData.CurrentUser(id: proposer.Id),
            new SubmitClubProposalRequest("Chess Club", "Games", "Play chess."),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.Conflict);
        Assert.Empty(repository.AddedClubs);
    }

    [Fact]
    public async Task SubmitClubProposalAsync_WhenValid_CreatesDraftClubAndPendingPresidentMembership()
    {
        var proposer = TestData.User(displayName: "Ada Student", email: "ada@example.edu");
        var repository = new FakeClubWorkflowRepository
        {
            GetUserById = _ => proposer
        };
        var service = new ClubWorkflowService(repository);

        var result = await service.SubmitClubProposalAsync(
            TestData.CurrentUser(id: proposer.Id, email: proposer.Email, displayName: proposer.DisplayName),
            new SubmitClubProposalRequest("  Chess & Strategy  ", "  Games  ", "  Think together.  "),
            CancellationToken.None);

        Assert.True(result.Succeeded);
        var club = Assert.Single(repository.AddedClubs);
        Assert.Equal("Chess & Strategy", club.Name);
        Assert.Equal("chess-strategy", club.Slug);
        Assert.Equal("Think together.", club.Description);
        Assert.Equal("Games", club.Category);
        Assert.Equal(ClubStatus.Draft, club.Status);
        Assert.Equal(proposer.Id, club.CreatedByUserId);

        var membership = Assert.Single(repository.AddedMemberships);
        Assert.Equal(club.Id, membership.ClubId);
        Assert.Equal(proposer.Id, membership.UserId);
        Assert.Equal(ClubMembershipRole.President, membership.Role);
        Assert.Equal(ClubMembershipStatus.Pending, membership.Status);
        Assert.Equal(1, repository.SaveChangesCount);
        Assert.Equal(club.Id, result.Value!.Id);
    }

    [Fact]
    public async Task GetPendingClubProposalsAsync_WhenUserIsNotAdmin_ReturnsEmptyList()
    {
        var proposer = TestData.User();
        var repository = new FakeClubWorkflowRepository
        {
            PendingClubProposals = [TestData.DraftClub(proposer)]
        };
        var service = new ClubWorkflowService(repository);

        var result = await service.GetPendingClubProposalsAsync(TestData.CurrentUser(), CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Empty(result.Value!);
    }

    [Fact]
    public async Task ApproveClubProposalAsync_WhenUserIsNotAdmin_ReturnsForbidden()
    {
        var service = new ClubWorkflowService(new FakeClubWorkflowRepository());

        var result = await service.ApproveClubProposalAsync(
            TestData.CurrentUser(AppRole.Member),
            Guid.NewGuid(),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.Forbidden);
    }

    [Fact]
    public async Task ApproveClubProposalAsync_WhenValid_ActivatesClubAndApprovesPresidentMembership()
    {
        var proposer = TestData.User(AppRole.Member);
        var club = TestData.DraftClub(proposer);
        var membership = TestData.AddMembership(
            club,
            proposer,
            ClubMembershipRole.President,
            ClubMembershipStatus.Pending);
        var repository = new FakeClubWorkflowRepository
        {
            GetClubProposalByIdForUpdate = _ => club,
            GetUserById = _ => proposer,
            GetClubByIdForUpdate = _ => club
        };
        var admin = TestData.CurrentUser(AppRole.Admin);
        var service = new ClubWorkflowService(repository);

        var result = await service.ApproveClubProposalAsync(admin, club.Id, CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal(ClubStatus.Active, club.Status);
        Assert.Equal(AppRole.ClubLeader, proposer.Role);
        Assert.Equal(ClubMembershipStatus.Approved, membership.Status);
        Assert.Equal(ClubMembershipRole.President, membership.Role);
        Assert.Equal(admin.Id, membership.ApprovedByUserId);
        Assert.Empty(repository.AddedMemberships);
        Assert.Equal(1, repository.SaveChangesCount);
        Assert.Equal(ClubStatus.Active, result.Value!.Status);
    }

    [Fact]
    public async Task RejectClubProposalAsync_WhenValid_ArchivesClubAndRejectsPendingPresidentMembership()
    {
        var proposer = TestData.User(AppRole.Member);
        var club = TestData.DraftClub(proposer);
        var membership = TestData.AddMembership(
            club,
            proposer,
            ClubMembershipRole.President,
            ClubMembershipStatus.Pending);
        var repository = new FakeClubWorkflowRepository
        {
            GetClubProposalByIdForUpdate = _ => club,
            GetClubByIdForUpdate = _ => club
        };
        var admin = TestData.CurrentUser(AppRole.Admin);
        var service = new ClubWorkflowService(repository);

        var result = await service.RejectClubProposalAsync(admin, club.Id, CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal(ClubStatus.Archived, club.Status);
        Assert.Equal(ClubMembershipStatus.Rejected, membership.Status);
        Assert.Equal(admin.Id, membership.ApprovedByUserId);
        Assert.Equal(1, repository.SaveChangesCount);
    }

    [Fact]
    public async Task SubmitJoinRequestAsync_WhenClubIsInactive_ReturnsNotFound()
    {
        var club = TestData.ActiveClub();
        club.Status = ClubStatus.Archived;
        var repository = new FakeClubWorkflowRepository
        {
            GetClubById = _ => club
        };
        var service = new ClubWorkflowService(repository);

        var result = await service.SubmitJoinRequestAsync(
            TestData.CurrentUser(),
            club.Id,
            new SubmitJoinRequestRequest("Please."),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.NotFound);
        Assert.Empty(repository.AddedJoinRequests);
    }

    [Fact]
    public async Task SubmitJoinRequestAsync_WhenUserAlreadyMember_ReturnsConflict()
    {
        var club = TestData.ActiveClub();
        var currentUser = TestData.CurrentUser(id: Guid.NewGuid());
        var repository = new FakeClubWorkflowRepository
        {
            GetClubById = _ => club,
            UserExists = _ => true,
            UserHasApprovedMembership = (_, _) => true
        };
        var service = new ClubWorkflowService(repository);

        var result = await service.SubmitJoinRequestAsync(
            currentUser,
            club.Id,
            new SubmitJoinRequestRequest("Please."),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.Conflict);
        Assert.Empty(repository.AddedJoinRequests);
    }

    [Fact]
    public async Task SubmitJoinRequestAsync_WhenValid_CreatesPendingRequestWithTrimmedMessage()
    {
        var club = TestData.ActiveClub();
        var currentUser = TestData.CurrentUser(id: Guid.NewGuid(), email: "joiner@example.edu", displayName: "Joiner");
        var repository = new FakeClubWorkflowRepository
        {
            GetClubById = _ => club,
            UserExists = _ => true
        };
        var service = new ClubWorkflowService(repository);

        var result = await service.SubmitJoinRequestAsync(
            currentUser,
            club.Id,
            new SubmitJoinRequestRequest("  I can help organize events.  "),
            CancellationToken.None);

        Assert.True(result.Succeeded);
        var joinRequest = Assert.Single(repository.AddedJoinRequests);
        Assert.Equal(club.Id, joinRequest.ClubId);
        Assert.Equal(currentUser.Id, joinRequest.UserId);
        Assert.Equal("I can help organize events.", joinRequest.Message);
        Assert.Equal(JoinRequestStatus.Pending, joinRequest.Status);
        Assert.Equal(1, repository.SaveChangesCount);
        Assert.Equal("Joiner", result.Value!.Student);
    }

    [Fact]
    public async Task ApproveJoinRequestAsync_WhenReviewerCannotManageClub_ReturnsForbidden()
    {
        var club = TestData.ActiveClub();
        var student = TestData.User();
        var joinRequest = TestData.PendingJoinRequest(club, student);
        var repository = new FakeClubWorkflowRepository
        {
            GetJoinRequestByIdForUpdate = _ => joinRequest,
            UserOwnsClub = (_, _) => false
        };
        var service = new ClubWorkflowService(repository);

        var result = await service.ApproveJoinRequestAsync(
            TestData.CurrentUser(AppRole.ClubLeader),
            joinRequest.Id,
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.Forbidden);
        Assert.Equal(JoinRequestStatus.Pending, joinRequest.Status);
    }

    [Fact]
    public async Task ApproveJoinRequestAsync_WhenValid_ReviewsRequestAndCreatesMembership()
    {
        var club = TestData.ActiveClub();
        var student = TestData.User(email: "new@example.edu", displayName: "New Member");
        var joinRequest = TestData.PendingJoinRequest(club, student);
        var leader = TestData.CurrentUser(AppRole.ClubLeader);
        var repository = new FakeClubWorkflowRepository
        {
            GetJoinRequestByIdForUpdate = _ => joinRequest,
            UserOwnsClub = (_, _) => true,
            GetClubByIdForUpdate = _ => club
        };
        var service = new ClubWorkflowService(repository);

        var result = await service.ApproveJoinRequestAsync(leader, joinRequest.Id, CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal(JoinRequestStatus.Approved, joinRequest.Status);
        Assert.Equal(leader.Id, joinRequest.ReviewedByUserId);
        Assert.NotNull(joinRequest.ReviewedAt);
        var membership = Assert.Single(repository.AddedMemberships);
        Assert.Equal(club.Id, membership.ClubId);
        Assert.Equal(student.Id, membership.UserId);
        Assert.Equal(ClubMembershipStatus.Approved, membership.Status);
        Assert.Equal(ClubMembershipRole.Member, membership.Role);
        Assert.Equal(leader.Id, membership.ApprovedByUserId);
        Assert.Equal("New Member", result.Value!.Student);
    }

    [Fact]
    public async Task ApproveJoinRequestAsync_WhenAlreadyReviewed_ReturnsConflict()
    {
        var club = TestData.ActiveClub();
        var student = TestData.User();
        var joinRequest = TestData.PendingJoinRequest(club, student);
        joinRequest.Approve(Guid.NewGuid(), DateTimeOffset.UtcNow);
        var repository = new FakeClubWorkflowRepository
        {
            GetJoinRequestByIdForUpdate = _ => joinRequest,
            UserOwnsClub = (_, _) => true
        };
        var service = new ClubWorkflowService(repository);

        var result = await service.ApproveJoinRequestAsync(
            TestData.CurrentUser(AppRole.Admin),
            joinRequest.Id,
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.Conflict);
        Assert.Empty(repository.AddedMemberships);
    }

    [Fact]
    public async Task GetPendingJoinRequestsAsync_PassesAdminScopeToRepository()
    {
        var repository = new FakeClubWorkflowRepository();
        var admin = TestData.CurrentUser(AppRole.Admin);
        var service = new ClubWorkflowService(repository);

        var result = await service.GetPendingJoinRequestsAsync(admin, CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal(admin.Id, repository.LastPendingJoinRequestsQuery?.CurrentUserId);
        Assert.True(repository.LastPendingJoinRequestsQuery?.IncludeAllClubs);
    }

    [Fact]
    public async Task DeleteClubAsync_WhenUserIsNotAdmin_ReturnsForbidden()
    {
        var repository = new FakeClubWorkflowRepository();
        var service = new ClubWorkflowService(repository);

        var result = await service.DeleteClubAsync(
            TestData.CurrentUser(AppRole.Member),
            Guid.NewGuid(),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.Forbidden);
        Assert.Null(repository.RemovedClub);
    }

    [Fact]
    public async Task DeleteClubAsync_WhenValid_RemovesClubAndDemotesLeadersWithoutOtherActiveClubs()
    {
        var club = TestData.ActiveClub();
        var demotedLeader = TestData.User(AppRole.ClubLeader);
        var retainedLeader = TestData.User(AppRole.ClubLeader);
        TestData.AddMembership(club, demotedLeader, ClubMembershipRole.President);
        TestData.AddMembership(club, retainedLeader, ClubMembershipRole.President);
        var repository = new FakeClubWorkflowRepository
        {
            GetClubByIdForUpdate = _ => club,
            UserOwnsAnyActiveClub = (userId, _) => userId == retainedLeader.Id
        };
        var service = new ClubWorkflowService(repository);

        var result = await service.DeleteClubAsync(
            TestData.CurrentUser(AppRole.Admin),
            club.Id,
            CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Same(club, repository.RemovedClub);
        Assert.Equal(AppRole.Member, demotedLeader.Role);
        Assert.Equal(AppRole.ClubLeader, retainedLeader.Role);
        Assert.Equal(1, repository.SaveChangesCount);
    }

    private static void AssertFailure<T>(ServiceResult<T> result, ServiceErrorType errorType)
    {
        Assert.False(result.Succeeded);
        Assert.NotNull(result.Error);
        Assert.Equal(errorType, result.Error.Type);
    }

    private static void AssertFailure(ServiceResult result, ServiceErrorType errorType)
    {
        Assert.False(result.Succeeded);
        Assert.NotNull(result.Error);
        Assert.Equal(errorType, result.Error.Type);
    }
}
