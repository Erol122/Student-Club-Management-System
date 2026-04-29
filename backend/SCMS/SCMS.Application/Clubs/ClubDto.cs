using SCMS.Domain.Enums;

namespace SCMS.Application.Clubs;

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
