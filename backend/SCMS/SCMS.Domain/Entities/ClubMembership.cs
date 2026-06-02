using SCMS.Domain.Common;
using SCMS.Domain.Enums;

namespace SCMS.Domain.Entities;

public sealed class ClubMembership : BaseEntity
{
    public Guid ClubId { get; set; }
    public Guid UserId { get; set; }
    public ClubMembershipRole Role { get; set; } = ClubMembershipRole.Member;
    public ClubMembershipStatus Status { get; set; } = ClubMembershipStatus.Pending;
    public DateTimeOffset JoinedAt { get; set; }
    public Guid? ApprovedByUserId { get; set; }

    public User? ApprovedByUser { get; set; }
    public Club Club { get; set; } = null!;
    public User User { get; set; } = null!;

    public static ClubMembership CreatePendingPresident(Club club, User proposer, DateTimeOffset joinedAt)
    {
        return new ClubMembership
        {
            Club = club,
            ClubId = club.Id,
            User = proposer,
            UserId = proposer.Id,
            Role = ClubMembershipRole.President,
            Status = ClubMembershipStatus.Pending,
            JoinedAt = joinedAt
        };
    }

    public static ClubMembership CreateApproved(
        Guid clubId,
        Guid userId,
        ClubMembershipRole role,
        Guid approvedByUserId,
        DateTimeOffset joinedAt)
    {
        return CreateReviewed(clubId, userId, role, ClubMembershipStatus.Approved, approvedByUserId, joinedAt);
    }

    public static ClubMembership CreateReviewed(
        Guid clubId,
        Guid userId,
        ClubMembershipRole role,
        ClubMembershipStatus status,
        Guid reviewedByUserId,
        DateTimeOffset joinedAt)
    {
        return new ClubMembership
        {
            ClubId = clubId,
            UserId = userId,
            Role = role,
            Status = status,
            JoinedAt = joinedAt,
            ApprovedByUserId = reviewedByUserId
        };
    }

    public void ApproveAs(ClubMembershipRole role, Guid approvedByUserId)
    {
        Role = role;
        Status = ClubMembershipStatus.Approved;
        ApprovedByUserId = approvedByUserId;
    }

    public void RejectAs(ClubMembershipRole role, Guid reviewedByUserId)
    {
        Role = role;
        Status = ClubMembershipStatus.Rejected;
        ApprovedByUserId = reviewedByUserId;
    }
}
