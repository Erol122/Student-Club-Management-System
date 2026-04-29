using SCMS.Domain.Enums;

namespace SCMS.Application.Clubs;

public sealed record UpdateClubRequest(
    string Name,
    string? Slug,
    string? Description,
    string? Category,
    ClubStatus Status,
    Guid? CreatedByUserId = null);
