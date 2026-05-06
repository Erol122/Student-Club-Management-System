using SCMS.Domain.Enums;

namespace SCMS.Application.Clubs;

public sealed record ClubMemberDto(
    Guid Id,
    Guid UserId,
    string Name,
    string Email,
    ClubMembershipRole Role,
    ClubMembershipStatus Status,
    DateTimeOffset JoinedAt);
