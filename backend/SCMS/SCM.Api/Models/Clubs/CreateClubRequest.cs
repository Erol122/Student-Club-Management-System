using SCMS.Domain.Enums;

namespace SCM.Api.Models.Clubs;

public sealed record CreateClubRequest(
    string Name,
    string? Slug,
    string? Description,
    string? Category,
    ClubStatus Status = ClubStatus.Draft);
