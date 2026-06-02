namespace SCMS.Application.ClubContent;

public sealed record CreateAnnouncementRequest(
    string Title,
    string Body,
    string? Audience);
