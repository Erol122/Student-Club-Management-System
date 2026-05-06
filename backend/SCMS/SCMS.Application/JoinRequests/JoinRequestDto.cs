using SCMS.Domain.Enums;

namespace SCMS.Application.JoinRequests;

public sealed record JoinRequestDto(
    Guid Id,
    Guid ClubId,
    string ClubName,
    Guid UserId,
    string UserDisplayName,
    string UserEmail,
    JoinRequestStatus Status,
    string? Message,
    DateTimeOffset SubmittedAt,
    Guid? ReviewedByUserId,
    DateTimeOffset? ReviewedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
