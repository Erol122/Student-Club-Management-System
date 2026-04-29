using SCMS.Domain.Enums;

namespace SCM.Api.Models.Clubs;

public sealed record UpdateClubRequest(
    string Name,
    string? Slug,
    string? Description,
    string? Category,
    ClubStatus Status,
    Guid? CreatedByUserId = null);
