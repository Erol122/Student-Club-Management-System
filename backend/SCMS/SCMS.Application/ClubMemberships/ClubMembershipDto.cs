using SCMS.Domain.Enums;

namespace SCMS.Application.ClubMemberships;

public sealed record ClubMembershipDto(
    Guid Id,
    Guid ClubId,
    string ClubName,
    Guid UserId,
    string UserDisplayName,
    string UserEmail,
    ClubMembershipRole Role,
    ClubMembershipStatus Status,
    DateTimeOffset JoinedAt,
    Guid? ApprovedByUserId,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
