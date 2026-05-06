using SCMS.Domain.Enums;

namespace SCMS.Application.ClubCreationRequests;

public sealed record ClubCreationRequestDto(
    Guid Id,
    string ClubName,
    string? ClubDescription,
    string? ClubCategory,
    string? Message,
    ClubCreationRequestStatus Status,
    Guid RequestedByUserId,
    string RequestedByUserDisplayName,
    string RequestedByUserEmail,
    Guid? ReviewedByUserId,
    DateTimeOffset? ReviewedAt,
    string? ReviewNote,
    Guid? CreatedClubId,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
