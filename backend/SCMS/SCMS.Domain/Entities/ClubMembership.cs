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
}
