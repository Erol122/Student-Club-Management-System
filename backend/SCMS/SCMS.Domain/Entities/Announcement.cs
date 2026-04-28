using SCMS.Domain.Common;
using SCMS.Domain.Enums;

namespace SCMS.Domain.Entities;

public sealed class Announcement : BaseEntity
{
    public Guid ClubId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public AnnouncementStatus Status { get; set; } = AnnouncementStatus.Draft;
    public AnnouncementAudience Audience { get; set; } = AnnouncementAudience.Members;
    public DateTimeOffset? PublishedAt { get; set; }
    public Guid CreatedByUserId { get; set; }

    public Club Club { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
}
