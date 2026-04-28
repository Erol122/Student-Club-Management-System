using SCMS.Domain.Common;
using SCMS.Domain.Enums;

namespace SCMS.Domain.Entities;

public sealed class Event : BaseEntity
{
    public Guid ClubId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public DateTimeOffset StartAt { get; set; }
    public DateTimeOffset EndAt { get; set; }
    public int? Capacity { get; set; }
    public EventVisibility Visibility { get; set; } = EventVisibility.ClubOnly;
    public EventStatus Status { get; set; } = EventStatus.Draft;
    public Guid CreatedByUserId { get; set; }

    public Club Club { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public ICollection<EventResponse> Responses { get; set; } = [];
}
