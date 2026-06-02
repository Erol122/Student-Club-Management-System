namespace SCMS.Application.ClubContent;

public sealed record CreateEventRequest(
    string Title,
    string? Description,
    string? Location,
    DateTimeOffset StartAt,
    DateTimeOffset? EndAt);
