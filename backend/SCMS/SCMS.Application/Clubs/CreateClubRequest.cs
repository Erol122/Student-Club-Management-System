using SCMS.Domain.Enums;

namespace SCMS.Application.Clubs;

public sealed record CreateClubRequest(
    string Name,
    string? Slug,
    string? Description,
    string? Category,
    ClubStatus Status = ClubStatus.Draft);
