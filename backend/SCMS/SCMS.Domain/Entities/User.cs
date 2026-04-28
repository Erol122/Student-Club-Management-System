using SCMS.Domain.Common;
using SCMS.Domain.Enums;

namespace SCMS.Domain.Entities;

public sealed class User : BaseEntity
{
    public string EntraObjectId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public UserStatus Status { get; set; } = UserStatus.Active;
    public DateTimeOffset? LastLoginAt { get; set; }

    public ICollection<Announcement> CreatedAnnouncements { get; set; } = [];
    public ICollection<ClubMembership> ApprovedMemberships { get; set; } = [];
    public ICollection<Club> CreatedClubs { get; set; } = [];
    public ICollection<Event> CreatedEvents { get; set; } = [];
    public ICollection<ClubMembership> ClubMemberships { get; set; } = [];
    public ICollection<EventResponse> EventResponses { get; set; } = [];
    public ICollection<JoinRequest> JoinRequests { get; set; } = [];
    public ICollection<JoinRequest> ReviewedJoinRequests { get; set; } = [];
}
