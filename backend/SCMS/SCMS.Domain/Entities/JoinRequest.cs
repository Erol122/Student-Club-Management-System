using SCMS.Domain.Common;
using SCMS.Domain.Enums;

namespace SCMS.Domain.Entities;

public sealed class JoinRequest : BaseEntity
{
    public Guid ClubId { get; set; }
    public Guid UserId { get; set; }
    public JoinRequestStatus Status { get; set; } = JoinRequestStatus.Pending;
    public string? Message { get; set; }
    public DateTimeOffset SubmittedAt { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }

    public Club Club { get; set; } = null!;
    public User User { get; set; } = null!;
    public User? ReviewedByUser { get; set; }
}
