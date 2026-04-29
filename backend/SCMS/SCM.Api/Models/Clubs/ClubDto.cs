using SCMS.Domain.Enums;

namespace SCM.Api.Models.Clubs;

public sealed record ClubDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    string? Category,
    ClubStatus Status,
    Guid? CreatedByUserId,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
