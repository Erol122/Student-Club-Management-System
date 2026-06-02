using SCMS.Domain.Common;
using SCMS.Domain.Enums;

namespace SCMS.Domain.Entities;

public sealed class Club : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? ImageKey { get; set; }
    public string? GroupPlatform { get; set; }
    public string? GroupLink { get; set; }
    public ClubStatus Status { get; set; } = ClubStatus.Draft;
    public Guid? CreatedByUserId { get; set; }

    public User? CreatedByUser { get; set; }
    public ICollection<Announcement> Announcements { get; set; } = [];
    public ICollection<ClubMembership> Memberships { get; set; } = [];
    public ICollection<Event> Events { get; set; } = [];
    public ICollection<JoinRequest> JoinRequests { get; set; } = [];

    public static Club CreateManaged(
        string name,
        string slug,
        string? description,
        string? category,
        string? imageKey,
        string? groupPlatform,
        string? groupLink,
        ClubStatus status,
        Guid? createdByUserId)
    {
        return new Club
        {
            Name = name,
            Slug = slug,
            Description = description,
            Category = category,
            ImageKey = imageKey,
            GroupPlatform = groupPlatform,
            GroupLink = groupLink,
            Status = status,
            CreatedByUserId = createdByUserId
        };
    }

    public static Club Propose(
        string name,
        string slug,
        string mission,
        string? category,
        string? imageKey,
        User proposer)
    {
        return new Club
        {
            Id = Guid.NewGuid(),
            Name = name,
            Slug = slug,
            Description = mission,
            Category = category,
            ImageKey = imageKey,
            Status = ClubStatus.Draft,
            CreatedByUserId = proposer.Id,
            CreatedByUser = proposer
        };
    }

    public void UpdateDetails(
        string name,
        string slug,
        string? description,
        string? category,
        string? imageKey,
        string? groupPlatform,
        string? groupLink,
        ClubStatus status,
        Guid? createdByUserId)
    {
        Name = name;
        Slug = slug;
        Description = description;
        Category = category;
        ImageKey = imageKey;
        GroupPlatform = groupPlatform;
        GroupLink = groupLink;
        Status = status;
        CreatedByUserId = createdByUserId;
    }

    public void ApproveProposal(User owner)
    {
        Status = ClubStatus.Active;
        owner.PromoteToClubLeader();
    }

    public void RejectProposal()
    {
        Status = ClubStatus.Archived;
    }
}
