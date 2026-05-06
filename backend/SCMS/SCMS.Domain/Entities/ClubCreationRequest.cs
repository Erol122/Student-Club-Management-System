using SCMS.Domain.Common;
using SCMS.Domain.Enums;

namespace SCMS.Domain.Entities;

public sealed class ClubCreationRequest : BaseEntity
{
    public string ClubName { get; set; } = string.Empty;
    public string? ClubDescription { get; set; }
    public string? ClubCategory { get; set; }
    public string? Message { get; set; }
    public ClubCreationRequestStatus Status { get; set; } = ClubCreationRequestStatus.Pending;
    public Guid RequestedByUserId { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public string? ReviewNote { get; set; }
    public Guid? CreatedClubId { get; set; }

    public User RequestedByUser { get; set; } = null!;
    public User? ReviewedByUser { get; set; }
    public Club? CreatedClub { get; set; }
}
