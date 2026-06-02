namespace SCMS.Application.ClubContent;

public sealed record ClubEventDto(
    Guid Id,
    Guid ClubId,
    string Title,
    string? Description,
    string? Location,
    DateTimeOffset StartAt,
    DateTimeOffset EndAt,
    string Status,
    string Visibility,
    string Author,
    DateTimeOffset CreatedAt);
