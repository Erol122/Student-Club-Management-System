namespace SCMS.Application.ClubContent;

public sealed record UpdateEventRequest(
    string Title,
    string? Description,
    string? Location,
    DateTimeOffset StartAt,
    DateTimeOffset? EndAt);
