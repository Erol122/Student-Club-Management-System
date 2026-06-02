namespace SCMS.Application.ClubContent;

public sealed record ClubAnnouncementDto(
    Guid Id,
    Guid ClubId,
    string Title,
    string Body,
    string Audience,
    string Author,
    DateTimeOffset PublishedAt,
    DateTimeOffset CreatedAt);
