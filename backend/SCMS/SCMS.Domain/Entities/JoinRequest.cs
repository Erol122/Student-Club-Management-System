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

    public static JoinRequest Submit(
        Guid clubId,
        Guid userId,
        string? message,
        DateTimeOffset submittedAt)
    {
        return new JoinRequest
        {
            ClubId = clubId,
            UserId = userId,
            Status = JoinRequestStatus.Pending,
            Message = message,
            SubmittedAt = submittedAt
        };
    }

    public void Approve(Guid reviewedByUserId, DateTimeOffset reviewedAt)
    {
        Review(JoinRequestStatus.Approved, reviewedByUserId, reviewedAt);
    }

    public void Reject(Guid reviewedByUserId, DateTimeOffset reviewedAt)
    {
        Review(JoinRequestStatus.Rejected, reviewedByUserId, reviewedAt);
    }

    private void Review(
        JoinRequestStatus status,
        Guid reviewedByUserId,
        DateTimeOffset reviewedAt)
    {
        Status = status;
        ReviewedByUserId = reviewedByUserId;
        ReviewedAt = reviewedAt;
    }
}
