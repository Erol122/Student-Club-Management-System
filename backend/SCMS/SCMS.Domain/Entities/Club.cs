using SCMS.Domain.Common;
using SCMS.Domain.Enums;

namespace SCMS.Domain.Entities;

public sealed class Club : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Category { get; set; }
    public ClubStatus Status { get; set; } = ClubStatus.Draft;
    public Guid? CreatedByUserId { get; set; }

    public User? CreatedByUser { get; set; }
    public ICollection<Announcement> Announcements { get; set; } = [];
    public ICollection<ClubMembership> Memberships { get; set; } = [];
    public ICollection<Event> Events { get; set; } = [];
    public ICollection<JoinRequest> JoinRequests { get; set; } = [];
}
