using SCMS.Domain.Common;
using SCMS.Domain.Enums;

namespace SCMS.Domain.Entities;

public sealed class EventResponse : BaseEntity
{
    public Guid EventId { get; set; }
    public Guid UserId { get; set; }
    public EventAttendanceResponse Response { get; set; } = EventAttendanceResponse.Going;
    public DateTimeOffset RespondedAt { get; set; }

    public Event Event { get; set; } = null!;
    public User User { get; set; } = null!;
}
