using SCMS.Domain.Entities;
using SCMS.Domain.Enums;
using SCMS.Tests.TestDoubles;

namespace SCMS.Tests.Domain;

public sealed class DomainEntityTests
{
    [Fact]
    public void ClubPropose_CreatesDraftProposalLinkedToProposer()
    {
        var proposer = TestData.User(displayName: "Ada Lovelace");

        var club = Club.Propose("  AI Guild  ", "ai-guild", "Build useful AI tools.", "Technology", null, proposer);

        Assert.NotEqual(Guid.Empty, club.Id);
        Assert.Equal("  AI Guild  ", club.Name);
        Assert.Equal("ai-guild", club.Slug);
        Assert.Equal("Build useful AI tools.", club.Description);
        Assert.Equal("Technology", club.Category);
        Assert.Equal(ClubStatus.Draft, club.Status);
        Assert.Equal(proposer.Id, club.CreatedByUserId);
        Assert.Same(proposer, club.CreatedByUser);
    }

    [Fact]
    public void ClubApproveProposal_ActivatesClubAndPromotesNonAdminOwner()
    {
        var owner = TestData.User(AppRole.Member);
        var club = TestData.DraftClub(owner);

        club.ApproveProposal(owner);

        Assert.Equal(ClubStatus.Active, club.Status);
        Assert.Equal(AppRole.ClubLeader, owner.Role);
    }

    [Fact]
    public void ClubApproveProposal_DoesNotDemoteAdminOwner()
    {
        var owner = TestData.User(AppRole.Admin);
        var club = TestData.DraftClub(owner);

        club.ApproveProposal(owner);

        Assert.Equal(ClubStatus.Active, club.Status);
        Assert.Equal(AppRole.Admin, owner.Role);
    }

    [Fact]
    public void ClubMembershipApproveAndReject_UpdateReviewState()
    {
        var reviewerId = Guid.NewGuid();
        var membership = ClubMembership.CreateReviewed(
            Guid.NewGuid(),
            Guid.NewGuid(),
            ClubMembershipRole.Member,
            ClubMembershipStatus.Pending,
            reviewerId,
            DateTimeOffset.UtcNow.AddDays(-1));

        var approverId = Guid.NewGuid();
        membership.ApproveAs(ClubMembershipRole.President, approverId);

        Assert.Equal(ClubMembershipRole.President, membership.Role);
        Assert.Equal(ClubMembershipStatus.Approved, membership.Status);
        Assert.Equal(approverId, membership.ApprovedByUserId);

        var rejecterId = Guid.NewGuid();
        membership.RejectAs(ClubMembershipRole.Member, rejecterId);

        Assert.Equal(ClubMembershipRole.Member, membership.Role);
        Assert.Equal(ClubMembershipStatus.Rejected, membership.Status);
        Assert.Equal(rejecterId, membership.ApprovedByUserId);
    }

    [Fact]
    public void JoinRequestApproveAndReject_UpdateStatusAndReviewer()
    {
        var submittedAt = DateTimeOffset.UtcNow.AddDays(-3);
        var joinRequest = JoinRequest.Submit(Guid.NewGuid(), Guid.NewGuid(), "I can help.", submittedAt);
        var approverId = Guid.NewGuid();
        var approvedAt = DateTimeOffset.UtcNow.AddDays(-1);

        joinRequest.Approve(approverId, approvedAt);

        Assert.Equal(JoinRequestStatus.Approved, joinRequest.Status);
        Assert.Equal(approverId, joinRequest.ReviewedByUserId);
        Assert.Equal(approvedAt, joinRequest.ReviewedAt);

        var rejecterId = Guid.NewGuid();
        var rejectedAt = DateTimeOffset.UtcNow;
        joinRequest.Reject(rejecterId, rejectedAt);

        Assert.Equal(JoinRequestStatus.Rejected, joinRequest.Status);
        Assert.Equal(rejecterId, joinRequest.ReviewedByUserId);
        Assert.Equal(rejectedAt, joinRequest.ReviewedAt);
        Assert.Equal(submittedAt, joinRequest.SubmittedAt);
    }

    [Fact]
    public void UserDemoteToMember_OnlyDemotesClubLeaders()
    {
        var leader = TestData.User(AppRole.ClubLeader);
        var admin = TestData.User(AppRole.Admin);

        leader.DemoteToMember();
        admin.DemoteToMember();

        Assert.Equal(AppRole.Member, leader.Role);
        Assert.Equal(AppRole.Admin, admin.Role);
    }
}
